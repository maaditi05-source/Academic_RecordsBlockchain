const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const DocumentController = require('../controllers/documentController');
const { authenticateToken } = require('../middleware/auth');

// Multer configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads');
        const fs = require('fs');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});
const fileFilter = (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only PDF, JPEG, PNG allowed'), false);
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

// ── Upload: file → IPFS → hash on blockchain ──────────────────────────────────
router.post('/upload', authenticateToken, upload.single('file'), DocumentController.uploadDocument);

// ── Verification ──────────────────────────────────────────────────────────────
router.post('/verify', upload.single('file'), DocumentController.verifyDocument);
router.get('/verify/:hash', DocumentController.verifyByHash);

// ── Status Pipeline ───────────────────────────────────────────────────────────
// GET /status-info — returns pipeline stages, labels, colors, valid transitions
router.get('/status-info', DocumentController.getStatusPipeline);
// POST /status/:docId — advance/return document through pipeline
router.post('/status/:docId', authenticateToken, DocumentController.updateDocumentStatus);

// ── Versioning ────────────────────────────────────────────────────────────────
// POST /version/:docId — upload new file version, archive previous
router.post('/version/:docId', authenticateToken, upload.single('file'), DocumentController.createNewVersion);

// ── Query ─────────────────────────────────────────────────────────────────────
router.get('/student/:studentId', authenticateToken, DocumentController.getStudentDocuments);
router.get('/:docId', authenticateToken, DocumentController.getDocument);

// ══════════════════════════════════════════════════════════════════
// Document Request Workflow (Req #17, #19)
// ══════════════════════════════════════════════════════════════════
const fs = require('fs');
const docReqFile = path.join(__dirname, '../../data/document_requests.json');
const corrReqFile = path.join(__dirname, '../../data/correction_requests.json');

function loadJSON(file) {
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
    catch { return []; }
}
function saveJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// POST /api/documents/request — Student requests a document
router.post('/request', authenticateToken, (req, res) => {
    try {
        const { type, studentId, semester, reason } = req.body;
        const validTypes = ['SEMESTER_MARKSHEET', 'CONSOLIDATED_MARKSHEET', 'DEGREE_CERTIFICATE',
            'TRANSFER_CERTIFICATE', 'MIGRATION_CERTIFICATE', 'BONAFIDE_CERTIFICATE'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ success: false, message: `Invalid type. Must be one of: ${validTypes.join(', ')}` });
        }

        const requests = loadJSON(docReqFile);

        // Req #23: no duplicate certificate
        const dup = requests.find(r => r.type === type && r.studentId === studentId && r.status !== 'rejected');
        if (dup) {
            return res.status(409).json({ success: false, message: `A ${type} request already exists (status: ${dup.status})` });
        }

        const newReq = {
            id: `docreq-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            type,
            studentId: studentId || req.user.username,
            semester: semester ? parseInt(semester) : null,
            reason: reason || '',
            status: 'pending',
            approvalChain: [],
            requestedAt: new Date().toISOString(),
            requestedBy: req.user.username,
        };

        requests.push(newReq);
        saveJSON(docReqFile, requests);
        res.status(201).json({ success: true, data: newReq });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/documents/requests — Get document requests (filtered)
router.get('/requests', authenticateToken, (req, res) => {
    try {
        let requests = loadJSON(docReqFile);
        const { studentId, type, status } = req.query;
        if (studentId) requests = requests.filter(r => r.studentId === studentId);
        if (type) requests = requests.filter(r => r.type === type);
        if (status) requests = requests.filter(r => r.status === status);
        res.json(requests);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT /api/documents/requests/:id/approve — Role-aware approval
router.put('/requests/:id/approve', authenticateToken, (req, res) => {
    try {
        const user = req.user;
        const requests = loadJSON(docReqFile);
        const idx = requests.findIndex(r => r.id === req.params.id);
        if (idx === -1) return res.status(404).json({ success: false, message: 'Request not found' });

        const r = requests[idx];
        const role = user.role;

        // Determine next status based on document type and current status
        const workflows = {
            'SEMESTER_MARKSHEET': { pending: 'hod_approved', hod_approved: 'exam_approved', exam_approved: 'dean_approved', dean_approved: 'issued' },
            'CONSOLIDATED_MARKSHEET': { pending: 'exam_approved', exam_approved: 'dean_approved', dean_approved: 'issued' },
            'DEGREE_CERTIFICATE': { pending: 'exam_approved', exam_approved: 'dean_approved', dean_approved: 'issued' },
            'TRANSFER_CERTIFICATE': { pending: 'exam_approved', exam_approved: 'dean_approved', dean_approved: 'issued' },
            'MIGRATION_CERTIFICATE': { pending: 'exam_approved', exam_approved: 'dean_approved', dean_approved: 'issued' },
            'BONAFIDE_CERTIFICATE': { pending: 'hod_issued', hod_issued: 'dean_approved', dean_approved: 'issued' },
        };

        const wf = workflows[r.type];
        if (!wf || !wf[r.status]) {
            return res.status(400).json({ success: false, message: `Cannot approve: status is ${r.status}` });
        }

        requests[idx].status = wf[r.status];
        requests[idx].approvalChain = requests[idx].approvalChain || [];
        requests[idx].approvalChain.push({
            role, user: user.username, action: 'approved',
            resultStatus: wf[r.status], at: new Date().toISOString()
        });

        if (requests[idx].status === 'issued') {
            requests[idx].issuedAt = new Date().toISOString();
        }

        saveJSON(docReqFile, requests);
        res.json({ success: true, data: requests[idx] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT /api/documents/requests/:id/reject
router.put('/requests/:id/reject', authenticateToken, (req, res) => {
    try {
        const requests = loadJSON(docReqFile);
        const idx = requests.findIndex(r => r.id === req.params.id);
        if (idx === -1) return res.status(404).json({ success: false, message: 'Request not found' });

        requests[idx].status = 'rejected';
        requests[idx].rejectedBy = req.user.username;
        requests[idx].rejectionReason = req.body.reason || 'No reason';
        requests[idx].rejectedAt = new Date().toISOString();
        requests[idx].approvalChain = requests[idx].approvalChain || [];
        requests[idx].approvalChain.push({
            role: req.user.role, user: req.user.username,
            action: 'rejected', reason: req.body.reason || '', at: new Date().toISOString()
        });

        saveJSON(docReqFile, requests);
        res.json({ success: true, data: requests[idx] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/documents/corrections — Student raises correction request
router.post('/corrections', authenticateToken, (req, res) => {
    try {
        const { recordId, recordType, description } = req.body;
        if (!recordId || !description) {
            return res.status(400).json({ success: false, message: 'recordId and description required' });
        }

        const corrections = loadJSON(corrReqFile);
        const newCorr = {
            id: `corr-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            recordId,
            recordType: recordType || 'marks',
            description,
            status: 'pending',
            raisedBy: req.user.username,
            raisedAt: new Date().toISOString(),
        };

        corrections.push(newCorr);
        saveJSON(corrReqFile, corrections);
        res.status(201).json({ success: true, data: newCorr });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/documents/corrections — Get correction requests
router.get('/corrections', authenticateToken, (req, res) => {
    try {
        let corrections = loadJSON(corrReqFile);
        const { status } = req.query;
        if (status) corrections = corrections.filter(c => c.status === status);
        res.json(corrections);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;

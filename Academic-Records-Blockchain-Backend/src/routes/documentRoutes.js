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

module.exports = router;

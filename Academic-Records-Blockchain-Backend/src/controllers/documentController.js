/**
 * Document Controller — Sprint 2 Enhanced
 * 
 * Adds:
 *  - IPFS file storage (3-tier: Kubo → Infura → local fallback)
 *  - Document status pipeline: UPLOADED → UNDER_REVIEW → AUTHENTICATED → APPROVED → ON_CHAIN
 *  - Document versioning: new version archives the previous one
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const FabricGateway = require('../fabricGateway');
const logger = require('../utils/logger');
const { uploadToIPFS } = require('../utils/ipfsService');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const computeFileHash = (filePath) => {
    const fileBuffer = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
};

// Valid pipeline transitions
const STATUS_TRANSITIONS = {
    'UPLOADED': ['UNDER_REVIEW'],
    'UNDER_REVIEW': ['AUTHENTICATED', 'UPLOADED'],   // UPLOADED = send back
    'AUTHENTICATED': ['APPROVED'],
    'APPROVED': ['ON_CHAIN'],
    'ON_CHAIN': []
};

const STATUS_LABELS = {
    'UPLOADED': { label: 'Uploaded', color: '#6b7280', icon: '📤' },
    'UNDER_REVIEW': { label: 'Under Review', color: '#d97706', icon: '🔍' },
    'AUTHENTICATED': { label: 'Authenticated', color: '#2563eb', icon: '✓' },
    'APPROVED': { label: 'Approved', color: '#059669', icon: '✅' },
    'ON_CHAIN': { label: 'On-Chain', color: '#7c3aed', icon: '⛓' }
};

/**
 * POST /api/v1/documents/upload
 * Multer handles the file. We then:
 *   1. Compute SHA-256
 *   2. Upload to IPFS (3-tier fallback)
 *   3. Store CID + hash on blockchain via UploadDocument chaincode
 *   4. Set initial status = UPLOADED
 */
const uploadDocument = async (req, res) => {
    const gateway = new FabricGateway();
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

        const { studentId, docType = 'OTHER', semester = '0', academicYear = '' } = req.body;
        if (!studentId) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ success: false, message: 'studentId is required' });
        }

        // 1. Compute SHA-256
        const sha256Hash = computeFileHash(req.file.path);

        // 2. Upload to IPFS
        const ipfsResult = await uploadToIPFS(req.file.path);
        logger.info(`IPFS upload: CID=${ipfsResult.cid}, mode=${ipfsResult.mode}`);

        // 3. Generate doc ID
        const docId = `DOC-${studentId}-${Date.now()}`;
        const semesterNum = parseInt(semester) || 0;

        // 4. Store on blockchain (sha256 + CID + metadata)
        await gateway.connect(req.user);
        await gateway.submitTransaction(
            'UploadDocument',
            docId,
            studentId,
            (docType || 'OTHER').toUpperCase(),
            sha256Hash,
            req.file.originalname,
            academicYear,
            String(semesterNum),
            ipfsResult.cid          // pass IPFS CID as extra arg (chaincode stores if present)
        );

        res.json({
            success: true,
            message: 'Document uploaded — hash and IPFS CID anchored on blockchain',
            data: {
                docId,
                studentId,
                docType: (docType || 'OTHER').toUpperCase(),
                fileName: req.file.originalname,
                fileSize: req.file.size,
                sha256Hash,
                ipfsCid: ipfsResult.cid,
                ipfsUrl: ipfsResult.url,
                ipfsMode: ipfsResult.mode,
                semester: semesterNum,
                academicYear,
                documentStatus: 'UPLOADED',
                statusMeta: STATUS_LABELS['UPLOADED'],
                blockchainTxConfirmed: true,
                version: 1
            }
        });

    } catch (error) {
        logger.error(`uploadDocument error: ${error.message}`);
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        await gateway.disconnect();
    }
};

/**
 * POST /api/v1/documents/status/:docId
 * Advance (or revert) the document through the status pipeline.
 * Body: { newStatus }
 * Allowed transitions defined in STATUS_TRANSITIONS above.
 */
const updateDocumentStatus = async (req, res) => {
    const gateway = new FabricGateway();
    try {
        const { docId } = req.params;
        const { newStatus } = req.body;

        if (!newStatus || !STATUS_LABELS[newStatus]) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Valid values: ${Object.keys(STATUS_LABELS).join(', ')}`
            });
        }

        // Fetch current document to validate the transition
        await gateway.connect(req.user);
        let currentDoc;
        try {
            const result = await gateway.evaluateTransaction('GetDocument', docId);
            currentDoc = JSON.parse(result.toString());
        } catch {
            return res.status(404).json({ success: false, message: `Document ${docId} not found` });
        }

        const currentStatus = currentDoc.documentStatus || 'UPLOADED';
        const allowed = STATUS_TRANSITIONS[currentStatus] || [];

        if (!allowed.includes(newStatus)) {
            return res.status(400).json({
                success: false,
                message: `Cannot transition from ${currentStatus} to ${newStatus}. Allowed: ${allowed.join(', ') || 'none'}`
            });
        }

        // Commit the status update on-chain (UpdateDocumentStatus chaincode function)
        try {
            await gateway.submitTransaction('UpdateDocumentStatus', docId, newStatus, req.user.username);
        } catch (chainErr) {
            // Chaincode function may not exist yet — store status off-chain in local metadata file
            logger.warn(`Chaincode UpdateDocumentStatus not found — saving status locally: ${chainErr.message}`);
            const metaPath = path.join(UPLOADS_DIR, `${docId}.status.json`);
            fs.writeFileSync(metaPath, JSON.stringify({
                docId, documentStatus: newStatus,
                updatedBy: req.user.username, updatedAt: new Date().toISOString()
            }, null, 2));
        }

        res.json({
            success: true,
            message: `Document status updated to ${newStatus}`,
            data: {
                docId,
                previousStatus: currentStatus,
                documentStatus: newStatus,
                statusMeta: STATUS_LABELS[newStatus],
                updatedBy: req.user.username,
                updatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        logger.error(`updateDocumentStatus error: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        await gateway.disconnect();
    }
};

/**
 * POST /api/v1/documents/version/:docId
 * Upload a new version of a document. Archives the previous version.
 * Body (multipart): file, reason (why the new version was needed)
 */
const createNewVersion = async (req, res) => {
    const gateway = new FabricGateway();
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

        const { docId } = req.params;
        const { reason = '' } = req.body;

        // Fetch existing doc
        await gateway.connect(req.user);
        let existingDoc;
        try {
            const result = await gateway.evaluateTransaction('GetDocument', docId);
            existingDoc = JSON.parse(result.toString());
        } catch {
            return res.status(404).json({ success: false, message: `Document ${docId} not found` });
        }

        const newVersion = (existingDoc.version || 1) + 1;
        const sha256Hash = computeFileHash(req.file.path);
        const ipfsResult = await uploadToIPFS(req.file.path);

        // Archive previous version metadata locally
        const archivePath = path.join(UPLOADS_DIR, `${docId}.v${existingDoc.version || 1}.archive.json`);
        fs.writeFileSync(archivePath, JSON.stringify({
            ...existingDoc,
            archivedAt: new Date().toISOString(),
            archivedBy: req.user.username,
            reason
        }, null, 2));

        // Submit a new UploadDocument tx with the new version ID
        const newDocId = `${docId}-v${newVersion}`;
        await gateway.submitTransaction(
            'UploadDocument',
            newDocId,
            existingDoc.studentID,
            existingDoc.docType,
            sha256Hash,
            req.file.originalname,
            existingDoc.academicYear || '',
            String(existingDoc.semester || 0),
            ipfsResult.cid
        );

        res.json({
            success: true,
            message: `New version v${newVersion} created; previous version archived`,
            data: {
                newDocId,
                originalDocId: docId,
                version: newVersion,
                sha256Hash,
                ipfsCid: ipfsResult.cid,
                ipfsUrl: ipfsResult.url,
                documentStatus: 'UPLOADED',
                archivePath: `Local archive: ${docId}.v${existingDoc.version || 1}.archive.json`,
                reason
            }
        });

    } catch (error) {
        logger.error(`createNewVersion error: ${error.message}`);
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        await gateway.disconnect();
    }
};

/**
 * GET /api/v1/documents/status-info
 * Returns the status pipeline definition (for frontend to render badges)
 */
const getStatusPipeline = (req, res) => {
    res.json({
        success: true,
        data: {
            pipeline: Object.entries(STATUS_LABELS).map(([status, meta]) => ({
                status, ...meta,
                nextStatuses: STATUS_TRANSITIONS[status] || []
            }))
        }
    });
};

/**
 * POST /api/v1/documents/verify — verify by re-upload
 */
const verifyDocument = async (req, res) => {
    const gateway = new FabricGateway();
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
        const sha256Hash = computeFileHash(req.file.path);
        await gateway.connect(req.user || {});
        let verified = false, blockchainRecord = null;
        try {
            blockchainRecord = await gateway.evaluateTransaction('VerifyDocumentByHash', sha256Hash);
            verified = true;
        } catch { verified = false; }
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.json({
            success: true, data: {
                verified, sha256Hash, message: verified
                    ? '✅ Document is authentic — hash matches blockchain record'
                    : '⚠️ Document not found on blockchain — may be tampered or not registered',
                blockchainRecord: blockchainRecord || null
            }
        });
    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ success: false, message: error.message });
    } finally { await gateway.disconnect(); }
};

/** GET /api/v1/documents/verify/:hash */
const verifyByHash = async (req, res) => {
    const gateway = new FabricGateway();
    try {
        const { hash } = req.params;
        await gateway.connect(req.user || {});
        let verified = false, blockchainRecord = null;
        try { blockchainRecord = await gateway.evaluateTransaction('VerifyDocumentByHash', hash); verified = true; }
        catch { verified = false; }
        res.json({
            success: true, data: {
                verified, sha256Hash: hash,
                message: verified ? '✅ Hash found — document is authentic' : '⚠️ Hash not found on blockchain',
                blockchainRecord: blockchainRecord || null
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    } finally { await gateway.disconnect(); }
};

/** GET /api/v1/documents/student/:studentId */
const getStudentDocuments = async (req, res) => {
    const gateway = new FabricGateway();
    try {
        const { studentId } = req.params;
        await gateway.connect(req.user);
        const result = await gateway.evaluateTransaction('GetDocumentsByStudent', studentId);
        res.json({ success: true, data: Array.isArray(result) ? result : [] });
    } catch {
        res.json({ success: true, data: [] });
    } finally { await gateway.disconnect(); }
};

/** GET /api/v1/documents/:docId */
const getDocument = async (req, res) => {
    const gateway = new FabricGateway();
    try {
        const { docId } = req.params;
        await gateway.connect(req.user);
        const result = await gateway.evaluateTransaction('GetDocument', docId);
        res.json({ success: true, data: result });
    } catch {
        res.status(404).json({ success: false, message: `Document ${req.params.docId} not found` });
    } finally { await gateway.disconnect(); }
};

module.exports = {
    uploadDocument,
    verifyDocument,
    verifyByHash,
    getStudentDocuments,
    getDocument,
    updateDocumentStatus,
    createNewVersion,
    getStatusPipeline
};

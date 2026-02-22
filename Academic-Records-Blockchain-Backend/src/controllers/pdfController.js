/**
 * PDF Controller
 * Generates PDF certificates by composing data from the blockchain,
 * rendering via Puppeteer, computing SHA-256, and returning the file.
 */

const { generateCertificatePDF } = require('../utils/pdfService');
const { notifyCertificateIssued } = require('../utils/notificationService');
const FabricGateway = require('../fabricGateway');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');

const CERT_DIR = path.join(__dirname, '../../uploads/certificates');

/**
 * POST /api/v1/pdf/generate/:certId
 * Generate and return a PDF certificate for the given certId.
 */
const generatePDF = async (req, res) => {
    const { certId } = req.params;
    const io = req.app.get('io');

    try {
        const gateway = new FabricGateway();
        await gateway.connect(req.user.username, req.user.role);

        // Fetch certificate from blockchain
        let certificate, student, record, approvalChain = [];
        try {
            const certResult = await gateway.evaluateTransaction('GetCertificate', certId);
            certificate = JSON.parse(certResult.toString());
        } catch (e) {
            // try by student if not found by certId
            certificate = { certificateID: certId };
        }

        // Fetch student
        const studentId = certificate.studentID || req.query.studentId;
        if (studentId) {
            try {
                const studentResult = await gateway.evaluateTransaction('GetStudent', studentId);
                student = JSON.parse(studentResult.toString());
            } catch (e) { student = { rollNumber: studentId }; }
        }

        // Fetch academic record
        const recordId = certificate.recordID || req.query.recordId;
        if (recordId) {
            try {
                const recordResult = await gateway.evaluateTransaction('GetAcademicRecord', recordId);
                record = JSON.parse(recordResult.toString());
            } catch (e) { record = {}; }

            // Fetch approval chain
            try {
                const approvalResult = await gateway.evaluateTransaction('GetApprovalStatus', recordId);
                const approvalRecord = JSON.parse(approvalResult.toString());
                approvalChain = approvalRecord.approvalChain || [];
            } catch (e) { approvalChain = []; }
        }

        await gateway.disconnect();

        // Generate PDF
        const { filePath, filename, sha256Hash } = await generateCertificatePDF({
            student, record, certificate, approvalChain
        });

        logger.info(`Certificate PDF generated: ${filename}, hash: ${sha256Hash}`);

        // Notify student
        if (student) {
            await notifyCertificateIssued(io, {
                studentId: student.rollNumber,
                studentEmail: student.email,
                studentName: student.name || student.rollNumber,
                certId,
                degree: student.degree || 'B.Tech'
            });
        }

        // Stream PDF to client
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('X-Certificate-Hash', sha256Hash);
        const stream = fs.createReadStream(filePath);
        stream.pipe(res);

    } catch (error) {
        logger.error(`PDF generation error: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/v1/pdf/download/:filename
 * Serve a previously generated certificate PDF.
 */
const downloadPDF = async (req, res) => {
    const { filename } = req.params;
    // Sanitize filename (no path traversal)
    const safeName = path.basename(filename);
    const filePath = path.join(CERT_DIR, safeName);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, message: 'Certificate not found. Generate it first.' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
    fs.createReadStream(filePath).pipe(res);
};

/**
 * GET /api/v1/pdf/list/:studentId
 * List all generated certificates for a student.
 */
const listStudentCertificates = async (req, res) => {
    const { studentId } = req.params;
    try {
        const files = fs.readdirSync(CERT_DIR)
            .filter(f => f.includes(studentId) && f.endsWith('.pdf'))
            .map(f => ({
                filename: f,
                url: `/uploads/certificates/${f}`,
                generatedAt: fs.statSync(path.join(CERT_DIR, f)).mtime
            }));
        res.json({ success: true, data: files });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

module.exports = { generatePDF, downloadPDF, listStudentCertificates };

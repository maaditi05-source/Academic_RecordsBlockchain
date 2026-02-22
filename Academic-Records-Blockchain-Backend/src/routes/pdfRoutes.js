const express = require('express');
const router = express.Router();
const PdfController = require('../controllers/pdfController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Certificates PDF
 *   description: Generate and download PDF certificates
 */

/**
 * @swagger
 * /api/v1/pdf/generate/{certId}:
 *   post:
 *     summary: Generate a PDF certificate
 *     tags: [Certificates PDF]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: certId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: recordId
 *         schema:
 *           type: string
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: PDF binary stream
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.post('/generate/:certId', authenticateToken, PdfController.generatePDF);

/**
 * @swagger
 * /api/v1/pdf/download/{filename}:
 *   get:
 *     summary: Download a previously generated certificate PDF
 *     tags: [Certificates PDF]
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: PDF binary stream
 */
router.get('/download/:filename', PdfController.downloadPDF);

/**
 * @swagger
 * /api/v1/pdf/list/{studentId}:
 *   get:
 *     summary: List all generated certificate PDFs for a student
 *     tags: [Certificates PDF]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of PDF filenames and URLs
 */
router.get('/list/:studentId', authenticateToken, PdfController.listStudentCertificates);

module.exports = router;

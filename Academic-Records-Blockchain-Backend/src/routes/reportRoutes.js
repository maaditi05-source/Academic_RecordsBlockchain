const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');

// Dashboard summary — admin and department only
router.get('/summary', authenticateToken, requireRole('admin', 'department'), ReportController.getDashboardSummary);

// CSV exports — admin only
router.get('/certificates.csv', authenticateToken, requireRole('admin'), ReportController.exportCertificatesCSV);
router.get('/students.csv', authenticateToken, requireRole('admin', 'department'), ReportController.exportStudentsCSV);
router.get('/approvals.csv', authenticateToken, requireRole('admin', 'department', 'exam_section'), ReportController.exportApprovalsCSV);

// Blockchain explorer — admin, department, verifier
router.get('/explorer', authenticateToken, ReportController.blockchainExplorer);

// Full audit trail for a record
router.get('/audit/:recordId', authenticateToken, ReportController.getAuditTrail);

module.exports = router;

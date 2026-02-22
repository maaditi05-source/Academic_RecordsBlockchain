const express = require('express');
const router = express.Router();
const ApprovalController = require('../controllers/approvalController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Submit record for approval (department or admin)
router.post('/submit/:recordId', authenticateToken, requireRole('department', 'admin'), ApprovalController.submitForApproval);

// Faculty approval
router.post('/faculty/:recordId', authenticateToken, requireRole('faculty', 'admin'), ApprovalController.facultyApprove);

// HOD approval
router.post('/hod/:recordId', authenticateToken, requireRole('department', 'hod', 'admin'), ApprovalController.hodApprove);

// DAC approval
router.post('/dac/:recordId', authenticateToken, requireRole('department', 'dac_member', 'admin'), ApprovalController.dacApprove);

// Exam Section approval
router.post('/examsection/:recordId', authenticateToken, requireRole('admin', 'exam_section'), ApprovalController.examSectionApprove);

// Dean Academic approval (final)
router.post('/dean/:recordId', authenticateToken, requireRole('admin', 'dean_academic'), ApprovalController.deanApprove);

// Reject and send back to DRAFT
router.post('/reject/:recordId', authenticateToken, ApprovalController.rejectRecord);

// Get approval chain status for a record
router.get('/status/:recordId', authenticateToken, ApprovalController.getApprovalStatus);

// Get records at a specific approval stage (queue)
router.get('/queue/:status', authenticateToken, requireRole('admin', 'faculty', 'department', 'hod', 'dac_member', 'exam_section', 'dean_academic'), ApprovalController.getApprovalQueue);

module.exports = router;

const express = require('express');
const router = express.Router();
const MarksController = require('../controllers/marksController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// GET all marks with query filters (?studentId=&semester=&status=&department=&courseCode=)
router.get('/', MarksController.getAllMarks);

// Upload marks (single or bulk) — faculty, HOD, exam_section, admin
router.post('/upload', MarksController.uploadMarks);

// Get pending marks (for approval views)
router.get('/pending', MarksController.getPendingMarks);

// Multi-step approval chain
router.put('/:markId/submit', MarksController.submitMarks);
router.put('/:markId/hod-approve', MarksController.hodApproveMarks);
router.put('/:markId/exam-approve', MarksController.examApproveMarks);
router.put('/:markId/dean-approve', MarksController.deanApproveMarks);
router.put('/:markId/admin-finalize', MarksController.adminFinalizeMarks);
router.put('/:markId/reject', MarksController.rejectMarks);

// Semester lock (exam section / admin)
router.put('/semester/:dept/:semester/lock', MarksController.lockSemester);

// Legacy verify endpoint
router.patch('/:markId/verify', MarksController.verifyMarks);

// Get marks for a course
router.get('/course/:courseCode', MarksController.getCourseMarks);

// Get student CGPA
router.get('/:studentId/cgpa', MarksController.getStudentCGPA);

// Get student marks for a specific semester
router.get('/:studentId/:semester', MarksController.getStudentSemesterMarks);

// Get all marks for a student
router.get('/:studentId', MarksController.getStudentMarks);

module.exports = router;

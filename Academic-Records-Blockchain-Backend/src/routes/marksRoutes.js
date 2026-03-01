const express = require('express');
const router = express.Router();
const MarksController = require('../controllers/marksController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Exam section: upload marks (single or bulk)
router.post('/upload', MarksController.uploadMarks);

// Faculty: get pending marks for their courses
router.get('/pending', MarksController.getPendingMarks);

// Faculty: verify a mark record
router.patch('/:markId/verify', MarksController.verifyMarks);

// Get marks for a course (faculty use)
router.get('/course/:courseCode', MarksController.getCourseMarks);

// Get student's CGPA
router.get('/:studentId/cgpa', MarksController.getStudentCGPA);

// Get student marks for a specific semester
router.get('/:studentId/:semester', MarksController.getStudentSemesterMarks);

// Get all marks for a student
router.get('/:studentId', MarksController.getStudentMarks);

module.exports = router;

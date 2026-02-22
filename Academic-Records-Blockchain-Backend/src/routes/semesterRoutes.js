const express = require('express');
const router = express.Router();
const SemesterController = require('../controllers/semesterController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Register a student for a semester
router.post('/register', authenticateToken, requireRole('admin', 'department'), SemesterController.registerForSemester);

// Get all semesters for a student
router.get('/student/:studentId', authenticateToken, SemesterController.getStudentSemesters);

// Get a specific registration by ID
router.get('/:regId', authenticateToken, SemesterController.getSemesterRegistration);

module.exports = router;

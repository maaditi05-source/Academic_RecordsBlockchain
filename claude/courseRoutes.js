// ============================================================
// courseRoutes.js  — NEW FILE
// Mount at: /api/courses  in server.js
// ============================================================

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth'); // existing auth middleware
const courseCtrl = require('../controllers/courseController');

// All routes require valid JWT
router.use(authenticateToken);

// ── Course CRUD ───────────────────────────────────────────────
router.get('/',                          courseCtrl.getCourses);
router.post('/',                         courseCtrl.createCourse);
router.put('/:id',                       courseCtrl.updateCourse);
router.delete('/:id',                    courseCtrl.deleteCourse);

// ── Course-faculty assignment ─────────────────────────────────
router.put('/:id/assign',    courseCtrl.assignFaculty);   // HOD/Admin assigns
router.put('/:id/enroll',    courseCtrl.enrollSelf);       // Faculty self-enroll
router.put('/:id/unenroll',  courseCtrl.unenrollSelf);     // Faculty self-unenroll

// ── By department ─────────────────────────────────────────────
router.get('/department/:dept', courseCtrl.getCoursesByDepartment);

module.exports = router;

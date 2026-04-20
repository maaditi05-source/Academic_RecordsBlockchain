// ============================================================
// marksRoutes.js  — NEW FILE
// Mount at: /api/marks  in server.js
// ============================================================

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const marksCtrl = require('../controllers/marksController');

router.use(authenticateToken);

// ── Core CRUD ─────────────────────────────────────────────────
router.get('/',           marksCtrl.getMarks);
router.get('/:id',        marksCtrl.getMarkById);
router.post('/upload',    marksCtrl.uploadMarks);

// ── Workflow transitions ──────────────────────────────────────
router.put('/:id/submit',       marksCtrl.submitMarks);       // faculty → submitted
router.put('/:id/hod-approve',  marksCtrl.hodApproveMarks);   // HOD → hod_approved
router.put('/:id/exam-approve', marksCtrl.examApproveMarks);  // exam section → exam_approved
router.put('/:id/reject',       marksCtrl.rejectMarks);       // reject → back to draft

// ── Semester lock (exam section) ──────────────────────────────
router.put('/semester/:dept/:semester/lock', marksCtrl.lockSemester);

module.exports = router;

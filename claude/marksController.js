// ============================================================
// marksController.js  — NEW FILE
// Handles: marks upload with semester-scope + 100-mark cap
//
// Req #2  — >100 marks not allowed
// Req #3  — upload for hod, faculty, exam_section
// Req #8  — semester-wise subjects; subject uploadable only
//           in its own semester (e.g. TOC → sem 3 only)
// Req #10 — faculty: upload internal, propose grades, modify before submit
// Req #11 — HOD: review & approve faculty-submitted marks
// Req #12 — exam_section: upload, lock semester, final approve
// ============================================================

const fs = require('fs');
const path = require('path');
const { Gateway } = require('../fabricGateway'); // adjust path as needed

// Local JSON store for marks drafts (pre-blockchain submission)
// Schema: { id, studentId, courseCode, semester, department,
//           marksData: { internal, external, total },
//           status: 'draft'|'submitted'|'hod_approved'|'exam_approved'|'locked',
//           submittedBy, submittedAt, hodApprovedBy, examApprovedBy,
//           lockedAt, modifiedAt, proposedGrade, rejectionReason }
const MARKS_FILE = path.join(__dirname, '../../data/marks_drafts.json');
const COURSES_FILE = path.join(__dirname, '../../data/courses.json');

function readMarks() {
  if (!fs.existsSync(MARKS_FILE)) return [];
  return JSON.parse(fs.readFileSync(MARKS_FILE, 'utf-8'));
}

function writeMarks(marks) {
  fs.writeFileSync(MARKS_FILE, JSON.stringify(marks, null, 2));
}

function readCourses() {
  if (!fs.existsSync(COURSES_FILE)) return [];
  return JSON.parse(fs.readFileSync(COURSES_FILE, 'utf-8'));
}

function nextMarkId(marks) {
  const ids = marks.map(m => parseInt(m.id || '0', 10)).filter(Boolean);
  return String(ids.length ? Math.max(...ids) + 1 : 1);
}

// ── Validation helpers ────────────────────────────────────────

/**
 * Validate that a mark value is in [0, maxMarks].
 * Req #2 — more than maxMarks (default 100) must be rejected.
 */
function validateMark(value, fieldName, maxMarks = 100) {
  const n = parseFloat(value);
  if (isNaN(n)) return `${fieldName} must be a number`;
  if (n < 0) return `${fieldName} cannot be negative`;
  if (n > maxMarks) return `${fieldName} cannot exceed ${maxMarks}`;
  return null;
}

/**
 * Verify that the course belongs to the given semester.
 * Req #8 — TOC is sem-3 → only uploadable in sem 3.
 */
function verifySemesterScope(courseCode, semester, courses) {
  const course = courses.find(c => c.code === courseCode);
  if (!course) return `Course ${courseCode} not found`;
  if (course.semester !== parseInt(semester, 10)) {
    return `${courseCode} (${course.name}) belongs to semester ${course.semester}, not ${semester}`;
  }
  return null;
}

// ── Upload marks (draft) ──────────────────────────────────────

/**
 * POST /api/marks/upload
 * Roles: faculty, hod, exam_section, admin
 * Body: { studentId, courseCode, semester, internal, external }
 * Req #2, #3, #8, #10
 */
exports.uploadMarks = (req, res) => {
  try {
    const { role, username, department } = req.user;
    const allowedRoles = ['faculty', 'hod', 'exam_section', 'admin'];
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ error: 'You do not have permission to upload marks' });
    }

    const { studentId, courseCode, semester, internal, external, proposedGrade } = req.body;

    if (!studentId || !courseCode || !semester) {
      return res.status(400).json({ error: 'studentId, courseCode, and semester are required' });
    }

    const courses = readCourses();
    const course = courses.find(c => c.code === courseCode);
    if (!course) {
      return res.status(404).json({ error: `Course ${courseCode} not found` });
    }

    // Req #8: semester scope check
    const scopeErr = verifySemesterScope(courseCode, semester, courses);
    if (scopeErr) return res.status(422).json({ error: scopeErr });

    // Faculty/HOD can only upload for their own department's courses
    if (['faculty', 'hod'].includes(role) && course.department !== department) {
      return res.status(403).json({ error: `${courseCode} does not belong to your department` });
    }

    const maxMarks = course.maxMarks || 100;
    const internalMax = Math.floor(maxMarks * 0.4);  // 40% internal
    const externalMax = Math.floor(maxMarks * 0.6);  // 60% external

    // Req #2: validate mark bounds
    const errs = [
      validateMark(internal, 'Internal marks', internalMax),
      external !== undefined ? validateMark(external, 'External marks', externalMax) : null,
    ].filter(Boolean);

    if (errs.length) return res.status(422).json({ errors: errs });

    const internalVal = parseFloat(internal);
    const externalVal = external !== undefined ? parseFloat(external) : null;
    const total = externalVal !== null ? internalVal + externalVal : internalVal;

    const marks = readMarks();

    // Check for existing draft for same student+course+semester
    const existingIdx = marks.findIndex(
      m => m.studentId === studentId &&
           m.courseCode === courseCode &&
           m.semester === parseInt(semester, 10) &&
           m.status !== 'locked'
    );

    if (existingIdx !== -1) {
      // Update in place — req #10: faculty can modify before submission
      if (marks[existingIdx].status !== 'draft') {
        return res.status(409).json({
          error: 'Marks already submitted/approved. Only drafts can be overwritten.',
        });
      }
      marks[existingIdx] = {
        ...marks[existingIdx],
        marksData: { internal: internalVal, external: externalVal, total },
        proposedGrade: proposedGrade || null,
        modifiedAt: new Date().toISOString(),
        modifiedBy: username,
      };
      writeMarks(marks);
      return res.json({ message: 'Marks updated (draft)', record: marks[existingIdx] });
    }

    const record = {
      id: nextMarkId(marks),
      studentId,
      courseCode,
      courseName: course.name,
      semester: parseInt(semester, 10),
      department: course.department,
      marksData: { internal: internalVal, external: externalVal, total },
      proposedGrade: proposedGrade || null,
      // Exam section uploads are auto-submitted; faculty/hod start as draft
      status: role === 'exam_section' ? 'submitted' : 'draft',
      submittedBy: username,
      submittedAt: new Date().toISOString(),
      modifiedAt: null,
      modifiedBy: null,
      hodApprovedBy: null,
      hodApprovedAt: null,
      examApprovedBy: null,
      examApprovedAt: null,
      lockedAt: null,
    };

    marks.push(record);
    writeMarks(marks);

    res.status(201).json({ message: 'Marks uploaded', record });
  } catch (err) {
    console.error('[marksController.uploadMarks]', err);
    res.status(500).json({ error: 'Failed to upload marks' });
  }
};

/**
 * PUT /api/marks/:id/submit
 * Faculty/HOD submits draft marks for HOD review.
 * Req #10 — faculty submits after verifying
 */
exports.submitMarks = (req, res) => {
  try {
    const { role, username } = req.user;
    if (!['faculty', 'hod', 'admin'].includes(role)) {
      return res.status(403).json({ error: 'Not authorised' });
    }

    const marks = readMarks();
    const idx = marks.findIndex(m => m.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Marks record not found' });

    if (marks[idx].status !== 'draft') {
      return res.status(409).json({ error: `Cannot submit — current status is '${marks[idx].status}'` });
    }

    marks[idx].status = 'submitted';
    marks[idx].submittedAt = new Date().toISOString();
    marks[idx].submittedBy = username;
    writeMarks(marks);

    res.json({ message: 'Marks submitted for HOD review', record: marks[idx] });
  } catch (err) {
    console.error('[marksController.submitMarks]', err);
    res.status(500).json({ error: 'Failed to submit marks' });
  }
};

/**
 * PUT /api/marks/:id/hod-approve
 * HOD or Admin — approve submitted marks.
 * Req #11 — HOD reviews and approves faculty-submitted marks
 */
exports.hodApproveMarks = (req, res) => {
  try {
    const { role, username, department } = req.user;
    if (!['hod', 'admin'].includes(role)) {
      return res.status(403).json({ error: 'Only HOD or Admin can approve at this stage' });
    }

    const marks = readMarks();
    const idx = marks.findIndex(m => m.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Marks record not found' });

    if (marks[idx].status !== 'submitted') {
      return res.status(409).json({ error: `Expected status 'submitted', got '${marks[idx].status}'` });
    }

    if (role === 'hod' && marks[idx].department !== department) {
      return res.status(403).json({ error: 'Cannot approve marks from another department' });
    }

    marks[idx].status = 'hod_approved';
    marks[idx].hodApprovedBy = username;
    marks[idx].hodApprovedAt = new Date().toISOString();
    writeMarks(marks);

    res.json({ message: 'Marks approved by HOD', record: marks[idx] });
  } catch (err) {
    console.error('[marksController.hodApproveMarks]', err);
    res.status(500).json({ error: 'Failed to approve marks' });
  }
};

/**
 * PUT /api/marks/:id/exam-approve
 * Exam section or Admin — second approval stage.
 * Req #12 — exam section approval checkpoint after HOD
 */
exports.examApproveMarks = (req, res) => {
  try {
    const { role, username } = req.user;
    if (!['exam_section', 'admin'].includes(role)) {
      return res.status(403).json({ error: 'Only Exam Section or Admin can approve at this stage' });
    }

    const marks = readMarks();
    const idx = marks.findIndex(m => m.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Marks record not found' });

    if (marks[idx].status !== 'hod_approved') {
      return res.status(409).json({ error: `Expected status 'hod_approved', got '${marks[idx].status}'` });
    }

    marks[idx].status = 'exam_approved';
    marks[idx].examApprovedBy = username;
    marks[idx].examApprovedAt = new Date().toISOString();
    writeMarks(marks);

    res.json({ message: 'Marks approved by Exam Section', record: marks[idx] });
  } catch (err) {
    console.error('[marksController.examApproveMarks]', err);
    res.status(500).json({ error: 'Failed to approve marks (exam stage)' });
  }
};

/**
 * PUT /api/marks/:id/reject
 * HOD, exam_section, or admin — reject marks and send back.
 * Body: { reason }
 */
exports.rejectMarks = (req, res) => {
  try {
    const { role, username } = req.user;
    if (!['hod', 'exam_section', 'admin'].includes(role)) {
      return res.status(403).json({ error: 'Not authorised to reject marks' });
    }

    const { reason } = req.body;
    if (!reason) return res.status(400).json({ error: 'Rejection reason is required' });

    const marks = readMarks();
    const idx = marks.findIndex(m => m.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Marks record not found' });

    marks[idx].status = 'draft';   // send back to faculty for correction
    marks[idx].rejectionReason = reason;
    marks[idx].rejectedBy = username;
    marks[idx].rejectedAt = new Date().toISOString();
    writeMarks(marks);

    res.json({ message: 'Marks rejected, sent back to faculty', record: marks[idx] });
  } catch (err) {
    console.error('[marksController.rejectMarks]', err);
    res.status(500).json({ error: 'Failed to reject marks' });
  }
};

/**
 * PUT /api/marks/semester/:dept/:semester/lock
 * Exam section or Admin — lock all exam_approved marks for a semester.
 * Req #12 — lock semester results
 */
exports.lockSemester = (req, res) => {
  try {
    const { role, username } = req.user;
    if (!['exam_section', 'admin'].includes(role)) {
      return res.status(403).json({ error: 'Only Exam Section or Admin can lock a semester' });
    }

    const { dept, semester } = req.params;
    const sem = parseInt(semester, 10);

    const marks = readMarks();
    let lockedCount = 0;
    const notReady = [];

    marks.forEach(m => {
      if (m.department === dept && m.semester === sem) {
        if (m.status === 'exam_approved') {
          m.status = 'locked';
          m.lockedAt = new Date().toISOString();
          m.lockedBy = username;
          lockedCount++;
        } else if (m.status !== 'locked') {
          notReady.push(`Student ${m.studentId} / ${m.courseCode}: ${m.status}`);
        }
      }
    });

    writeMarks(marks);

    if (notReady.length) {
      return res.status(207).json({
        message: `${lockedCount} records locked. ${notReady.length} records not ready:`,
        notReady,
        lockedCount,
      });
    }

    res.json({ message: `Semester ${semester} for ${dept} locked successfully`, lockedCount });
  } catch (err) {
    console.error('[marksController.lockSemester]', err);
    res.status(500).json({ error: 'Failed to lock semester' });
  }
};

/**
 * GET /api/marks
 * Query params: studentId, semester, department, courseCode, status
 * Admin: all; HOD: own dept; Faculty: own courses; Student: own records
 */
exports.getMarks = (req, res) => {
  try {
    const { role, username, department } = req.user;
    const { studentId, semester, courseCode, status } = req.query;

    let marks = readMarks();

    // Role-based scoping
    if (role === 'student') {
      // Students can only see locked (finalised) marks for themselves
      marks = marks.filter(m => m.studentId === username && m.status === 'locked');
    } else if (role === 'faculty') {
      const courses = readCourses();
      const myCourses = courses
        .filter(c => c.department === department &&
                     (c.assignedFaculty === username || c.enrolledFaculty?.includes(username)))
        .map(c => c.code);
      marks = marks.filter(m => myCourses.includes(m.courseCode));
    } else if (role === 'hod') {
      marks = marks.filter(m => m.department === department);
    }
    // admin, exam_section, dean see all — no additional filter

    // Optional query filters
    if (studentId) marks = marks.filter(m => m.studentId === studentId);
    if (semester)  marks = marks.filter(m => m.semester === parseInt(semester, 10));
    if (courseCode) marks = marks.filter(m => m.courseCode === courseCode);
    if (status)    marks = marks.filter(m => m.status === status);

    res.json(marks);
  } catch (err) {
    console.error('[marksController.getMarks]', err);
    res.status(500).json({ error: 'Failed to fetch marks' });
  }
};

/**
 * GET /api/marks/:id
 */
exports.getMarkById = (req, res) => {
  try {
    const marks = readMarks();
    const record = marks.find(m => m.id === req.params.id);
    if (!record) return res.status(404).json({ error: 'Marks record not found' });
    res.json(record);
  } catch (err) {
    console.error('[marksController.getMarkById]', err);
    res.status(500).json({ error: 'Failed to fetch marks record' });
  }
};

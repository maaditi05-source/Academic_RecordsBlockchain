// ============================================================
// courseController.js  — NEW FILE
// Handles: course CRUD, HOD assign-to-faculty, faculty self-enroll
// Req #6 (HOD add courses / assign faculty), #5 (faculty-only view)
// All data stored in data/courses.json (JSON file store, same
// pattern as data/users.json — no DB required)
// ============================================================

const fs = require('fs');
const path = require('path');

const COURSES_FILE = path.join(__dirname, '../../data/courses.json');

// ── helpers ──────────────────────────────────────────────────

function readCourses() {
  if (!fs.existsSync(COURSES_FILE)) return [];
  return JSON.parse(fs.readFileSync(COURSES_FILE, 'utf-8'));
}

function writeCourses(courses) {
  fs.writeFileSync(COURSES_FILE, JSON.stringify(courses, null, 2));
}

function nextId(courses) {
  const ids = courses.map(c => parseInt(c.id || '0', 10)).filter(Boolean);
  return String(ids.length ? Math.max(...ids) + 1 : 1);
}

// ── controllers ───────────────────────────────────────────────

/**
 * GET /api/courses
 * Admin: all courses
 * HOD:   courses for their department
 * Faculty: courses assigned to them
 * Req #5 — "My courses" visible only to faculty (HOD sees dept view)
 */
exports.getCourses = (req, res) => {
  try {
    const { role, department, username } = req.user;
    let courses = readCourses();

    if (role === 'admin') {
      return res.json(courses);
    }

    if (role === 'hod') {
      courses = courses.filter(c => c.department === department);
      return res.json(courses);
    }

    if (role === 'faculty') {
      // Faculty sees only courses assigned to them
      courses = courses.filter(
        c => c.department === department &&
             (c.assignedFaculty === username || c.enrolledFaculty?.includes(username))
      );
      return res.json(courses);
    }

    // exam_section / dean / student — read all for reference
    return res.json(courses);
  } catch (err) {
    console.error('[courseController.getCourses]', err);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
};

/**
 * POST /api/courses
 * Admin or HOD only.
 * Body: { code, name, department, semester, credits }
 * Req #6 — HOD can add courses
 */
exports.createCourse = (req, res) => {
  try {
    const { role, department } = req.user;
    if (!['admin', 'hod'].includes(role)) {
      return res.status(403).json({ error: 'Only Admin or HOD can create courses' });
    }

    const { code, name, credits } = req.body;
    let { department: dept, semester } = req.body;

    if (!code || !name || !semester) {
      return res.status(400).json({ error: 'code, name, and semester are required' });
    }

    semester = parseInt(semester, 10);
    if (isNaN(semester) || semester < 1 || semester > 8) {
      return res.status(400).json({ error: 'semester must be 1–8' });
    }

    // HOD can only create courses for their own department
    if (role === 'hod') dept = department;
    if (!dept) return res.status(400).json({ error: 'department is required' });

    const courses = readCourses();

    if (courses.find(c => c.code === code && c.department === dept)) {
      return res.status(409).json({ error: `Course ${code} already exists in ${dept}` });
    }

    const course = {
      id: nextId(courses),
      code,
      name,
      department: dept,
      semester,
      credits: parseInt(credits, 10) || 3,
      assignedFaculty: null,     // set via PUT /api/courses/:id/assign
      enrolledFaculty: [],       // self-enrolled faculty (req #6)
      maxMarks: 100,             // req #2 — marks capped at this per subject
      createdAt: new Date().toISOString(),
      createdBy: req.user.username,
    };

    courses.push(course);
    writeCourses(courses);

    res.status(201).json(course);
  } catch (err) {
    console.error('[courseController.createCourse]', err);
    res.status(500).json({ error: 'Failed to create course' });
  }
};

/**
 * PUT /api/courses/:id/assign
 * Admin or HOD — assign a faculty member to a course.
 * Body: { facultyUsername }
 * Req #6 — HOD assigns course to faculty
 */
exports.assignFaculty = (req, res) => {
  try {
    const { role, department } = req.user;
    if (!['admin', 'hod'].includes(role)) {
      return res.status(403).json({ error: 'Only Admin or HOD can assign faculty' });
    }

    const courses = readCourses();
    const idx = courses.findIndex(c => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Course not found' });

    const course = courses[idx];

    // HOD can only manage their own department
    if (role === 'hod' && course.department !== department) {
      return res.status(403).json({ error: 'Cannot manage courses from another department' });
    }

    const { facultyUsername } = req.body;
    if (!facultyUsername) return res.status(400).json({ error: 'facultyUsername is required' });

    course.assignedFaculty = facultyUsername;
    if (!course.enrolledFaculty.includes(facultyUsername)) {
      course.enrolledFaculty.push(facultyUsername);
    }

    writeCourses(courses);
    res.json(course);
  } catch (err) {
    console.error('[courseController.assignFaculty]', err);
    res.status(500).json({ error: 'Failed to assign faculty' });
  }
};

/**
 * PUT /api/courses/:id/enroll
 * Faculty self-enrollment into a course.
 * Req #6 — faculty can enroll themselves to a specific course
 */
exports.enrollSelf = (req, res) => {
  try {
    const { role, username, department } = req.user;
    if (role !== 'faculty') {
      return res.status(403).json({ error: 'Only faculty can self-enroll' });
    }

    const courses = readCourses();
    const idx = courses.findIndex(c => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Course not found' });

    const course = courses[idx];

    if (course.department !== department) {
      return res.status(403).json({ error: 'Cannot enroll in a course from another department' });
    }

    if (course.enrolledFaculty.includes(username)) {
      return res.status(409).json({ error: 'Already enrolled in this course' });
    }

    course.enrolledFaculty.push(username);
    writeCourses(courses);
    res.json(course);
  } catch (err) {
    console.error('[courseController.enrollSelf]', err);
    res.status(500).json({ error: 'Failed to enroll in course' });
  }
};

/**
 * PUT /api/courses/:id/unenroll
 * Faculty removes themselves from a course.
 */
exports.unenrollSelf = (req, res) => {
  try {
    const { role, username } = req.user;
    if (role !== 'faculty') {
      return res.status(403).json({ error: 'Only faculty can unenroll' });
    }

    const courses = readCourses();
    const idx = courses.findIndex(c => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Course not found' });

    courses[idx].enrolledFaculty = courses[idx].enrolledFaculty.filter(u => u !== username);
    writeCourses(courses);
    res.json(courses[idx]);
  } catch (err) {
    console.error('[courseController.unenrollSelf]', err);
    res.status(500).json({ error: 'Failed to unenroll' });
  }
};

/**
 * PUT /api/courses/:id
 * Admin or HOD — update course metadata.
 */
exports.updateCourse = (req, res) => {
  try {
    const { role, department } = req.user;
    if (!['admin', 'hod'].includes(role)) {
      return res.status(403).json({ error: 'Only Admin or HOD can update courses' });
    }

    const courses = readCourses();
    const idx = courses.findIndex(c => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Course not found' });

    if (role === 'hod' && courses[idx].department !== department) {
      return res.status(403).json({ error: 'Cannot update courses from another department' });
    }

    const allowed = ['name', 'credits', 'maxMarks'];
    allowed.forEach(k => {
      if (req.body[k] !== undefined) courses[idx][k] = req.body[k];
    });
    // semester change is allowed only by admin
    if (role === 'admin' && req.body.semester !== undefined) {
      const sem = parseInt(req.body.semester, 10);
      if (!isNaN(sem) && sem >= 1 && sem <= 8) courses[idx].semester = sem;
    }

    writeCourses(courses);
    res.json(courses[idx]);
  } catch (err) {
    console.error('[courseController.updateCourse]', err);
    res.status(500).json({ error: 'Failed to update course' });
  }
};

/**
 * DELETE /api/courses/:id
 * Admin or HOD.
 */
exports.deleteCourse = (req, res) => {
  try {
    const { role, department } = req.user;
    if (!['admin', 'hod'].includes(role)) {
      return res.status(403).json({ error: 'Only Admin or HOD can delete courses' });
    }

    let courses = readCourses();
    const target = courses.find(c => c.id === req.params.id);
    if (!target) return res.status(404).json({ error: 'Course not found' });

    if (role === 'hod' && target.department !== department) {
      return res.status(403).json({ error: 'Cannot delete courses from another department' });
    }

    courses = courses.filter(c => c.id !== req.params.id);
    writeCourses(courses);
    res.json({ message: 'Course deleted' });
  } catch (err) {
    console.error('[courseController.deleteCourse]', err);
    res.status(500).json({ error: 'Failed to delete course' });
  }
};

/**
 * GET /api/courses/department/:dept
 * All courses for a given department — used by HOD dashboard
 */
exports.getCoursesByDepartment = (req, res) => {
  try {
    const { role, department } = req.user;
    const { dept } = req.params;

    // HOD can only see their own dept
    if (role === 'hod' && dept !== department) {
      return res.status(403).json({ error: 'Cannot view courses of another department' });
    }

    const courses = readCourses().filter(c => c.department === dept);
    res.json(courses);
  } catch (err) {
    console.error('[courseController.getCoursesByDepartment]', err);
    res.status(500).json({ error: 'Failed to fetch department courses' });
  }
};

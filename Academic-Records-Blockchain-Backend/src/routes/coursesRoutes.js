const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');
const dataSync = require('../utils/dataSync');

const USERS_FILE = path.join(__dirname, '../../data/users.json');

async function loadCourses() { return await dataSync.readCollection('courses'); }
async function saveCourses(data) { await dataSync.writeCollection('courses', data); }
async function loadUsers() { return await dataSync.readCollection('users'); }

router.use(authenticateToken);

// ── GET /api/courses — All courses (query: ?department=&faculty=&semester=) ──
router.get('/', async (req, res) => {
    const courses = await loadCourses();
    const users = await loadUsers();
    const { department, faculty, semester } = req.query;
    let filtered = courses;
    if (department) filtered = filtered.filter(c => c.department === department);
    if (faculty) filtered = filtered.filter(c => c.faculty === faculty || (c.enrolledFaculty && c.enrolledFaculty.includes(faculty)));
    if (semester) filtered = filtered.filter(c => c.semester === parseInt(semester));

    const enriched = filtered.map(c => {
        const f = users.find(u => u.username === c.faculty);
        return { ...c, facultyName: f?.name || c.faculty || 'Unassigned' };
    });

    res.json({ success: true, data: enriched });
});

// ── GET /api/courses/department/:dept — Courses by department ──────
router.get('/department/:dept', async (req, res) => {
    const courses = await loadCourses();
    const users = await loadUsers();
    const filtered = courses.filter(c => c.department === req.params.dept);
    const enriched = filtered.map(c => {
        const f = users.find(u => u.username === c.faculty);
        return { ...c, facultyName: f?.name || c.faculty || 'Unassigned' };
    });
    res.json({ success: true, data: enriched });
});

// ── GET /api/courses/:code — Single course ────────────────────────
router.get('/:code', async (req, res) => {
    const courses = await loadCourses();
    const course = courses.find(c => c.code === req.params.code || c.id === req.params.code);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, data: course });
});

// ── POST /api/courses — Create course (HOD / admin) ───────────────
router.post('/', async (req, res) => {
    try {
        const user = req.user;
        if (!['hod', 'department', 'admin'].includes(user.role)) {
            return res.status(403).json({ success: false, message: 'Only HOD or admin can create courses' });
        }

        const { code, name, department, semester, credits, maxMarks } = req.body;
        if (!code || !name || !department) {
            return res.status(400).json({ success: false, message: 'code, name, and department are required' });
        }

        const courses = await loadCourses();
        const existing = courses.find(c => c.code === code);
        if (existing) {
            return res.status(409).json({ success: false, message: `Course ${code} already exists` });
        }

        const newCourse = {
            id: `course-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            code,
            name,
            department: department.toUpperCase(),
            semester: parseInt(semester) || 1,
            credits: parseInt(credits) || 3,
            maxMarks: parseInt(maxMarks) || 100,
            faculty: null,
            enrolledFaculty: [],
            createdBy: user.username,
            createdAt: new Date().toISOString()
        };

        courses.push(newCourse);
        await saveCourses(courses);
        logger.info(`Course ${code} created by ${user.username}`);
        res.status(201).json({ success: true, data: newCourse });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── PUT /api/courses/:id — Update course ──────────────────────────
router.put('/:id', async (req, res) => {
    try {
        const user = req.user;
        if (!['hod', 'department', 'admin'].includes(user.role)) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const courses = await loadCourses();
        const idx = courses.findIndex(c => c.id === req.params.id || c.code === req.params.id);
        if (idx === -1) return res.status(404).json({ success: false, message: 'Course not found' });

        const { name, credits, maxMarks, semester } = req.body;
        if (name) courses[idx].name = name;
        if (credits) courses[idx].credits = parseInt(credits);
        if (maxMarks) courses[idx].maxMarks = parseInt(maxMarks);
        if (semester) courses[idx].semester = parseInt(semester);

        await saveCourses(courses);
        res.json({ success: true, data: courses[idx] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── DELETE /api/courses/:id — Delete course ───────────────────────
router.delete('/:id', async (req, res) => {
    try {
        const user = req.user;
        if (!['hod', 'department', 'admin'].includes(user.role)) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const courses = await loadCourses();
        const idx = courses.findIndex(c => c.id === req.params.id || c.code === req.params.id);
        if (idx === -1) return res.status(404).json({ success: false, message: 'Course not found' });

        const deleted = courses.splice(idx, 1);
        await saveCourses(courses);
        res.json({ success: true, message: `Course ${deleted[0].code} deleted` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── PUT /api/courses/:id/assign — Assign faculty to course ────────
router.put('/:id/assign', async (req, res) => {
    try {
        const user = req.user;
        if (!['hod', 'department', 'admin'].includes(user.role)) {
            return res.status(403).json({ success: false, message: 'Only HOD or admin can assign faculty' });
        }

        const { facultyUsername } = req.body;
        if (!facultyUsername) return res.status(400).json({ success: false, message: 'facultyUsername required' });

        const courses = await loadCourses();
        const idx = courses.findIndex(c => c.id === req.params.id || c.code === req.params.id);
        if (idx === -1) return res.status(404).json({ success: false, message: 'Course not found' });

        courses[idx].faculty = facultyUsername;
        if (!courses[idx].enrolledFaculty) courses[idx].enrolledFaculty = [];
        if (!courses[idx].enrolledFaculty.includes(facultyUsername)) {
            courses[idx].enrolledFaculty.push(facultyUsername);
        }

        await saveCourses(courses);
        res.json({ success: true, data: courses[idx] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── PUT /api/courses/:id/enroll — Faculty self-enroll ─────────────
router.put('/:id/enroll', async (req, res) => {
    try {
        const user = req.user;
        if (!['faculty', 'hod', 'department', 'admin'].includes(user.role)) {
            return res.status(403).json({ success: false, message: 'Only faculty can self-enroll' });
        }

        const courses = await loadCourses();
        const idx = courses.findIndex(c => c.id === req.params.id || c.code === req.params.id);
        if (idx === -1) return res.status(404).json({ success: false, message: 'Course not found' });

        if (!courses[idx].enrolledFaculty) courses[idx].enrolledFaculty = [];
        if (courses[idx].enrolledFaculty.includes(user.username)) {
            return res.status(400).json({ success: false, message: 'Already enrolled' });
        }

        courses[idx].enrolledFaculty.push(user.username);
        await saveCourses(courses);
        res.json({ success: true, message: `Enrolled in ${courses[idx].code}`, data: courses[idx] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── PUT /api/courses/:id/unenroll — Faculty self-unenroll ─────────
router.put('/:id/unenroll', async (req, res) => {
    try {
        const user = req.user;
        const courses = await loadCourses();
        const idx = courses.findIndex(c => c.id === req.params.id || c.code === req.params.id);
        if (idx === -1) return res.status(404).json({ success: false, message: 'Course not found' });

        if (!courses[idx].enrolledFaculty) courses[idx].enrolledFaculty = [];
        courses[idx].enrolledFaculty = courses[idx].enrolledFaculty.filter(f => f !== user.username);
        if (courses[idx].faculty === user.username) courses[idx].faculty = null;

        await saveCourses(courses);
        res.json({ success: true, message: `Unenrolled from ${courses[idx].code}`, data: courses[idx] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;

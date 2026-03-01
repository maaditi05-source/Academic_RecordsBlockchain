const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');

const COURSES_FILE = path.join(__dirname, '../../data/courses.json');
const USERS_FILE = path.join(__dirname, '../../data/users.json');

function loadJSON(file) {
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
    catch { return []; }
}

router.use(authenticateToken);

// GET /api/courses — All courses (optionally filtered by department or faculty)
router.get('/', (req, res) => {
    const courses = loadJSON(COURSES_FILE);
    const { department, faculty, semester } = req.query;
    let filtered = courses;
    if (department) filtered = filtered.filter(c => c.department === department);
    if (faculty) filtered = filtered.filter(c => c.faculty === faculty);
    if (semester) filtered = filtered.filter(c => c.semester === parseInt(semester));

    // Enrich with faculty name
    const users = loadJSON(USERS_FILE);
    const enriched = filtered.map(c => {
        const f = users.find(u => u.username === c.faculty);
        return { ...c, facultyName: f?.name || c.faculty };
    });

    res.json({ success: true, data: enriched });
});

// GET /api/courses/:code — Single course details
router.get('/:code', (req, res) => {
    const courses = loadJSON(COURSES_FILE);
    const course = courses.find(c => c.code === req.params.code);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, data: course });
});

module.exports = router;

/**
 * Marks Controller
 * Handles marks upload by exam section, retrieval by students/faculty, and verification by faculty.
 */
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

const MARKS_FILE = path.join(__dirname, '../../data/marks.json');
const COURSES_FILE = path.join(__dirname, '../../data/courses.json');
const USERS_FILE = path.join(__dirname, '../../data/users.json');

function loadJSON(file) {
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
    catch { return []; }
}
function saveJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

class MarksController {

    // ── GET /marks/:studentId ─────────────────────────────────────
    static async getStudentMarks(req, res) {
        try {
            const { studentId } = req.params;
            const marks = loadJSON(MARKS_FILE).filter(m => m.studentId === studentId);
            const courses = loadJSON(COURSES_FILE);

            // Enrich with course name
            const enriched = marks.map(m => {
                const course = courses.find(c => c.code === m.courseCode) || {};
                return { ...m, courseName: course.name || m.courseCode, courseCredits: course.credits || m.credits };
            });

            res.json({ success: true, data: enriched });
        } catch (err) {
            logger.error(`Error fetching marks: ${err.message}`);
            res.status(500).json({ success: false, message: err.message });
        }
    }

    // ── GET /marks/:studentId/:semester ────────────────────────────
    static async getStudentSemesterMarks(req, res) {
        try {
            const { studentId, semester } = req.params;
            const marks = loadJSON(MARKS_FILE)
                .filter(m => m.studentId === studentId && m.semester === parseInt(semester));
            const courses = loadJSON(COURSES_FILE);

            const enriched = marks.map(m => {
                const course = courses.find(c => c.code === m.courseCode) || {};
                return { ...m, courseName: course.name || m.courseCode, courseCredits: course.credits || m.credits };
            });

            // Calculate SGPA
            let totalCredits = 0, weightedSum = 0;
            for (const m of enriched) {
                if (m.status === 'verified') {
                    totalCredits += m.credits;
                    weightedSum += m.gradePoint * m.credits;
                }
            }
            const sgpa = totalCredits > 0 ? (weightedSum / totalCredits).toFixed(2) : 0;

            res.json({ success: true, data: { marks: enriched, sgpa: parseFloat(sgpa), totalCredits } });
        } catch (err) {
            logger.error(`Error fetching semester marks: ${err.message}`);
            res.status(500).json({ success: false, message: err.message });
        }
    }

    // ── GET /marks/:studentId/cgpa ─────────────────────────────────
    static async getStudentCGPA(req, res) {
        try {
            const { studentId } = req.params;
            const marks = loadJSON(MARKS_FILE)
                .filter(m => m.studentId === studentId && m.status === 'verified');

            let totalCredits = 0, weightedSum = 0;
            const semesters = {};
            for (const m of marks) {
                totalCredits += m.credits;
                weightedSum += m.gradePoint * m.credits;
                if (!semesters[m.semester]) semesters[m.semester] = { credits: 0, weighted: 0 };
                semesters[m.semester].credits += m.credits;
                semesters[m.semester].weighted += m.gradePoint * m.credits;
            }

            const cgpa = totalCredits > 0 ? (weightedSum / totalCredits).toFixed(2) : 0;
            const semesterSGPAs = Object.entries(semesters).map(([sem, d]) => ({
                semester: parseInt(sem),
                sgpa: parseFloat((d.weighted / d.credits).toFixed(2)),
                credits: d.credits
            })).sort((a, b) => a.semester - b.semester);

            res.json({ success: true, data: { cgpa: parseFloat(cgpa), totalCredits, semesters: semesterSGPAs } });
        } catch (err) {
            logger.error(`Error calculating CGPA: ${err.message}`);
            res.status(500).json({ success: false, message: err.message });
        }
    }

    // ── POST /marks/upload ─────────────────────────────────────────
    // Exam section uploads marks (single or bulk)
    static async uploadMarks(req, res) {
        try {
            const user = req.user;
            if (user.role !== 'exam_section' && user.role !== 'admin') {
                return res.status(403).json({ success: false, message: 'Only exam section or admin can upload marks' });
            }

            const entries = Array.isArray(req.body) ? req.body : [req.body];
            const marks = loadJSON(MARKS_FILE);
            const courses = loadJSON(COURSES_FILE);
            const created = [];

            for (const entry of entries) {
                const { studentId, courseCode, semester, year, marksObtained, maxMarks } = entry;
                if (!studentId || !courseCode || !semester || !marksObtained) {
                    continue;
                }

                const course = courses.find(c => c.code === courseCode);
                const grade = MarksController._calculateGrade(marksObtained, maxMarks || 100);

                const newMark = {
                    id: `mark-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                    studentId,
                    courseCode,
                    semester: parseInt(semester),
                    year: parseInt(year) || new Date().getFullYear(),
                    marksObtained: parseFloat(marksObtained),
                    maxMarks: parseInt(maxMarks) || 100,
                    grade: grade.letter,
                    gradePoint: grade.point,
                    credits: course ? course.credits : parseInt(entry.credits) || 3,
                    status: 'pending',
                    uploadedBy: user.username || user.userId,
                    verifiedBy: null,
                    uploadedAt: new Date().toISOString(),
                    verifiedAt: null
                };

                marks.push(newMark);
                created.push(newMark);
            }

            saveJSON(MARKS_FILE, marks);
            logger.info(`Exam section uploaded ${created.length} mark(s)`);

            res.status(201).json({ success: true, message: `${created.length} mark(s) uploaded`, data: created });
        } catch (err) {
            logger.error(`Error uploading marks: ${err.message}`);
            res.status(500).json({ success: false, message: err.message });
        }
    }

    // ── PATCH /marks/:markId/verify ────────────────────────────────
    // Faculty verifies uploaded marks
    static async verifyMarks(req, res) {
        try {
            const user = req.user;
            if (user.role !== 'faculty' && user.role !== 'admin' && user.role !== 'hod') {
                return res.status(403).json({ success: false, message: 'Only faculty, HOD, or admin can verify marks' });
            }

            const { markId } = req.params;
            const marks = loadJSON(MARKS_FILE);
            const idx = marks.findIndex(m => m.id === markId);

            if (idx === -1) {
                return res.status(404).json({ success: false, message: 'Mark record not found' });
            }

            if (marks[idx].status === 'verified') {
                return res.status(400).json({ success: false, message: 'Already verified' });
            }

            marks[idx].status = 'verified';
            marks[idx].verifiedBy = user.username || user.userId;
            marks[idx].verifiedAt = new Date().toISOString();

            saveJSON(MARKS_FILE, marks);
            logger.info(`Mark ${markId} verified by ${marks[idx].verifiedBy}`);

            res.json({ success: true, message: 'Marks verified', data: marks[idx] });
        } catch (err) {
            logger.error(`Error verifying marks: ${err.message}`);
            res.status(500).json({ success: false, message: err.message });
        }
    }

    // ── GET /marks/pending ─────────────────────────────────────────
    // Faculty gets pending (unverified) marks for their courses
    static async getPendingMarks(req, res) {
        try {
            const user = req.user;
            const marks = loadJSON(MARKS_FILE).filter(m => m.status === 'pending');
            const users = loadJSON(USERS_FILE);

            // Faculty: only show marks for their courses
            let filtered = marks;
            if (user.role === 'faculty') {
                const faculty = users.find(u => u.username === (user.username || user.userId));
                const myCourses = faculty?.courses || [];
                filtered = marks.filter(m => myCourses.includes(m.courseCode));
            }

            const courses = loadJSON(COURSES_FILE);
            const enriched = filtered.map(m => {
                const course = courses.find(c => c.code === m.courseCode) || {};
                return { ...m, courseName: course.name || m.courseCode };
            });

            res.json({ success: true, data: enriched });
        } catch (err) {
            logger.error(`Error fetching pending marks: ${err.message}`);
            res.status(500).json({ success: false, message: err.message });
        }
    }

    // ── GET /marks/course/:courseCode ───────────────────────────────
    // Get all marks for a specific course (faculty use)
    static async getCourseMarks(req, res) {
        try {
            const { courseCode } = req.params;
            const marks = loadJSON(MARKS_FILE).filter(m => m.courseCode === courseCode);
            const users = loadJSON(USERS_FILE);

            const enriched = marks.map(m => {
                const student = users.find(u => u.username === m.studentId);
                return { ...m, studentName: student?.name || m.studentId };
            });

            res.json({ success: true, data: enriched });
        } catch (err) {
            logger.error(`Error fetching course marks: ${err.message}`);
            res.status(500).json({ success: false, message: err.message });
        }
    }

    // ── Helpers ─────────────────────────────────────────────────────
    static _calculateGrade(marks, maxMarks) {
        const pct = (marks / maxMarks) * 100;
        if (pct >= 90) return { letter: 'A+', point: 10 };
        if (pct >= 80) return { letter: 'A', point: 9 };
        if (pct >= 70) return { letter: 'B+', point: 8 };
        if (pct >= 60) return { letter: 'B', point: 7 };
        if (pct >= 50) return { letter: 'C', point: 6 };
        if (pct >= 40) return { letter: 'D', point: 5 };
        return { letter: 'F', point: 0 };
    }
}

module.exports = MarksController;

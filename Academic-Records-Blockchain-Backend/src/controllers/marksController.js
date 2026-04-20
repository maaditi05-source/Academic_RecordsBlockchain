/**
 * Marks Controller — Full Approval Chain
 * Status flow: draft → submitted → hod_approved → exam_approved → dean_approved → locked
 * Req #2: marks ≤ maxMarks validation
 * Req #3: upload by hod, faculty, exam_section
 * Req #8: semester-locked uploads (course semester enforced)
 * Req #10-13: multi-step approval chain
 */
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');
const dataSync = require('../utils/dataSync');

const USERS_FILE = path.join(__dirname, '../../data/users.json');

async function loadJSON(collection) {
    return await dataSync.readCollection(collection);
}
async function saveJSON(collection, data) {
    await dataSync.writeCollection(collection, data);
}

class MarksController {

    // ── GET /marks — All marks with query filters ───────────────────
    static async getAllMarks(req, res) {
        try {
            let marks = await loadJSON('marks');
            const courses = await loadJSON('courses');
            const { studentId, semester, courseCode, status, department } = req.query;

            if (studentId) marks = marks.filter(m => m.studentId === studentId);
            if (semester) marks = marks.filter(m => m.semester === parseInt(semester));
            if (courseCode) marks = marks.filter(m => m.courseCode === courseCode);
            if (status) marks = marks.filter(m => m.status === status);
            if (department) {
                const deptCourses = courses.filter(c => c.department === department).map(c => c.code);
                marks = marks.filter(m => deptCourses.includes(m.courseCode));
            }

            const enriched = marks.map(m => {
                const course = courses.find(c => c.code === m.courseCode) || {};
                return {
                    ...m,
                    courseName: course.name || m.courseCode,
                    courseCredits: course.credits || m.credits,
                    department: course.department || m.department
                };
            });

            res.json(enriched);
        } catch (err) {
            logger.error(`Error fetching marks: ${err.message}`);
            res.status(500).json({ error: err.message });
        }
    }

    // ── GET /marks/:studentId ─────────────────────────────────────
    static async getStudentMarks(req, res) {
        try {
            const { studentId } = req.params;
            const marks = await loadJSON('marks').filter(m => m.studentId === studentId);
            const courses = await loadJSON('courses');

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
            const marks = await loadJSON('marks')
                .filter(m => m.studentId === studentId && m.semester === parseInt(semester));
            const courses = await loadJSON('courses');

            const enriched = marks.map(m => {
                const course = courses.find(c => c.code === m.courseCode) || {};
                return { ...m, courseName: course.name || m.courseCode, courseCredits: course.credits || m.credits };
            });

            let totalCredits = 0, weightedSum = 0;
            for (const m of enriched) {
                if (m.status === 'locked' || m.status === 'verified') {
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
            const marks = await loadJSON('marks')
                .filter(m => m.studentId === studentId && (m.status === 'locked' || m.status === 'verified'));

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
    // Req #3: faculty, HOD, exam_section can upload
    // Req #2: marksObtained <= maxMarks (fixes >100 bug)
    // Req #8: course semester enforced
    static async uploadMarks(req, res) {
        try {
            const user = req.user;
            const allowedRoles = ['faculty', 'hod', 'exam_section', 'admin', 'department'];
            if (!allowedRoles.includes(user.role)) {
                return res.status(403).json({ success: false, message: 'Only faculty, HOD, exam section, or admin can upload marks' });
            }

            const entries = Array.isArray(req.body) ? req.body : [req.body];
            const marks = await loadJSON('marks');
            const courses = await loadJSON('courses');
            const created = [];
            const errors = [];

            for (const entry of entries) {
                const { studentId, courseCode, marksObtained, maxMarks, internal, external, proposedGrade } = entry;

                if (!studentId || !courseCode) {
                    errors.push(`Missing studentId or courseCode`);
                    continue;
                }

                // Validate course exists
                const course = courses.find(c => c.code === courseCode);
                if (!course) {
                    errors.push(`Course ${courseCode} not found`);
                    continue;
                }

                // Check for duplicate
                const existing = marks.find(m => m.studentId === studentId && m.courseCode === courseCode);
                if (existing) {
                    errors.push(`${courseCode} for ${studentId}: already uploaded (status: ${existing.status})`);
                    continue;
                }

                // Determine marks values
                const intMarks = internal !== undefined ? parseFloat(internal) : null;
                const extMarks = external !== undefined ? parseFloat(external) : null;
                const totalMarks = marksObtained !== undefined ? parseFloat(marksObtained) :
                    (intMarks !== null ? intMarks + (extMarks || 0) : null);
                const maxM = parseInt(maxMarks) || 100;

                if (totalMarks === null) {
                    errors.push(`${courseCode}: marks value required`);
                    continue;
                }

                // Req #2: marks cannot exceed maxMarks
                if (totalMarks > maxM) {
                    errors.push(`${courseCode} for ${studentId}: marks ${totalMarks} exceed maximum ${maxM}`);
                    continue;
                }
                if (totalMarks < 0) {
                    errors.push(`${courseCode} for ${studentId}: marks cannot be negative`);
                    continue;
                }
                if (intMarks !== null && intMarks > 40) {
                    errors.push(`${courseCode}: internal marks ${intMarks} exceed maximum 40`);
                    continue;
                }
                if (extMarks !== null && extMarks > 60) {
                    errors.push(`${courseCode}: external marks ${extMarks} exceed maximum 60`);
                    continue;
                }

                // Req #8: semester comes from course definition
                const semester = course.semester;

                // Check if semester is locked
                const lockedSems = loadJSON(path.join(__dirname, '../../data/locked_semesters.json'));
                const isLocked = lockedSems.some(l => l.department === course.department && l.semester === parseInt(semester));
                if (isLocked) {
                    errors.push(`${courseCode}: Semester ${semester} for ${course.department} is locked`);
                    continue;
                }

                const grade = MarksController._calculateGrade(totalMarks, maxM);

                const newMark = {
                    id: `mark-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                    studentId,
                    courseCode,
                    semester: parseInt(semester),
                    department: course.department,
                    year: parseInt(entry.year) || new Date().getFullYear(),
                    marksData: {
                        internal: intMarks,
                        external: extMarks,
                        total: totalMarks
                    },
                    marksObtained: totalMarks,
                    maxMarks: maxM,
                    grade: grade.letter,
                    gradePoint: grade.point,
                    proposedGrade: proposedGrade || null,
                    credits: course.credits || 3,
                    status: 'draft',
                    approvalChain: [],
                    uploadedBy: user.username || user.userId,
                    uploadedAt: new Date().toISOString(),
                };

                marks.push(newMark);
                created.push(newMark);
            }

            await saveJSON('marks', marks);

            if (created.length === 0 && errors.length > 0) {
                return res.status(400).json({ success: false, errors, message: errors.join('; ') });
            }

            res.status(201).json({ success: true, message: `${created.length} mark(s) uploaded`, data: created, errors });
        } catch (err) {
            logger.error(`Error uploading marks: ${err.message}`);
            res.status(500).json({ success: false, message: err.message });
        }
    }

    // ── PUT /marks/:markId/submit — Faculty submits to HOD ─────────
    static async submitMarks(req, res) {
        try {
            const marks = await loadJSON('marks');
            const idx = marks.findIndex(m => m.id === req.params.markId);
            if (idx === -1) return res.status(404).json({ success: false, message: 'Mark not found' });
            if (marks[idx].status !== 'draft') {
                return res.status(400).json({ success: false, message: `Cannot submit: current status is ${marks[idx].status}` });
            }

            marks[idx].status = 'submitted';
            marks[idx].submittedAt = new Date().toISOString();
            marks[idx].submittedBy = req.user.username;
            marks[idx].approvalChain = marks[idx].approvalChain || [];
            marks[idx].approvalChain.push({ role: 'faculty', user: req.user.username, action: 'submitted', at: new Date().toISOString() });

            await saveJSON('marks', marks);
            res.json({ success: true, message: 'Marks submitted to HOD for approval', data: marks[idx] });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    // ── PUT /marks/:markId/hod-approve — HOD approves ──────────────
    static async hodApproveMarks(req, res) {
        try {
            const user = req.user;
            if (!['hod', 'department', 'admin'].includes(user.role)) {
                return res.status(403).json({ success: false, message: 'Only HOD or admin can approve at this stage' });
            }

            const marks = await loadJSON('marks');
            const idx = marks.findIndex(m => m.id === req.params.markId);
            if (idx === -1) return res.status(404).json({ success: false, message: 'Mark not found' });
            if (marks[idx].status !== 'submitted') {
                return res.status(400).json({ success: false, message: `Cannot HOD-approve: current status is ${marks[idx].status}` });
            }

            marks[idx].status = 'hod_approved';
            marks[idx].approvalChain = marks[idx].approvalChain || [];
            marks[idx].approvalChain.push({ role: 'hod', user: user.username, action: 'approved', at: new Date().toISOString() });

            await saveJSON('marks', marks);
            res.json({ success: true, message: 'Marks approved by HOD, forwarded to Exam Section', data: marks[idx] });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    // ── PUT /marks/:markId/exam-approve — Exam Section approves ────
    static async examApproveMarks(req, res) {
        try {
            const user = req.user;
            if (!['exam_section', 'admin'].includes(user.role)) {
                return res.status(403).json({ success: false, message: 'Only Exam Section or admin can approve at this stage' });
            }

            const marks = await loadJSON('marks');
            const idx = marks.findIndex(m => m.id === req.params.markId);
            if (idx === -1) return res.status(404).json({ success: false, message: 'Mark not found' });
            if (marks[idx].status !== 'hod_approved') {
                return res.status(400).json({ success: false, message: `Cannot exam-approve: current status is ${marks[idx].status}` });
            }

            marks[idx].status = 'exam_approved';
            marks[idx].approvalChain = marks[idx].approvalChain || [];
            marks[idx].approvalChain.push({ role: 'exam_section', user: user.username, action: 'approved', at: new Date().toISOString() });

            await saveJSON('marks', marks);
            res.json({ success: true, message: 'Marks approved by Exam Section, forwarded to Dean', data: marks[idx] });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    // ── PUT /marks/:markId/dean-approve — Dean approves ────────────
    static async deanApproveMarks(req, res) {
        try {
            const user = req.user;
            if (!['dean_academic', 'admin'].includes(user.role)) {
                return res.status(403).json({ success: false, message: 'Only Dean or admin can approve at this stage' });
            }

            const marks = await loadJSON('marks');
            const idx = marks.findIndex(m => m.id === req.params.markId);
            if (idx === -1) return res.status(404).json({ success: false, message: 'Mark not found' });
            if (marks[idx].status !== 'exam_approved') {
                return res.status(400).json({ success: false, message: `Cannot dean-approve: current status is ${marks[idx].status}` });
            }

            marks[idx].status = 'dean_approved';
            marks[idx].approvalChain = marks[idx].approvalChain || [];
            marks[idx].approvalChain.push({ role: 'dean', user: user.username, action: 'approved', at: new Date().toISOString() });

            await saveJSON('marks', marks);
            res.json({ success: true, message: 'Marks approved by Dean, forwarded to Admin for finalization', data: marks[idx] });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    // ── PUT /marks/:markId/admin-finalize — Admin final sign ───────
    static async adminFinalizeMarks(req, res) {
        try {
            const user = req.user;
            if (user.role !== 'admin') {
                return res.status(403).json({ success: false, message: 'Only admin can finalize marks' });
            }

            const marks = await loadJSON('marks');
            const idx = marks.findIndex(m => m.id === req.params.markId);
            if (idx === -1) return res.status(404).json({ success: false, message: 'Mark not found' });
            if (marks[idx].status !== 'dean_approved') {
                return res.status(400).json({ success: false, message: `Cannot finalize: current status is ${marks[idx].status}` });
            }

            marks[idx].status = 'locked';
            marks[idx].approvalChain = marks[idx].approvalChain || [];
            marks[idx].approvalChain.push({ role: 'admin', user: user.username, action: 'finalized', at: new Date().toISOString() });
            marks[idx].finalizedAt = new Date().toISOString();

            await saveJSON('marks', marks);
            res.json({ success: true, message: 'Marks finalized and locked', data: marks[idx] });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    // ── PUT /marks/:markId/reject — Any approver rejects ───────────
    static async rejectMarks(req, res) {
        try {
            const user = req.user;
            const allowedRoles = ['hod', 'department', 'exam_section', 'dean_academic', 'admin'];
            if (!allowedRoles.includes(user.role)) {
                return res.status(403).json({ success: false, message: 'Not authorized to reject marks' });
            }

            const marks = await loadJSON('marks');
            const idx = marks.findIndex(m => m.id === req.params.markId);
            if (idx === -1) return res.status(404).json({ success: false, message: 'Mark not found' });

            const { reason } = req.body;
            marks[idx].status = 'rejected';
            marks[idx].rejectedBy = user.username;
            marks[idx].rejectionReason = reason || 'No reason provided';
            marks[idx].rejectedAt = new Date().toISOString();
            marks[idx].approvalChain = marks[idx].approvalChain || [];
            marks[idx].approvalChain.push({ role: user.role, user: user.username, action: 'rejected', reason: reason || '', at: new Date().toISOString() });

            await saveJSON('marks', marks);
            res.json({ success: true, message: 'Marks rejected', data: marks[idx] });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    // ── PUT /marks/semester/:dept/:semester/lock — Lock semester ────
    static async lockSemester(req, res) {
        try {
            const user = req.user;
            if (!['exam_section', 'admin'].includes(user.role)) {
                return res.status(403).json({ success: false, message: 'Only Exam Section or admin can lock semesters' });
            }

            const { dept, semester } = req.params;
            const lockFile = path.join(__dirname, '../../data/locked_semesters.json');
            const locked = loadJSON(lockFile);

            const already = locked.find(l => l.department === dept && l.semester === parseInt(semester));
            if (already) {
                return res.status(400).json({ success: false, message: `Semester ${semester} for ${dept} is already locked` });
            }

            locked.push({
                department: dept,
                semester: parseInt(semester),
                lockedBy: user.username,
                lockedAt: new Date().toISOString()
            });
            saveJSON(lockFile, locked);

            // Also lock all exam_approved marks for this dept+semester
            const marks = await loadJSON('marks');
            const courses = await loadJSON('courses');
            const deptCourses = courses.filter(c => c.department === dept).map(c => c.code);
            let lockedCount = 0;
            for (let i = 0; i < marks.length; i++) {
                if (deptCourses.includes(marks[i].courseCode) &&
                    marks[i].semester === parseInt(semester) &&
                    marks[i].status === 'exam_approved') {
                    marks[i].status = 'locked';
                    marks[i].approvalChain = marks[i].approvalChain || [];
                    marks[i].approvalChain.push({ role: 'exam_section', user: user.username, action: 'semester_locked', at: new Date().toISOString() });
                    lockedCount++;
                }
            }
            await saveJSON('marks', marks);

            res.json({ success: true, message: `Semester ${semester} for ${dept} locked. ${lockedCount} marks auto-locked.` });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    // ── PATCH /marks/:markId/verify — Legacy verify endpoint ───────
    static async verifyMarks(req, res) {
        try {
            const user = req.user;
            if (user.role !== 'exam_section' && user.role !== 'admin') {
                return res.status(403).json({ success: false, message: 'Only exam section or admin can verify marks' });
            }

            const { markId } = req.params;
            const marks = await loadJSON('marks');
            const idx = marks.findIndex(m => m.id === markId);
            if (idx === -1) return res.status(404).json({ success: false, message: 'Mark record not found' });
            if (marks[idx].status === 'verified' || marks[idx].status === 'locked') {
                return res.status(400).json({ success: false, message: 'Already verified/locked' });
            }

            marks[idx].status = 'verified';
            marks[idx].verifiedBy = user.username || user.userId;
            marks[idx].verifiedAt = new Date().toISOString();

            await saveJSON('marks', marks);
            res.json({ success: true, message: 'Marks verified', data: marks[idx] });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    // ── GET /marks/pending ─────────────────────────────────────────
    static async getPendingMarks(req, res) {
        try {
            const user = req.user;
            const marks = await loadJSON('marks').filter(m => m.status === 'pending' || m.status === 'submitted');
            const courses = await loadJSON('courses');

            let filtered = marks;
            if (user.role === 'exam_section' || user.role === 'admin') {
                filtered = marks;
            } else if (user.role === 'hod' || user.role === 'department') {
                const dept = user.department || '';
                const deptCourses = courses.filter(c => c.department === dept).map(c => c.code);
                filtered = marks.filter(m => deptCourses.includes(m.courseCode));
            } else {
                filtered = [];
            }

            const enriched = filtered.map(m => {
                const course = courses.find(c => c.code === m.courseCode) || {};
                return { ...m, courseName: course.name || m.courseCode };
            });

            res.json({ success: true, data: enriched });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    // ── GET /marks/course/:courseCode ───────────────────────────────
    static async getCourseMarks(req, res) {
        try {
            const { courseCode } = req.params;
            const marks = await loadJSON('marks').filter(m => m.courseCode === courseCode);
            const users = await loadJSON('users');

            const enriched = marks.map(m => {
                const student = users.find(u => u.username === m.studentId);
                return { ...m, studentName: student?.name || m.studentId };
            });

            res.json({ success: true, data: enriched });
        } catch (err) {
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

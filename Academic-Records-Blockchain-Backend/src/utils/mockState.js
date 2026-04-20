/**
 * mockState.js — Centralized offline fallback store
 * 
 * When the blockchain network is offline:
 * - submitTransaction writes go to local JSON files
 * - evaluateTransaction reads fall back to local JSON files
 * 
 * When the network is online, these are never called.
 * 
 * This module also serves as the single in-memory cache for
 * offline-created entities (students, departments, etc.)
 * so that GETs immediately reflect POSTs.
 */

const path = require('path');
const fs = require('fs');
const logger = require('./logger');

const DATA_DIR = path.join(__dirname, '../../data');

// ── Helpers ──────────────────────────────────────────────────────────

function readJSON(filename) {
    const filePath = path.join(DATA_DIR, filename);
    try {
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
    } catch (e) {
        logger.warn(`[mockState] Could not read ${filename}: ${e.message}`);
    }
    return [];
}

function writeJSON(filename, data) {
    const filePath = path.join(DATA_DIR, filename);
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
        logger.error(`[mockState] Could not write ${filename}: ${e.message}`);
    }
}

// ── In-memory cache (supplements the JSON files with fresh writes) ──

const memoryCache = {
    students: [],
    departments: [],
    certificates: [],
    records: [],
    courses: []
};

// ── WRITE handlers (called when submitTransaction mock triggers) ────

function handleWrite(functionName, args, transientData) {
    logger.info(`[mockState] Persisting offline write for ${functionName}`);

    switch (functionName) {
        case 'CreateStudent': {
            const student = {
                studentId: args[0],
                name: args[1],
                department: args[2],
                enrollmentYear: parseInt(args[3]) || 2025,
                rollNumber: args[0],
                email: args[4] || `${args[0].toLowerCase()}@student.nitw.ac.in`,
                admissionCategory: args[5] || 'GENERAL',
                status: 'ACTIVE',
                totalCreditsEarned: 0,
                currentCGPA: 0,
                createdAt: new Date().toISOString(),
                _offlineCreated: true
            };
            memoryCache.students.push(student);

            // Also persist to students_offline.json
            const existing = readJSON('students_offline.json');
            existing.push(student);
            writeJSON('students_offline.json', existing);

            return student;
        }

        case 'CreateDepartment': {
            const dept = {
                departmentId: args[0],
                name: args[1],
                hod: args[2] || 'TBD',
                email: args[3] || `${args[0].toLowerCase()}@nitw.ac.in`,
                phone: args[4] || '0000000000',
                status: 'ACTIVE',
                _offlineCreated: true
            };
            memoryCache.departments.push(dept);

            const existing = readJSON('departments_offline.json');
            existing.push(dept);
            writeJSON('departments_offline.json', existing);

            return dept;
        }

        case 'CreateAcademicRecord': {
            const record = {
                recordId: args[0],
                rollNumber: args[1],
                semester: parseInt(args[2]),
                year: args[3],
                department: args[4],
                courses: JSON.parse(args[5] || '[]'),
                status: 'DRAFT',
                _offlineCreated: true
            };
            memoryCache.records.push(record);
            return record;
        }

        case 'CreateCourseOffering': {
            const course = {
                department: args[0],
                code: args[1],
                name: args[2],
                credits: parseInt(args[3]) || 0,
                semester: parseInt(args[4]) || 0,
                academicYear: args[5],
                status: 'ACTIVE',
                _offlineCreated: true
            };
            memoryCache.courses.push(course);

            const existing = readJSON('courses_offline.json');
            existing.push(course);
            writeJSON('courses_offline.json', existing);

            return course;
        }

        case 'IssueCertificate': {
            const cert = {
                certificateId: args[0],
                studentId: args[1],
                type: args[2],
                isValid: true,
                status: 'valid',
                issuedAt: new Date().toISOString(),
                _offlineCreated: true
            };
            memoryCache.certificates.push(cert);
            return cert;
        }

        default:
            // Generic mock — any other submit just returns success
            logger.info(`[mockState] No specific handler for ${functionName}, returning generic success`);
            return { success: true, simulated: true };
    }
}

// ── READ handlers (called when evaluateTransaction fails) ──────────

function handleQuery(functionName, args) {
    logger.info(`[mockState] Serving offline read for ${functionName}`);

    switch (functionName) {
        case 'GetAllStudents': {
            // Combine on-chain students from last known state + offline-created
            const offlineStudents = readJSON('students_offline.json');
            const combined = [...offlineStudents, ...memoryCache.students];
            // De-duplicate by studentId
            const seen = new Set();
            return combined.filter(s => {
                if (seen.has(s.studentId)) return false;
                seen.add(s.studentId);
                return true;
            });
        }

        case 'GetStudent': {
            const studentId = args[0];
            // Check memory first, then offline JSON
            const inMem = memoryCache.students.find(s => s.studentId === studentId);
            if (inMem) return inMem;

            const offlineStudents = readJSON('students_offline.json');
            const fromFile = offlineStudents.find(s => s.studentId === studentId);
            if (fromFile) return fromFile;

            // Return a placeholder so the profile page doesn't crash
            return {
                studentId: studentId,
                name: studentId,
                department: 'N/A',
                email: `${studentId.toLowerCase()}@student.nitw.ac.in`,
                status: 'ACTIVE',
                _placeholder: true
            };
        }

        case 'QueryStudentsByDepartment': {
            const dept = args[0];
            const offlineStudents = readJSON('students_offline.json');
            const combined = [...offlineStudents, ...memoryCache.students];
            const seen = new Set();
            return combined.filter(s => {
                if (seen.has(s.studentId)) return false;
                seen.add(s.studentId);
                return s.department === dept;
            });
        }

        case 'QueryStudentsByYear': {
            const year = parseInt(args[0]);
            const offlineStudents = readJSON('students_offline.json');
            return offlineStudents.filter(s => s.enrollmentYear === year);
        }

        case 'GetAllDepartments': {
            const offlineDepts = readJSON('departments_offline.json');
            return [...offlineDepts, ...memoryCache.departments];
        }

        case 'GetDepartment': {
            const deptId = args[0];
            const offlineDepts = readJSON('departments_offline.json');
            const all = [...offlineDepts, ...memoryCache.departments];
            return all.find(d => d.departmentId === deptId) || { departmentId: deptId, name: deptId, status: 'ACTIVE' };
        }

        case 'GetCoursesByDepartment': {
            const deptId = args[0];
            const offlineCourses = readJSON('courses_offline.json');
            const combined = [...offlineCourses, ...memoryCache.courses];
            // Filter by department and deduplicate by code
            const seen = new Set();
            return combined.filter(c => {
                if (c.department !== deptId) return false;
                if (seen.has(c.code)) return false;
                seen.add(c.code);
                return true;
            });
        }

        case 'GetStudentHistory':
        case 'GetRecordsBySemester':
        case 'GetRecordsByDepartment':
        case 'QueryPendingRecords':
            return [];

        case 'GetStudentCGPA':
            return 0;

        case 'GetAllCertificates':
        case 'GetStudentCertificates':
            return memoryCache.certificates;

        case 'GetCertificate':
            return memoryCache.certificates.find(c => c.certificateId === args[0]) || null;

        default:
            logger.info(`[mockState] No specific query handler for ${functionName}, returning empty array`);
            return [];
    }
}

module.exports = {
    handleWrite,
    handleQuery,
    memoryCache
};

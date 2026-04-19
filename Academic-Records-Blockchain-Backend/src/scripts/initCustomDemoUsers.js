const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const USERS_FILE = path.join(__dirname, '../../data/users.json');
const SALT_ROUNDS = 10;

const customUsers = [
    { username: 'admin', email: 'admin@nitw.edu', password: 'admin123', role: 'admin', department: null },
    { username: 'cse_faculty', email: 'cse_faculty@nitw.edu', password: 'csefaculty123', role: 'faculty', department: 'CSE' },
    { username: 'cse_hod', email: 'cse_hod@nitw.edu', password: 'csehod123', role: 'hod', department: 'CSE' },
    { username: 'ece_faculty', email: 'ece_faculty@nitw.edu', password: 'ecefaculty123', role: 'faculty', department: 'ECE' },
    { username: 'ece_hod', email: 'ece_hod@nitw.edu', password: 'ecehod123', role: 'hod', department: 'ECE' },
    { username: 'dean_academic', email: 'dean_academic@nitw.edu', password: 'dean123', role: 'dean_academic', department: null },
    { username: 'exam_section', email: 'exam_section@nitw.edu', password: 'exam123', role: 'exam_section', department: null },
    { username: 'verifier_demo', email: 'verifier_demo@nitw.edu', password: 'verifier123', role: 'verifier', department: null }
];

let users = [];
if (fs.existsSync(USERS_FILE)) {
    users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
}

// Preserve existing students
const existingStudents = users.filter(u => u.role === 'student');

const newUsersList = customUsers.map(u => ({
    id: `usr_${Date.now()}_${Math.floor(Math.random() * 1000)}_${u.username}`,
    username: u.username,
    email: u.email,
    passwordHash: bcrypt.hashSync(u.password, SALT_ROUNDS),
    role: u.role,
    department: u.department,
    createdAt: new Date().toISOString(),
    isActive: true
}));

const finalUsersList = [...newUsersList, ...existingStudents];

fs.writeFileSync(USERS_FILE, JSON.stringify(finalUsersList, null, 2));
console.log('Successfully updated users.json with requested demo users');

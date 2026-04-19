const fs = require('fs');
const bcrypt = require('bcryptjs');
const path = require('path');

const usersFile = path.join(__dirname, '../data/users.json');
let users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));

const SALT_ROUNDS = 10;
const defaultPass = bcrypt.hashSync('password123', SALT_ROUNDS);

const mockUsers = [
    { username: 'cse_faculty', role: 'faculty', dept: 'CSE', pass: 'csefaculty123' },
    { username: 'cse_hod', role: 'hod', dept: 'CSE', pass: 'csehod123' },
    { username: 'ece_faculty', role: 'faculty', dept: 'ECE', pass: 'ecefaculty123' },
    { username: 'ece_hod', role: 'hod', dept: 'ECE', pass: 'ecehod123' },
    { username: 'verifier_demo', role: 'verifier', dept: null, pass: 'verifier123' },
    { username: 'dean_academic', role: 'dean_academic', dept: null, pass: 'dean123' },
    { username: 'exam_section', role: 'exam_section', dept: null, pass: 'exam123' }
];

mockUsers.forEach(u => {
    if (!users.find(existing => existing.username === u.username)) {
        users.push({
            id: `${u.username}-mock`,
            username: u.username,
            email: `${u.username}@nitw.ac.in`,
            passwordHash: bcrypt.hashSync(u.pass, SALT_ROUNDS),
            role: u.role,
            department: u.dept,
            createdAt: new Date().toISOString(),
            isActive: true
        });
    }
});

fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
console.log('Added mock users for testing');

const fs = require('fs');
const bcrypt = require('bcryptjs');
const path = require('path');

const usersFile = path.join(__dirname, '../data/users.json');
let users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));

const SALT_ROUNDS = 10;
const defaultPass = bcrypt.hashSync('password123', SALT_ROUNDS);

const newRoles = ['faculty', 'hod', 'dac_member', 'exam_section', 'dean_academic'];

newRoles.forEach(role => {
    if (!users.find(u => u.role === role)) {
        users.push({
            id: `${role}-mock`,
            username: `${role}_demo`,
            email: `${role}@nitw.ac.in`,
            passwordHash: defaultPass,
            role: role,
            department: 'CSE',
            createdAt: new Date().toISOString(),
            isActive: true
        });
    }
});

fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
console.log('Added mock users for testing');

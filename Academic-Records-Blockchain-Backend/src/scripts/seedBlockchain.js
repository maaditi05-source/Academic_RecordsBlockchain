/**
 * seedBlockchain.js
 * -----------------
 * Run this script ONCE after every `./network.sh up` to re-populate
 * the fresh (empty) blockchain ledger with the student records that
 * still exist in data/users.json.
 *
 * Usage:
 *   cd Academic-Records-Blockchain-Backend
 *   node src/importAdmin.js          # refresh admin wallet first
 *   node src/scripts/seedBlockchain.js
 *
 * Or via npm:
 *   npm run import-admin && npm run seed
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const path = require('path');
const fs = require('fs');

const FabricGateway = require('../fabricGateway');

const USERS_FILE = path.join(__dirname, '../../data/users.json');

// ─── helpers ────────────────────────────────────────────────────────────────

function loadStudentsFromJson() {
    try {
        const raw = fs.readFileSync(USERS_FILE, 'utf8');
        const users = JSON.parse(raw);
        return users.filter(u => u.role === 'student' && u.isActive);
    } catch (err) {
        console.error('❌  Could not read data/users.json:', err.message);
        process.exit(1);
    }
}

async function studentExistsOnChain(gateway, rollNumber) {
    try {
        await gateway.evaluateTransaction('GetStudent', rollNumber);
        return true;   // no error → student exists
    } catch (_) {
        return false;  // asset not found → does not exist
    }
}

// ─── main ────────────────────────────────────────────────────────────────────

async function seed() {
    const students = loadStudentsFromJson();
    if (students.length === 0) {
        console.log('ℹ️  No student accounts found in users.json – nothing to seed.');
        process.exit(0);
    }

    console.log(`\n🌱  Seeding ${students.length} student(s) to the blockchain…\n`);

    // Use a single admin gateway for all submissions
    const gateway = new FabricGateway();
    const adminUser = {
        userId: 'admin',
        role: 'admin',
        mspId: process.env.FABRIC_MSP_ID || 'NITWarangalMSP',
    };

    try {
        await gateway.connect(adminUser);
    } catch (err) {
        console.error('❌  Could not connect to Fabric gateway:', err.message);
        console.error('    Make sure `node src/importAdmin.js` has been run first.');
        process.exit(1);
    }

    let created = 0;
    let skipped = 0;
    let failed = 0;

    for (const student of students) {
        const rollNumber = student.username;   // username == rollNumber
        const name = student.name || rollNumber;
        const department = student.department || 'CSE';
        const email = student.email || `${rollNumber}@student.nitw.ac.in`;
        const year = student.enrollmentYear
            ? student.enrollmentYear.toString()
            : new Date().getFullYear().toString();
        const category = student.admissionCategory || 'GENERAL';

        process.stdout.write(`  • ${rollNumber} (${name}) … `);

        // 1. Skip if already on the ledger (idempotent)
        if (await studentExistsOnChain(gateway, rollNumber)) {
            console.log('already on-chain ✓ (skipped)');
            skipped++;
            continue;
        }

        // 2. Submit CreateStudent transaction
        try {
            const transientData = {
                aadhaarHash: Buffer.from(`HASH-${rollNumber}`),
                phone: Buffer.from(student.phone || '0000000000'),
                personalEmail: Buffer.from(email),
            };

            await gateway.submitTransactionWithTransient(
                'CreateStudent',
                transientData,
                rollNumber,
                name,
                department,
                year,
                email,
                category
            );
            console.log('created ✅');
            created++;
        } catch (err) {
            console.log(`FAILED ❌  (${err.message})`);
            failed++;
        }
    }

    await gateway.disconnect();

    console.log(`\n📊  Seed complete:`);
    console.log(`   Created : ${created}`);
    console.log(`   Skipped : ${skipped} (already on-chain)`);
    console.log(`   Failed  : ${failed}`);
    console.log('');

    if (failed > 0) {
        process.exit(1);
    }
}

seed().catch(err => {
    console.error('\n❌  Unexpected error during seeding:', err.message);
    process.exit(1);
});

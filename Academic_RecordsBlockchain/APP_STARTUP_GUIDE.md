# 🚀 APPLICATION STARTUP — Per-System Guide (April 19, 2026)

> **Blockchain network is LIVE.** This guide starts the backend + frontend on each system.
>
> ⚠️ **CRITICAL INSTRUCTIONS FOR ALL TEAM MEMBERS:**
> 1. ALWAYS run `npm install` when opening the Backend or Frontend folders for the first time.
> 2. The guide below uses `~/Academic-Records-Blockchain-Backend`, but if you downloaded the project into a `workspace` folder, you must use your actual path (e.g., `cd ~/workspace/Academic-Records-Blockchain-Backend`). If `cd` gives a "No such file" error, STOP and fix the path!
> 3. Use `node src/importAdmin.js` (NOT `enrollAdmin.js` — CA servers are offline).

---

## ⚡ QUICK REFERENCE

| System | Person | .env File | Port | MSP |
|--------|--------|-----------|------|-----|
| 4 | Aditi | `.env` (default) | 3000 | NITWarangalMSP |
| 5 | Sejal | `.env.nitwarangal-peer1` | 3001 | NITWarangalMSP |
| 6 | Shyamashree | `.env.nitwarangal-peer2` | 3004 | NITWarangalMSP |
| 7 | Shreya | `.env.departments` | 3000 | DepartmentsMSP |
| 8 | Manasvi | `.env.cse` | 3002 | DepartmentsMSP |
| 9 | Saim | `.env.ece` | 3003 | DepartmentsMSP |
| 10 | Amit | — *(no backend, peer only)* | — | — |
| 11 | Mousumi | `.env.verifiers` | 3000 | VerifiersMSP |
| 12 | Aakash | `.env.verifiers-peer1` | 3007 | VerifiersMSP |

---

## 💻 SYSTEM 4: Aditi (Admin — NITWarangalMSP) ✅ ALREADY RUNNING

Backend: `http://localhost:3000/api`
Frontend: `http://localhost:4200`

---

## 💻 SYSTEM 5: Sejal (ExamSection — NITWarangalMSP)

```bash
# Step 1: Pull latest code
cd ~/Academic_RecordsBlockchain/Academic_RecordsBlockchain
git stash && git pull

# Step 2: Start backend
cd ~/Academic-Records-Blockchain-Backend
# OR wherever your backend folder is
git stash && git pull
cp .env.nitwarangal-peer1 .env
rm -rf wallet/*
node src/importAdmin.js
npm start

# Step 3: Start frontend (new terminal)
cd ~/Academic-Records-Blockchain-Frontend
# OR wherever your frontend folder is
npm install
npx ng serve
```

---

## 💻 SYSTEM 6: Shyamashree (Dean — NITWarangalMSP)

```bash
# Step 1: Pull latest code
cd ~/Academic_RecordsBlockchain/Academic_RecordsBlockchain
git stash && git pull

# Step 2: Start backend
# IMPORTANT: Replace the path below with your actual backend folder path if it's different!
cd ~/Academic-Records-Blockchain-Backend
git stash && git pull
npm install
cp .env.nitwarangal-peer2 .env
rm -rf wallet/*
node src/importAdmin.js
npm start

# Step 3: Start frontend (new terminal)
cd ~/Academic-Records-Blockchain-Frontend
npm install
npx ng serve
```

---

## 💻 SYSTEM 7: Shreya (CSE HOD — DepartmentsMSP)

```bash
# Step 1: Pull latest code
cd ~/Academic_RecordsBlockchain/Academic_RecordsBlockchain
git stash && git pull

# Step 2: Start backend
# IMPORTANT: Replace the path below with your actual backend folder path if it's different!
cd ~/Academic-Records-Blockchain-Backend
git stash && git pull
npm install
cp .env.departments .env
rm -rf wallet/*
node src/importAdmin.js
npm start

# Step 3: Start frontend (new terminal)
cd ~/Academic-Records-Blockchain-Frontend
npm install
npx ng serve
```

---

## 💻 SYSTEM 8: Manasvi (CSE Faculty — DepartmentsMSP)

```bash
# Step 1: Pull latest
cd ~/Academic_RecordsBlockchain/Academic_RecordsBlockchain
git stash && git pull

# Step 2: Start backend
# IMPORTANT: Replace the path below with your actual backend folder path if it's different!
cd ~/Academic-Records-Blockchain-Backend
git stash && git pull
npm install
cp .env.cse .env
rm -rf wallet/*
node src/importAdmin.js
npm start

# Step 3: Start frontend (new terminal)
cd ~/Academic-Records-Blockchain-Frontend
npm install
npx ng serve
```

---

## 💻 SYSTEM 9: Saim (ECE HOD — DepartmentsMSP)

```bash
# Step 1: Pull latest
cd ~/Academic_RecordsBlockchain/Academic_RecordsBlockchain
git stash && git pull

# Step 2: Start backend
# IMPORTANT: Replace the path below with your actual backend folder path if it's different!
cd ~/Academic-Records-Blockchain-Backend
git stash && git pull
npm install
cp .env.ece .env
rm -rf wallet/*
node src/importAdmin.js
npm start

# Step 3: Start frontend (new terminal)
cd ~/Academic-Records-Blockchain-Frontend
npm install
npx ng serve
```

---

## 💻 SYSTEM 11: Mousumi (Primary Verifier — VerifiersMSP)

```bash
# Step 1: Pull latest
cd ~/Academic_RecordsBlockchain/Academic_RecordsBlockchain
git stash && git pull

# Step 2: Start backend
# IMPORTANT: Replace the path below with your actual backend folder path if it's different!
cd ~/Academic-Records-Blockchain-Backend
git stash && git pull
npm install
cp .env.verifiers .env
rm -rf wallet/*
node src/importAdmin.js
npm start

# Step 3: Start frontend (new terminal)
cd ~/Academic-Records-Blockchain-Frontend
npm install
npx ng serve
```

---

## 💻 SYSTEM 12: Aakash (Secondary Verifier — VerifiersMSP)

```bash
# Step 1: Pull latest
cd ~/Academic_RecordsBlockchain/Academic_RecordsBlockchain
git stash && git pull

# Step 2: Start backend
# IMPORTANT: Replace the path below with your actual backend folder path if it's different!
cd ~/Academic-Records-Blockchain-Backend
git stash && git pull
npm install
cp .env.verifiers-peer1 .env
rm -rf wallet/*
node src/importAdmin.js
npm start

# Step 3: Start frontend (new terminal)
cd ~/Academic-Records-Blockchain-Frontend
npm install
npx ng serve
```

---

## 🔑 DEFAULT TEST CREDENTIALS

If you delete `backend/data/users.json` and restart the backend, it will auto-generate these mock testing accounts:

| Role | Username | Password |
|------|----------|----------|
| **Admin** | `admin` | `admin123` |
| **Faculty (CSE)** | `cse_faculty` | `csefaculty123` |
| **HOD (CSE)** | `cse_hod` | `csehod123` |
| **Faculty (ECE)** | `ece_faculty` | `ecefaculty123` |
| **HOD (ECE)** | `ece_hod` | `ecehod123` |
| **Dean** | `dean_academic` | `dean123` |
| **Exam Section** | `exam_section` | `exam123` |
| **Verifier** | `verifier_demo` | `verifier123` |

*(Students do not have a default account — they must click Register via the UI, and the Admin must approve them! The default password for a student is the password they pick during signup).*

---

## 🔍 TROUBLESHOOTING

**"Failed to connect to remote gRPC server" warnings:**
These are non-fatal. The SDK tries to connect to ALL peers discovered on the channel. As long as the anchor peer for your org is reachable, transactions will work.

**"enrollAdmin failed / ECONNREFUSED":**
Use `node src/importAdmin.js` instead of `node src/enrollAdmin.js`. The CA servers are not running.

**Frontend "ng: command not found":**
Use `npx ng serve` instead of `ng serve`.

**Data replication:**
Any data created on one system (e.g., a student created by Aditi) is automatically replicated to ALL peers via the orderer. Other systems will see it when they query the blockchain.

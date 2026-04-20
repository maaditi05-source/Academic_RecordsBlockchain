# 13-Node Startup & Certificate Pipeline Testing Guide

---

## Part 1 — Starting the Network

### Step 1: Environment Setup (ALL 13 Systems)

Every system must run these commands first:

```bash
git pull
cd Academic_RecordsBlockchain
source ./env.sh
./update-hosts.sh
```

> [!IMPORTANT]
> If you see "access denied" errors at any point, run:
> `export NODE_TLS_REJECT_UNAUTHORIZED='0'`

---

### Step 2: Start Orderers (Consensus — 3 Systems)

Start in this exact order. Wait ~10 seconds between each.

| Person   | Role              | Command |
|----------|-------------------|---------|
| Bhargav  | Primary Orderer   | `docker-compose -f docker/docker-compose-orderer1.yaml up -d` |
| Atul     | Raft Follower 1   | `docker-compose -f docker/docker-compose-orderer2.yaml up -d` |
| Vindhya  | Raft Follower 2   | `docker-compose -f docker/docker-compose-orderer3.yaml up -d` |

**Verify:** `docker ps` should show the orderer container running on each system.

---

### Step 3: Start Peers + Backend (10 Systems)

Each person runs **3 commands in sequence**:

| Person      | Role            | Docker Compose File | Peer Recovery Command |
|-------------|-----------------|--------------------|-----------------------|
| **Aditi**   | Admin           | `docker/docker-compose-nitwarangal-peer0.yaml` | `./recover-peer.sh peer0.nitwarangal.nitw.edu NITWarangalMSP` |
| **Sejal**   | Exam Section    | `docker/docker-compose-nitwarangal-peer1.yaml` | `./recover-peer.sh peer1.nitwarangal.nitw.edu NITWarangalMSP` |
| **Shyamashree** | Dean        | `docker/docker-compose-nitwarangal-peer2.yaml` | `./recover-peer.sh peer2.nitwarangal.nitw.edu NITWarangalMSP` |
| **Shreya**  | CSE HOD         | `docker/docker-compose-depts-cse.yaml` | `./recover-peer.sh peer0.cse.departments.nitw.edu DepartmentsMSP` |
| **Manasvi** | CSE Faculty     | `docker/docker-compose-depts-cse-faculty.yaml` | `./recover-peer.sh peer1.cse.departments.nitw.edu DepartmentsMSP` |
| **Saim**    | ECE HOD         | `docker/docker-compose-depts-ece.yaml` | `./recover-peer.sh peer0.ece.departments.nitw.edu DepartmentsMSP` |
| **Amit**    | ECE Faculty     | `docker/docker-compose-depts-ece-faculty.yaml` | `./recover-peer.sh peer1.ece.departments.nitw.edu DepartmentsMSP` |
| **Mousumi** | Verifier 1      | `docker/docker-compose-verifiers-peer0.yaml` | `./recover-peer.sh peer0.verifiers.nitw.edu VerifiersMSP` |
| **Aakash**  | Verifier 2      | `docker/docker-compose-verifiers-peer1.yaml` | `./recover-peer.sh peer1.verifiers.nitw.edu VerifiersMSP` |

**Each person runs:**
```bash
# 1. Start the peer container
docker-compose -f docker/<your-compose-file>.yaml up -d

# 2. Recover/join channels
./recover-peer.sh <your-peer-name> <your-MSP>

# 3. Start the backend server
cd Academic-Records-Blockchain-Backend && npm start
```

---

### Step 4: Start Frontend (Aditi or any demo system)

```bash
cd Academic-Records-Blockchain-Frontend
npm run start -- --host 0.0.0.0
```

The frontend will be available at `http://<your-ip>:4200`

---

### Step 5: Deploy Chaincode (Only if code changed)

Only **Aditi** runs this:
```bash
cd Academic_RecordsBlockchain
./scripts/remote-upgrade-v4.sh
```

---

## Part 2 — Testing the Certificate Approval Pipeline

### Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| CSE HOD | `cse_hod` | `csehod123` |
| ECE HOD | `ece_hod` | `ecehod123` |
| Exam Section | `exam_section` | `exam123` |
| Dean Academic | `dean_academic` | `dean123` |
| Student | `<roll_number>` | `<roll_number>` (default) |

---

### Pipeline A: Bonafide / Transfer Certificate
**Route: Student → HOD → Dean → Admin**

#### Step 1 — Student submits request
1. Login as a student (e.g. `25CSM2R26`)
2. Go to **Profile → Certificates** tab
3. Click **"Request Certificate"**
4. Select **Bonafide Certificate**, enter purpose, submit

#### Step 2 — HOD approves
1. Login as `cse_hod` on **Shreya's system**
2. Go to **"Document Approvals"** tab
3. The student's Bonafide request should appear with status `pending`
4. Click **"Approve"**
5. ✅ Status changes to: `hod_approved`

#### Step 3 — Dean approves
1. Login as `dean_academic` on **Shyamashree's system**
2. Go to **"Certificate Approval"** tab
3. The request appears with status `hod_approved`
4. Click **"Approve"**
5. ✅ Status changes to: `dean_approved`

> [!NOTE]
> Bonafide and Transfer certificates **skip the Exam Section** entirely. They will NOT appear on Sejal's dashboard.

#### Step 4 — Admin issues
1. Login as `admin` on **Aditi's system**
2. Go to **"Document Approvals"** tab
3. The request appears with status `dean_approved`
4. Click **"Approve"**
5. ✅ Status changes to: `issued`

---

### Pipeline B: Degree / Marksheet Certificate
**Route: Student → HOD → Exam Section → Dean → Admin**

#### Step 1 — Student submits request
1. Login as a student
2. Request a **Semester Marksheet** or **Degree Certificate**

#### Step 2 — HOD approves
1. Login as `cse_hod` → Approve
2. ✅ Status: `pending` → `hod_approved`

#### Step 3 — Exam Section approves
1. Login as `exam_section` on **Sejal's system**
2. Go to **"Certificate Requests"** tab
3. Only Degree/Marksheet types appear here (Bonafide won't show)
4. Click **"Approve"**
5. ✅ Status: `hod_approved` → `exam_approved`

#### Step 4 — Dean approves
1. Login as `dean_academic` → Approve
2. ✅ Status: `exam_approved` → `dean_approved`

#### Step 5 — Admin issues
1. Login as `admin` → Approve
2. ✅ Status: `dean_approved` → `issued`

---

## Part 3 — Quick Health Checks

### Check if Backend is Running
```bash
curl http://localhost:3000/api/health
```
Expected: `{"status":"ok"}`

### Check All Certificates
```bash
# Login first
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")

# List all certificate requests
curl -s http://localhost:3000/api/certificates/requests \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

### Check Docker Containers
```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Access denied" | Run `export NODE_TLS_REJECT_UNAUTHORIZED='0'` |
| "Too many requests" | Restart the backend: kill the `npm start` process and re-run it |
| Peer not syncing | Re-run `./recover-peer.sh <peer-name> <MSP>` |
| Approve button fails | Check the backend terminal for error logs |
| Certificate not showing on dashboard | Refresh the page; check that the status matches what that dashboard polls for |

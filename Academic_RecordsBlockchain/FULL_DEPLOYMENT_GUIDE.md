# 🏗️ Full 12-System Distributed Deployment Guide

## System Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                    NIT WARANGAL BLOCKCHAIN NETWORK                    │
│                                                                      │
│  4 Organizations (MSPs) │ 12 Systems │ 1 Channel │ 1 Chaincode      │
└──────────────────────────────────────────────────────────────────────┘

┌─────────────────── ORDERER ORG (OrdererMSP) ────────────────────────┐
│  Machine 1 ─ orderer.nitw.edu:7050                                  │
│  ├── Orderer (Raft consensus, single node)                          │
│  ├── CA Orderer (:7054)                                             │
│  └── Admin API (:7053) — channel participation                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────── NITWARANGAL ORG (NITWarangalMSP) ────────────────────┐
│  Machine 2 ─ peer0.nitwarangal.nitw.edu:7051                       │
│  ├── Peer0 (Admin, ExamSection, Dean, AdminFinal approval)          │
│  ├── CA NITWarangal (:8054)                                         │
│  ├── CouchDB0 (:5984) — rich queries for state DB                  │
│  └── Backend API + Frontend (Nodes 04/05)                           │
│  Roles: admin, exam_section, dean_academic, student                 │
└─────────────────────────────────────────────────────────────────────┘

┌────────────── DEPARTMENTS ORG (DepartmentsMSP) ─────────────────────┐
│  Machine 3 ─ peer0.departments.nitw.edu:9051                       │
│  ├── Peer0 (CSE/ECE/ME Faculty + HOD + DAC approvals)               │
│  ├── CA Departments (:9054)                                         │
│  ├── CouchDB1 (:6984)                                              │
│  └── Backend API (dept frontend)                                    │
│  Roles: faculty, hod, dac_member                                    │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────── VERIFIERS ORG (VerifiersMSP) ───────────────────────┐
│  Machine 4 ─ peer0.verifiers.nitw.edu:11051                        │
│  ├── Peer0 (Certificate verification, credential checks)            │
│  ├── CA Verifiers (:11054)                                          │
│  ├── CouchDB2 (:7984)                                              │
│  └── Verification Portal                                            │
│  Roles: verifier, external_agency                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites (All 4 Machines)

Install these on **every** machine:

```bash
# Docker & Docker Compose
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER

# Go 1.19+
wget https://go.dev/dl/go1.21.6.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.21.6.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc

# Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Fabric Binaries (configtxgen, osnadmin, peer)
curl -sSLO https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh
chmod +x install-fabric.sh
./install-fabric.sh binary
# Move binaries to project's bin/ folder or add to PATH
```

---

## Step-by-Step Deployment

### PHASE 1: Configure IPs (Machine 1 — Orderer)

Edit `env.sh` with the actual IPs of your 4 machines:

```bash
# env.sh — set these to the real LAN IPs of each machine
export ORDERER_HOST="192.168.1.101"        # Machine 1
export NITWARANGAL_HOST="192.168.1.102"    # Machine 2
export DEPARTMENTS_HOST="192.168.1.103"    # Machine 3
export VERIFIERS_HOST="192.168.1.104"      # Machine 4
```

### PHASE 2: Generate Crypto Material (Machine 1 Only)

This runs on **Machine 1** only. It starts the CAs locally, enrolls all identities, generates the channel genesis block, and packages everything.

```bash
# On Machine 1
chmod +x generate-multihost-crypto.sh
./generate-multihost-crypto.sh
```

**What this does:**
1. Starts all 4 CAs via docker-compose
2. Runs `registerEnroll.sh` to create identities for all orgs
3. Generates connection profiles
4. Creates the channel genesis block (`configtxgen`)
5. Packages `organizations/` + `channel-artifacts/` into `multihost-crypto-bundle.tar.gz`

**Output:** `multihost-crypto-bundle.tar.gz` (~5MB)

### PHASE 3: Distribute Crypto Bundle (Machine 1 → All Others)

Copy the bundle + the entire project to all machines:

```bash
# On Machine 1 — copy to Machine 2, 3, 4
for IP in 192.168.1.102 192.168.1.103 192.168.1.104; do
    scp multihost-crypto-bundle.tar.gz $USER@${IP}:~/Academic_RecordsBlockchain/
done
```

On **each receiving machine** (2, 3, 4):
```bash
cd ~/Academic_RecordsBlockchain
tar -xzvf multihost-crypto-bundle.tar.gz
```

### PHASE 4: Setup /etc/hosts (All 4 Machines)

Run on **every** machine so containers can resolve each other:

```bash
# On ALL 4 machines (requires sudo)
sudo ./setup-hosts.sh
```

This adds entries like:
```
192.168.1.101    orderer.nitw.edu ca-orderer
192.168.1.102    peer0.nitwarangal.nitw.edu ca-nitwarangal
192.168.1.103    peer0.departments.nitw.edu ca-departments
192.168.1.104    peer0.verifiers.nitw.edu ca-verifiers
```

### PHASE 5: Start Docker Containers (Each Machine Runs Its Own)

**Machine 1 — Orderer:**
```bash
source env.sh
docker-compose -f docker/docker-compose-orderer.yaml up -d
```
Containers started: `orderer.nitw.edu`, `ca_orderer`

**Machine 2 — NITWarangal:**
```bash
source env.sh
docker-compose -f docker/docker-compose-nitwarangal.yaml up -d
```
Containers started: `peer0.nitwarangal.nitw.edu`, `ca_nitwarangal`, `couchdb0`

**Machine 3 — Departments:**
```bash
source env.sh
docker-compose -f docker/docker-compose-departments.yaml up -d
```
Containers started: `peer0.departments.nitw.edu`, `ca_departments`, `couchdb1`

**Machine 4 — Verifiers:**
```bash
source env.sh
docker-compose -f docker/docker-compose-verifiers.yaml up -d
```
Containers started: `peer0.verifiers.nitw.edu`, `ca_verifiers`, `couchdb2`

> **Wait 15 seconds** for all peers to finish starting.

### PHASE 6: Create Channel & Join Peers (Machine 1)

This runs from Machine 1 (which has the `osnadmin` tool and all crypto):

```bash
# Step 1: Join orderer to channel
osnadmin channel join \
    --channelID academic-records-channel \
    --config-block ./channel-artifacts/academic-records-channel.block \
    -o orderer.nitw.edu:7053 \
    --ca-file ./organizations/ordererOrganizations/nitw.edu/orderers/orderer.nitw.edu/tls/ca.crt \
    --client-cert ./organizations/ordererOrganizations/nitw.edu/orderers/orderer.nitw.edu/tls/server.crt \
    --client-key ./organizations/ordererOrganizations/nitw.edu/orderers/orderer.nitw.edu/tls/server.key

# Step 2: Join NITWarangal peer
CORE_PEER_LOCALMSPID=NITWarangalMSP \
CORE_PEER_ADDRESS=peer0.nitwarangal.nitw.edu:7051 \
CORE_PEER_TLS_ENABLED=true \
CORE_PEER_TLS_ROOTCERT_FILE=./organizations/peerOrganizations/nitwarangal.nitw.edu/peers/peer0.nitwarangal.nitw.edu/tls/ca.crt \
CORE_PEER_MSPCONFIGPATH=./organizations/peerOrganizations/nitwarangal.nitw.edu/users/Admin@nitwarangal.nitw.edu/msp \
peer channel join -b ./channel-artifacts/academic-records-channel.block

# Step 3: Join Departments peer
CORE_PEER_LOCALMSPID=DepartmentsMSP \
CORE_PEER_ADDRESS=peer0.departments.nitw.edu:9051 \
CORE_PEER_TLS_ENABLED=true \
CORE_PEER_TLS_ROOTCERT_FILE=./organizations/peerOrganizations/departments.nitw.edu/peers/peer0.departments.nitw.edu/tls/ca.crt \
CORE_PEER_MSPCONFIGPATH=./organizations/peerOrganizations/departments.nitw.edu/users/Admin@departments.nitw.edu/msp \
peer channel join -b ./channel-artifacts/academic-records-channel.block

# Step 4: Join Verifiers peer
CORE_PEER_LOCALMSPID=VerifiersMSP \
CORE_PEER_ADDRESS=peer0.verifiers.nitw.edu:11051 \
CORE_PEER_TLS_ENABLED=true \
CORE_PEER_TLS_ROOTCERT_FILE=./organizations/peerOrganizations/verifiers.nitw.edu/peers/peer0.verifiers.nitw.edu/tls/ca.crt \
CORE_PEER_MSPCONFIGPATH=./organizations/peerOrganizations/verifiers.nitw.edu/users/Admin@verifiers.nitw.edu/msp \
peer channel join -b ./channel-artifacts/academic-records-channel.block
```

**OR** use the automated scripts:
```bash
./network-multihost.sh up    # Does everything: start containers + create channel + deploy chaincode
```

### PHASE 7: Deploy Chaincode (Machine 1)

```bash
# Vendor Go dependencies
cd chaincode-go && GO111MODULE=on go mod vendor && cd ..

# Package
peer lifecycle chaincode package academic-records.tar.gz \
    --path ./chaincode-go --lang golang --label academic_records_2.0

# Install on all 3 org peers (repeat with different env vars)
# NITWarangal:
CORE_PEER_LOCALMSPID=NITWarangalMSP \
CORE_PEER_ADDRESS=peer0.nitwarangal.nitw.edu:7051 \
CORE_PEER_TLS_ROOTCERT_FILE=./organizations/peerOrganizations/nitwarangal.nitw.edu/peers/peer0.nitwarangal.nitw.edu/tls/ca.crt \
CORE_PEER_MSPCONFIGPATH=./organizations/peerOrganizations/nitwarangal.nitw.edu/users/Admin@nitwarangal.nitw.edu/msp \
peer lifecycle chaincode install academic-records.tar.gz

# Departments:
CORE_PEER_LOCALMSPID=DepartmentsMSP \
CORE_PEER_ADDRESS=peer0.departments.nitw.edu:9051 \
CORE_PEER_TLS_ROOTCERT_FILE=./organizations/peerOrganizations/departments.nitw.edu/peers/peer0.departments.nitw.edu/tls/ca.crt \
CORE_PEER_MSPCONFIGPATH=./organizations/peerOrganizations/departments.nitw.edu/users/Admin@departments.nitw.edu/msp \
peer lifecycle chaincode install academic-records.tar.gz

# Verifiers:
CORE_PEER_LOCALMSPID=VerifiersMSP \
CORE_PEER_ADDRESS=peer0.verifiers.nitw.edu:11051 \
CORE_PEER_TLS_ROOTCERT_FILE=./organizations/peerOrganizations/verifiers.nitw.edu/peers/peer0.verifiers.nitw.edu/tls/ca.crt \
CORE_PEER_MSPCONFIGPATH=./organizations/peerOrganizations/verifiers.nitw.edu/users/Admin@verifiers.nitw.edu/msp \
peer lifecycle chaincode install academic-records.tar.gz

# Get Package ID
PACKAGE_ID=$(peer lifecycle chaincode queryinstalled | grep academic_records_2.0 | sed -n 's/Package ID: \(.*\), Label:.*/\1/p')

# Approve for each org (repeat for all 3)
peer lifecycle chaincode approveformyorg -o orderer.nitw.edu:7050 \
    --tls --cafile ./organizations/ordererOrganizations/nitw.edu/orderers/orderer.nitw.edu/tls/ca.crt \
    --channelID academic-records-channel --name academic-records \
    --version 2.0 --package-id "$PACKAGE_ID" --sequence 1 \
    --signature-policy "OR('NITWarangalMSP.peer','DepartmentsMSP.peer','VerifiersMSP.peer')" \
    --collections-config ./collections_config.json

# Commit (requires endorsement from all 3 orgs)
peer lifecycle chaincode commit -o orderer.nitw.edu:7050 \
    --tls --cafile ./organizations/ordererOrganizations/nitw.edu/orderers/orderer.nitw.edu/tls/ca.crt \
    --channelID academic-records-channel --name academic-records \
    --version 2.0 --sequence 1 \
    --peerAddresses peer0.nitwarangal.nitw.edu:7051 \
    --tlsRootCertFiles ./organizations/peerOrganizations/nitwarangal.nitw.edu/peers/peer0.nitwarangal.nitw.edu/tls/ca.crt \
    --peerAddresses peer0.departments.nitw.edu:9051 \
    --tlsRootCertFiles ./organizations/peerOrganizations/departments.nitw.edu/peers/peer0.departments.nitw.edu/tls/ca.crt \
    --peerAddresses peer0.verifiers.nitw.edu:11051 \
    --tlsRootCertFiles ./organizations/peerOrganizations/verifiers.nitw.edu/peers/peer0.verifiers.nitw.edu/tls/ca.crt
```

### PHASE 8: Start Backend API (Machines 2, 3, 4)

**Machine 2 — NITWarangal Backend (Admin + Student Portal):**
```bash
cd Academic-Records-Blockchain-Backend
cp .env.example .env
# Edit .env:
#   PORT=3001
#   CHANNEL_NAME=academic-records-channel
#   CHAINCODE_NAME=academic-records
#   PEER_ENDPOINT=peer0.nitwarangal.nitw.edu:7051
#   MSP_ID=NITWarangalMSP
#   GATEWAY_DISCOVERY_AS_LOCALHOST=false
#   PINATA_API_KEY=<your-pinata-key>
#   PINATA_SECRET_API_KEY=<your-pinata-secret>
npm install
node src/enrollAdmin.js    # Enroll admin identity into wallet
npm run dev
```

**Machine 3 — Departments Backend:**
```bash
cd Academic-Records-Blockchain-Backend
cp .env.cse .env   # or .env.ece, .env.me, .env.dac
# Edit .env:
#   PEER_ENDPOINT=peer0.departments.nitw.edu:9051
#   MSP_ID=DepartmentsMSP
#   GATEWAY_DISCOVERY_AS_LOCALHOST=false
npm install
node src/enrollAdmin.js
npm run dev
```

**Machine 4 — Verifiers Backend:**
```bash
cd Academic-Records-Blockchain-Backend
cp .env.verifiers .env
# Edit .env:
#   PEER_ENDPOINT=peer0.verifiers.nitw.edu:11051
#   MSP_ID=VerifiersMSP
#   GATEWAY_DISCOVERY_AS_LOCALHOST=false
npm install
node src/enrollAdmin.js
npm run dev
```

### PHASE 9: Start Frontend (Machine 2)

```bash
cd Academic-Records-Blockchain-Frontend
npm install
ng serve --host 0.0.0.0 --port 4200
```

Access at: `http://<Machine-2-IP>:4200`

---

## Port Map Summary

| Machine | Service | Port | Purpose |
|---------|---------|------|---------|
| 1 | Orderer | 7050 | Transaction ordering |
| 1 | Orderer Admin | 7053 | Channel management |
| 1 | CA Orderer | 7054 | Orderer identities |
| 2 | Peer0 NITWarangal | 7051 | Endorsing + Committing |
| 2 | CA NITWarangal | 8054 | Admin/Student identities |
| 2 | CouchDB0 | 5984 | State DB (rich queries) |
| 2 | Backend API | 3001 | REST API |
| 2 | Frontend | 4200 | Angular UI |
| 3 | Peer0 Departments | 9051 | Endorsing + Committing |
| 3 | CA Departments | 9054 | Faculty/HOD/DAC identities |
| 3 | CouchDB1 | 6984 | State DB |
| 3 | Backend API | 3001 | Dept REST API |
| 4 | Peer0 Verifiers | 11051 | Endorsing + Committing |
| 4 | CA Verifiers | 11054 | Verifier identities |
| 4 | CouchDB2 | 7984 | State DB |
| 4 | Backend API | 3001 | Verifier REST API |

---

## What Each Machine Becomes

### Machine 1 — The Orderer (Transaction Sequencer)
- **Role:** Receives endorsed transactions, orders them into blocks, distributes to peers
- **Does NOT:** Run chaincode, store state DB, or serve APIs
- **Critical for:** Network liveness (if orderer dies, no new transactions can be committed)

### Machine 2 — The Administration Hub
- **Role:** The university admin peers. Handles Admin Final Approval (the last step), Exam Section locking, Dean Academic approval, student portal
- **Chaincode ops:** `AdminFinalApprove()`, `ExamSectionApprove()`, `DeanAcademicApprove()`, CGPA calculation, automated certificate revocation
- **IPFS:** Uploads certificates to Pinata, generates PDFs, serves download URLs
- **Org:** `NITWarangalMSP` — highest authority

### Machine 3 — The Academic Departments
- **Role:** Faculty submit records, HODs approve, DAC committee provides multi-signature quorum approval
- **Chaincode ops:** `CreateAcademicRecord()` (with duplicate detection), `SubmitForApproval()`, `FacultyApprove()`, `HODApprove()`, `DACApprove()` (2-of-3 multi-sig)
- **Org:** `DepartmentsMSP` — CSE/ECE/ME/DAC all share this MSP

### Machine 4 — The External Verifier
- **Role:** Third-party organizations (employers, universities) verify certificates
- **Chaincode ops:** `VerifyCertificate()`, `VerifyCertificateByHash()`, `LogVerification()`
- **Org:** `VerifiersMSP` — can only read/verify, cannot approve or create records

---

## Automated One-Command Deployment

If all machines are reachable via SSH from Machine 1:

```bash
# On Machine 1 — brings up the entire network
./network-multihost.sh up

# Check status across all machines
./network-multihost.sh status

# Stop everything
./network-multihost.sh down
```

---

## Transaction Flow Across Machines

```
Student (Machine 2) → submits marks
  → Faculty (Machine 3) approves
    → HOD (Machine 3) approves
      → DAC Member 1 (Machine 3) signs
      → DAC Member 2 (Machine 3) signs ← Quorum (2/3) reached!
        → ExamSection (Machine 2) locks
          → Dean (Machine 2) approves
            → Admin (Machine 2) final approve
              → CGPA calculated, record ADMIN_FINALIZED
              → If CGPA < 5.0 → auto-revoke certificates

Verifier (Machine 4) → uploads PDF → gets Valid/Revoked/Fake result
```

Every transaction is:
1. Endorsed by the submitting peer
2. Sent to the orderer (Machine 1) for sequencing
3. Distributed as a block to ALL peers (Machines 2, 3, 4)
4. Each peer independently validates and commits to its local ledger + CouchDB

---

## Scripts Reference

| Script | Run On | Purpose |
|--------|--------|---------|
| `generate-multihost-crypto.sh` | Machine 1 | Generate all crypto + genesis block |
| `setup-hosts.sh` | ALL machines | Add `/etc/hosts` entries |
| `network-multihost.sh up` | Machine 1 | Start entire network via SSH |
| `network-multihost.sh down` | Machine 1 | Stop entire network |
| `join-channel-multihost.sh` | Machine 1 (CLI) | Channel join + chaincode deploy via CLI container |
| `generate-connection-profiles.sh` | Machine 1 | Generate connection profiles for backend |
| `distribute-crypto.sh` | Machine 1 | SCP crypto to other machines |

## Docker Compose Files Reference

| File | Run On | Services |
|------|--------|----------|
| `docker-compose-orderer.yaml` | Machine 1 | orderer + ca_orderer |
| `docker-compose-nitwarangal.yaml` | Machine 2 | peer0 + ca_nitwarangal + couchdb0 |
| `docker-compose-departments.yaml` | Machine 3 | peer0 + ca_departments + couchdb1 |
| `docker-compose-verifiers.yaml` | Machine 4 | peer0 + ca_verifiers + couchdb2 |

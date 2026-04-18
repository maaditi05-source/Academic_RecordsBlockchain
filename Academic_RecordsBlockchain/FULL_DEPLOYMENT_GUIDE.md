# 🏗️ Full 13-System Distributed Deployment Guide

> **Complete deployment guide for the NIT Warangal Academic Records Blockchain across 13 separate physical machines.**

---

## System Architecture: The 13-Machine Map

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                     NIT WARANGAL BLOCKCHAIN NETWORK                          │
│            4 Organizations (MSPs)  ·  13 Machines  ·  1 Channel             │
└──────────────────────────────────────────────────────────────────────────────┘

╔══════════════════════ ORDERER ORG (OrdererMSP) ═══════════════════════════╗
║                                                                           ║
║  System 01 ┃ orderer1.nitw.edu:7050                                       ║
║            ┃ Raft PRIMARY + CA Orderer (:7054) + Admin API (:7053)         ║
║            ┃ Docker: docker compose-orderer1.yaml                         ║
║                                                                           ║
║  System 02 ┃ orderer2.nitw.edu:8050                                       ║
║            ┃ Raft FOLLOWER                                                ║
║            ┃ Docker: docker compose-orderer2.yaml                         ║
║                                                                           ║
║  System 03 ┃ orderer3.nitw.edu:9050                                       ║
║            ┃ Raft FOLLOWER                                                ║
║            ┃ Docker: docker compose-orderer3.yaml                         ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝

╔════════════════ NITWARANGAL ORG (NITWarangalMSP) ═════════════════════════╗
║                                                                           ║
║  System 04 ┃ peer0.nitwarangal.nitw.edu:7051  (ANCHOR PEER)              ║
║            ┃ University Admin — AdminFinalApprove, AdminRevokeRecord      ║
║            ┃ CA NITWarangal (:8054) + CouchDB (:5984)                    ║
║            ┃ Docker: docker compose-nitwarangal-peer0.yaml                ║
║                                                                           ║
║  System 05 ┃ peer1.nitwarangal.nitw.edu:7151                             ║
║            ┃ Exam Section — ExamSectionApprove, grade locking             ║
║            ┃ CouchDB (:5985)                                             ║
║            ┃ Docker: docker compose-nitwarangal-peer1.yaml                ║
║                                                                           ║
║  System 06 ┃ peer2.nitwarangal.nitw.edu:7251                             ║
║            ┃ Dean Academic — DeanAcademicApprove                          ║
║            ┃ CouchDB (:5986)                                             ║
║            ┃ Docker: docker compose-nitwarangal-peer2.yaml                ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝

╔════════════════ DEPARTMENTS ORG (DepartmentsMSP) ═════════════════════════╗
║                                                                           ║
║  System 07 ┃ peer0.cse.departments.nitw.edu:9051  (ANCHOR PEER)          ║
║            ┃ CSE HOD — HODApprove                                         ║
║            ┃ CA Departments (:9054) + CouchDB (:5987)                    ║
║            ┃ Docker: docker compose-depts-cse.yaml                        ║
║                                                                           ║
║  System 08 ┃ peer1.cse.departments.nitw.edu:9151                         ║
║            ┃ CSE Faculty Advisor — CreateAcademicRecord, FacultyApprove   ║
║            ┃ CouchDB (:5988)                                             ║
║            ┃ Docker: docker compose-depts-cse-faculty.yaml                ║
║                                                                           ║
║  System 09 ┃ peer0.ece.departments.nitw.edu:9251                         ║
║            ┃ ECE HOD — HODApprove                                         ║
║            ┃ CouchDB (:5989)                                             ║
║            ┃ Docker: docker compose-depts-ece.yaml                        ║
║                                                                           ║
║  System 10 ┃ peer1.ece.departments.nitw.edu:9351                         ║
║            ┃ ECE Faculty Advisor — CreateAcademicRecord, FacultyApprove   ║
║            ┃ CouchDB (:5990)                                             ║
║            ┃ Docker: docker compose-depts-ece-faculty.yaml                ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝

╔═════════════════ VERIFIERS ORG (VerifiersMSP) ════════════════════════════╗
║                                                                           ║
║  System 11 ┃ peer0.verifiers.nitw.edu:11051  (ANCHOR PEER)               ║
║            ┃ Primary Verifier — VerifyCertificateByHash                   ║
║            ┃ CA Verifiers (:11054) + CouchDB (:5991)                     ║
║            ┃ Docker: docker compose-verifiers-peer0.yaml                  ║
║                                                                           ║
║  System 12 ┃ peer1.verifiers.nitw.edu:11151                              ║
║            ┃ Secondary Verifier (HA)                                      ║
║            ┃ CouchDB (:5992)                                             ║
║            ┃ Docker: docker compose-verifiers-peer1.yaml                  ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝

╔═════════════════── STUDENT PORTAL (SDK-only) ═════════════════════════════╗
║                                                                           ║
║  System 13 ┃ No Fabric peer — SDK-only client node                       ║
║            ┃ Runs: Backend API + Angular Frontend                         ║
║            ┃ Connects to peer0.nitwarangal via Gateway SDK                ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

---

## Complete Port Map

| System | Hostname | Peer Port | CA Port | CouchDB Port | Chaincode Port |
|--------|----------|-----------|---------|--------------|----------------|
| 01 | orderer1.nitw.edu | 7050 | 7054 | — | — |
| 02 | orderer2.nitw.edu | 8050 | — | — | — |
| 03 | orderer3.nitw.edu | 9050 | — | — | — |
| 04 | peer0.nitwarangal.nitw.edu | 7051 | 8054 | 5984 | 7052 |
| 05 | peer1.nitwarangal.nitw.edu | 7151 | — | 5985 | 7152 |
| 06 | peer2.nitwarangal.nitw.edu | 7251 | — | 5986 | 7252 |
| 07 | peer0.cse.departments.nitw.edu | 9051 | 9054 | 5987 | 9052 |
| 08 | peer1.cse.departments.nitw.edu | 9151 | — | 5988 | 9152 |
| 09 | peer0.ece.departments.nitw.edu | 9251 | — | 5989 | 9252 |
| 10 | peer1.ece.departments.nitw.edu | 9351 | — | 5990 | 9352 |
| 11 | peer0.verifiers.nitw.edu | 11051 | 11054 | 5991 | 11052 |
| 12 | peer1.verifiers.nitw.edu | 11151 | — | 5992 | 11152 |
| 13 | student-portal | — | — | — | — |

---

## PHASE 1: Configure All 13 IPs

On **System 01**, edit `env.sh`:

```bash
# ORDERER CLUSTER
export ORDERER1_HOST="172.20.233.222"    # System 01
export ORDERER2_HOST="172.20.242.77"     # System 02
export ORDERER3_HOST="172.20.241.65"     # System 03

# NITWARANGAL PEERS
export NITW_PEER0_HOST="172.20.229.166"  # System 04 — Admin
export NITW_PEER1_HOST="172.20.238.52"   # System 05 — Exam Section
export NITW_PEER2_HOST="172.20.255.20"   # System 06 — Dean

# DEPARTMENT PEERS
export DEPT_CSE_HOD_HOST="172.20.247.9"  # System 07 — CSE HOD
export DEPT_CSE_FAC_HOST="172.20.252.32" # System 08 — CSE Faculty
export DEPT_ECE_HOD_HOST="172.20.244.81" # System 09 — ECE HOD
export DEPT_ECE_FAC_HOST="172.20.235.77" # System 10 — ECE Faculty

# VERIFIER PEERS
export VERI_PEER0_HOST="172.20.254.157"  # System 11 — Primary
export VERI_PEER1_HOST="172.20.252.188"  # System 12 — Secondary
```

---

## PHASE 2: Generate Crypto Material (System 01 Only)

```bash
chmod +x generate-multihost-crypto.sh scripts/registerEnroll.sh generate-connection-profiles.sh scripts/utils.sh
./generate-multihost-crypto.sh
```

---

## PHASE 3: Distribute to All Systems

Transfer `multihost-crypto-bundle.tar.gz` from System 01 to all other systems via SCP or USB.

On each receiving system:
```bash
cd ~/Academic_RecordsBlockchain
tar -xzvf multihost-crypto-bundle.tar.gz
source env.sh
```

---

## PHASE 4: Setup /etc/hosts (All 12 Systems)

```bash
sudo bash -c 'cat >> /etc/hosts << EOF
# === Academic Records Blockchain Network ===
172.20.233.222  orderer1.nitw.edu
172.20.242.77   orderer2.nitw.edu
172.20.241.65   orderer3.nitw.edu
172.20.229.166  peer0.nitwarangal.nitw.edu ca-nitwarangal
172.20.238.52   peer1.nitwarangal.nitw.edu
172.20.255.20   peer2.nitwarangal.nitw.edu
172.20.247.9    peer0.cse.departments.nitw.edu ca-departments
172.20.252.32   peer1.cse.departments.nitw.edu
172.20.244.81   peer0.ece.departments.nitw.edu
172.20.235.77   peer1.ece.departments.nitw.edu
172.20.254.157  peer0.verifiers.nitw.edu ca-verifiers
172.20.252.188  peer1.verifiers.nitw.edu
# === END ===
EOF'
```

---

## PHASE 5: Start Docker Containers (Each System Runs Its Own File)

### Step 1: Orderers (Systems 01, 02, 03)

```bash
# System 01
docker compose -f docker/docker compose-orderer1.yaml up -d
# System 02
docker compose -f docker/docker compose-orderer2.yaml up -d
# System 03
docker compose -f docker/docker compose-orderer3.yaml up -d
```

> ⏳ Wait 10 seconds for Raft leader election.

### Step 2: NITWarangal Peers (Systems 04, 05, 06)

```bash
# System 04 — Admin (Anchor Peer + CA)
docker compose -f docker/docker compose-nitwarangal-peer0.yaml up -d
# System 05 — Exam Section
docker compose -f docker/docker compose-nitwarangal-peer1.yaml up -d
# System 06 — Dean Academic
docker compose -f docker/docker compose-nitwarangal-peer2.yaml up -d
```

### Step 3: Department Peers (Systems 07, 08, 09, 10)

```bash
# System 07 — CSE HOD (Anchor Peer + CA)
docker compose -f docker/docker compose-depts-cse.yaml up -d
# System 08 — CSE Faculty Advisor
docker compose -f docker/docker compose-depts-cse-faculty.yaml up -d
# System 09 — ECE HOD
docker compose -f docker/docker compose-depts-ece.yaml up -d
# System 10 — ECE Faculty Advisor
docker compose -f docker/docker compose-depts-ece-faculty.yaml up -d
```

### Step 4: Verifier Peers (Systems 11, 12)

```bash
# System 11 — Primary Verifier (Anchor Peer + CA)
docker compose -f docker/docker compose-verifiers-peer0.yaml up -d
# System 12 — Secondary Verifier
docker compose -f docker/docker compose-verifiers-peer1.yaml up -d
```

> ⏳ Wait 15 seconds for gossip discovery.

---

## PHASE 6: Create Channel & Join All Peers (System 01)

```bash
./join-channel-multihost.sh
```

Or manually join each of the 9 peers (3 NITW + 4 Dept + 2 Verifier) to the channel from System 01.

---

## PHASE 7: Deploy Chaincode (System 01)

Package, install on all 9 peers, approve for 3 orgs, commit. See `join-channel-multihost.sh` for the full commands.

---

## PHASE 8: Start Backend API

| System | .env Config |
|--------|-------------|
| 04 (Admin) | `MSP_ID=NITWarangalMSP`, `PEER_ENDPOINT=peer0.nitwarangal:7051` |
| 05 (ExamSection) | `MSP_ID=NITWarangalMSP`, `PEER_ENDPOINT=peer1.nitwarangal:7151` |
| 06 (Dean) | `MSP_ID=NITWarangalMSP`, `PEER_ENDPOINT=peer2.nitwarangal:7251` |
| 07 (CSE HOD) | `MSP_ID=DepartmentsMSP`, `PEER_ENDPOINT=peer0.cse.departments:9051` |
| 08 (CSE Faculty) | `MSP_ID=DepartmentsMSP`, `PEER_ENDPOINT=peer1.cse.departments:9151` |
| 09 (ECE HOD) | `MSP_ID=DepartmentsMSP`, `PEER_ENDPOINT=peer0.ece.departments:9251` |
| 10 (ECE Faculty) | `MSP_ID=DepartmentsMSP`, `PEER_ENDPOINT=peer1.ece.departments:9351` |
| 11 (Verifier) | `MSP_ID=VerifiersMSP`, `PEER_ENDPOINT=peer0.verifiers:11051` |
| 13 (Student) | `MSP_ID=NITWarangalMSP`, `PEER_ENDPOINT=peer0.nitwarangal:7051` |

All backends: `GATEWAY_DISCOVERY_AS_LOCALHOST=false`

```bash
npm install && node src/enrollAdmin.js && npm run dev
```

---

## What Each System Becomes

| System | Role | Who Uses It |
|--------|------|-------------|
| **01-03** | **Raft Orderer Cluster** — sequences transactions, distributes blocks. Tolerates 1 failure. | Infrastructure |
| **04** | **Admin Peer** — AdminFinalApprove (last approval), AdminRevokeRecord (revoke anything), certificate issuance, IPFS upload, CGPA calculation | University Admin |
| **05** | **Exam Section Peer** — ExamSectionApprove, grade locking | Exam Section Staff |
| **06** | **Dean Peer** — DeanAcademicApprove | Dean Academic |
| **07** | **CSE HOD Peer** — HODApprove for CSE records. Anchor peer for DepartmentsMSP. Runs Dept CA. | CSE HOD |
| **08** | **CSE Faculty Peer** — CreateAcademicRecord (with duplicate detection), FacultyApprove | CSE Faculty |
| **09** | **ECE HOD Peer** — HODApprove for ECE records | ECE HOD |
| **10** | **ECE Faculty Peer** — CreateAcademicRecord, FacultyApprove | ECE Faculty |
| **11** | **Primary Verifier** — VerifyCertificateByHash (PDF → SHA-256 → ledger check) | Employers, HR |
| **12** | **Secondary Verifier** — HA backup for System 11 | Same |
| **13** | **Student Portal** — SDK client, read-only. View records, download certs from IPFS | Students |

---

## Approval Pipeline (Unchanged)

```
CSE/ECE Faculty (Sys 08/10)  →  CreateAcademicRecord + FacultyApprove
        ↓
CSE/ECE HOD (Sys 07/09)     →  HODApprove
        ↓
DAC Committee (via HOD peers) →  DACApprove (2-of-3 multi-sig quorum)
        ↓
Exam Section (Sys 05)        →  ExamSectionApprove (grade lock)
        ↓
Dean Academic (Sys 06)       →  DeanAcademicApprove
        ↓
Admin (Sys 04)               →  AdminFinalApprove (CGPA calc, auto-revocation if CGPA < 5.0)
```

## Admin Revocation (NEW)

Admin (System 04) can revoke **any** record at **any** status via `AdminRevokeRecord()`:
- Sets record status to `REVOKED` regardless of current status
- Cascading: automatically revokes ALL certificates linked to the student
- Emits `AdminRecordRevoked` event with full audit trail
- Existing `RevokeCertificate()` (certificate-only revoke) still works independently

---

## Docker Compose Files Reference

| File | System | Services |
|------|--------|----------|
| `docker compose-orderer1.yaml` | 01 | orderer1 + ca_orderer |
| `docker compose-orderer2.yaml` | 02 | orderer2 |
| `docker compose-orderer3.yaml` | 03 | orderer3 |
| `docker compose-nitwarangal-peer0.yaml` | 04 | peer0 + ca_nitwarangal + couchdb |
| `docker compose-nitwarangal-peer1.yaml` | 05 | peer1 + couchdb |
| `docker compose-nitwarangal-peer2.yaml` | 06 | peer2 + couchdb |
| `docker compose-depts-cse.yaml` | 07 | peer0.cse + ca_departments + couchdb |
| `docker compose-depts-cse-faculty.yaml` | 08 | peer1.cse + couchdb |
| `docker compose-depts-ece.yaml` | 09 | peer0.ece + couchdb |
| `docker compose-depts-ece-faculty.yaml` | 10 | peer1.ece + couchdb |
| `docker compose-verifiers-peer0.yaml` | 11 | peer0 + ca_verifiers + couchdb |
| `docker compose-verifiers-peer1.yaml` | 12 | peer1 + couchdb |

---

## Gossip Topology

```
Anchor Peers (cross-org discovery):
  ├── peer0.nitwarangal (Sys 04)  — for NITWarangalMSP
  ├── peer0.cse.departments (Sys 07) — for DepartmentsMSP
  └── peer0.verifiers (Sys 11)   — for VerifiersMSP

Intra-org gossip:
  Sys 04 ←→ 05 ←→ 06            (NITWarangal peers)
  Sys 07 ←→ 08 ←→ 09 ←→ 10     (Department peers)
  Sys 11 ←→ 12                  (Verifier peers)
```

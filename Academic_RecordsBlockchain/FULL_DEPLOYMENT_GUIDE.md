# 🏗️ Full 12-System Distributed Deployment Guide

> **This guide covers the deployment of the complete NIT Warangal Academic Records Blockchain across 12 separate physical machines.**

---

## System Architecture: The 12-Machine Map

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                     NIT WARANGAL BLOCKCHAIN NETWORK                          │
│            4 Organizations (MSPs)  ·  12 Machines  ·  1 Channel             │
└──────────────────────────────────────────────────────────────────────────────┘

╔══════════════════════ ORDERER ORG (OrdererMSP) ═══════════════════════════╗
║                                                                           ║
║  System 01 ┃ orderer1.nitw.edu:7050                                       ║
║            ┃ Raft PRIMARY + CA Orderer (:7054) + Admin API (:7053)         ║
║            ┃ Docker: docker-compose-orderer1.yaml                         ║
║                                                                           ║
║  System 02 ┃ orderer2.nitw.edu:8050                                       ║
║            ┃ Raft FOLLOWER                                                ║
║            ┃ Docker: docker-compose-orderer2.yaml                         ║
║                                                                           ║
║  System 03 ┃ orderer3.nitw.edu:9050                                       ║
║            ┃ Raft FOLLOWER                                                ║
║            ┃ Docker: docker-compose-orderer3.yaml                         ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝

╔════════════════ NITWARANGAL ORG (NITWarangalMSP) ═════════════════════════╗
║                                                                           ║
║  System 04 ┃ peer0.nitwarangal.nitw.edu:7051  (ANCHOR PEER)              ║
║            ┃ Admin + ExamSection + Dean + AdminFinal approvals            ║
║            ┃ CA NITWarangal (:8054) + CouchDB (:5984)                    ║
║            ┃ Docker: docker-compose-nitwarangal-peer0.yaml                ║
║                                                                           ║
║  System 05 ┃ peer1.nitwarangal.nitw.edu:7151                             ║
║            ┃ Student Portal Backend — read-only + cert requests           ║
║            ┃ CouchDB (:5985)                                             ║
║            ┃ Docker: docker-compose-nitwarangal-peer1.yaml                ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝

╔════════════════ DEPARTMENTS ORG (DepartmentsMSP) ═════════════════════════╗
║                                                                           ║
║  System 06 ┃ peer0.cse.departments.nitw.edu:9051  (ANCHOR PEER)          ║
║            ┃ CSE Faculty + HOD approvals                                  ║
║            ┃ CA Departments (:9054) + CouchDB (:5986)                    ║
║            ┃ Docker: docker-compose-depts-cse.yaml                        ║
║                                                                           ║
║  System 07 ┃ peer0.ece.departments.nitw.edu:9151                         ║
║            ┃ ECE Faculty + HOD approvals                                  ║
║            ┃ CouchDB (:5987)                                             ║
║            ┃ Docker: docker-compose-depts-ece.yaml                        ║
║                                                                           ║
║  System 08 ┃ peer0.me.departments.nitw.edu:9251                          ║
║            ┃ ME Faculty + HOD approvals                                   ║
║            ┃ CouchDB (:5988)                                             ║
║            ┃ Docker: docker-compose-depts-me.yaml                         ║
║                                                                           ║
║  System 09 ┃ peer0.dac.departments.nitw.edu:9351                         ║
║            ┃ DAC Committee — Multi-Sig quorum (2-of-3)                    ║
║            ┃ CouchDB (:5989)                                             ║
║            ┃ Docker: docker-compose-depts-dac.yaml                        ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝

╔═════════════════ VERIFIERS ORG (VerifiersMSP) ════════════════════════════╗
║                                                                           ║
║  System 10 ┃ peer0.verifiers.nitw.edu:11051  (ANCHOR PEER)               ║
║            ┃ Primary External Verifier                                    ║
║            ┃ CA Verifiers (:11054) + CouchDB (:7984)                     ║
║            ┃ Docker: docker-compose-verifiers-peer0.yaml                  ║
║                                                                           ║
║  System 11 ┃ peer1.verifiers.nitw.edu:11151                              ║
║            ┃ Secondary Verifier (HA)                                      ║
║            ┃ CouchDB (:7985)                                             ║
║            ┃ Docker: docker-compose-verifiers-peer1.yaml                  ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝

╔═════════════════── STUDENT PORTAL (SDK-only) ═════════════════════════════╗
║                                                                           ║
║  System 12 ┃ No Fabric peer — SDK-only client node                       ║
║            ┃ Runs: Backend API + Angular Frontend                         ║
║            ┃ Connects to peer0.nitwarangal via Gateway SDK                ║
║            ┃ No Docker Compose needed for Fabric                          ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

---

## Complete Port Map

| System | Hostname | Peer Port | Admin/CA Port | CouchDB Port | Chaincode Port |
|--------|----------|-----------|---------------|--------------|----------------|
| 01 | orderer1.nitw.edu | 7050 | CA: 7054, Admin: 7053 | — | — |
| 02 | orderer2.nitw.edu | 8050 | Admin: 8053 | — | — |
| 03 | orderer3.nitw.edu | 9050 | Admin: 9053 | — | — |
| 04 | peer0.nitwarangal.nitw.edu | 7051 | CA: 8054 | 5984 | 7052 |
| 05 | peer1.nitwarangal.nitw.edu | 7151 | — | 5985 | 7152 |
| 06 | peer0.cse.departments.nitw.edu | 9051 | CA: 9054 | 5986 | 9052 |
| 07 | peer0.ece.departments.nitw.edu | 9151 | — | 5987 | 9152 |
| 08 | peer0.me.departments.nitw.edu | 9251 | — | 5988 | 9252 |
| 09 | peer0.dac.departments.nitw.edu | 9351 | — | 5989 | 9352 |
| 10 | peer0.verifiers.nitw.edu | 11051 | CA: 11054 | 7984 | 11052 |
| 11 | peer1.verifiers.nitw.edu | 11151 | — | 7985 | 11152 |
| 12 | student-portal | — | — | — | — |

---

## Prerequisites (All 12 Machines)

Install on **every** machine:

```bash
# Docker & Docker Compose
sudo apt-get update && sudo apt-get install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER && newgrp docker

# Go 1.21 (for chaincode)
wget https://go.dev/dl/go1.21.6.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.21.6.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc && source ~/.bashrc

# Node.js 18+ (for backend)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Hyperledger Fabric binaries (Systems 01-11)
curl -sSLO https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh
chmod +x install-fabric.sh && ./install-fabric.sh binary
export PATH=$PWD/bin:$PATH
```

---

## PHASE 1: Configure All 12 IPs

On **System 01**, edit `env.sh` with the real LAN IPs of all 12 machines:

```bash
# ═══════ env.sh ═══════
# ORDERER CLUSTER
export ORDERER1_HOST="192.168.1.101"     # System 01
export ORDERER2_HOST="192.168.1.102"     # System 02
export ORDERER3_HOST="192.168.1.103"     # System 03

# NITWARANGAL PEERS
export NITW_PEER0_HOST="192.168.1.104"   # System 04
export NITW_PEER1_HOST="192.168.1.105"   # System 05

# DEPARTMENT PEERS
export DEPT_CSE_HOST="192.168.1.106"     # System 06
export DEPT_ECE_HOST="192.168.1.107"     # System 07
export DEPT_ME_HOST="192.168.1.108"      # System 08
export DEPT_DAC_HOST="192.168.1.109"     # System 09

# VERIFIER PEERS
export VERI_PEER0_HOST="192.168.1.110"   # System 10
export VERI_PEER1_HOST="192.168.1.111"   # System 11

# STUDENT PORTAL
export STUDENT_PORTAL_HOST="192.168.1.112"  # System 12
```

---

## PHASE 2: Generate Crypto Material (System 01 Only)

Run on **System 01** only. This generates identities for all 4 organizations:

```bash
chmod +x generate-multihost-crypto.sh
./generate-multihost-crypto.sh
```

**What happens:**
1. Starts all 4 CAs via `docker-compose-net.yaml`
2. Runs `registerEnroll.sh` → creates crypto for all peers, orderers, and users
3. Generates connection profiles for each org
4. Runs `configtxgen` → creates the channel genesis block
5. Packages everything into `multihost-crypto-bundle.tar.gz`

---

## PHASE 3: Distribute to All 12 Systems

Copy the project + crypto bundle from System 01 to all other systems:

```bash
# On System 01
SYSTEMS=(
    "192.168.1.102" "192.168.1.103"
    "192.168.1.104" "192.168.1.105"
    "192.168.1.106" "192.168.1.107" "192.168.1.108" "192.168.1.109"
    "192.168.1.110" "192.168.1.111"
    "192.168.1.112"
)

for IP in "${SYSTEMS[@]}"; do
    echo "📦 Distributing to $IP..."
    scp -r ~/Academic_RecordsBlockchain $USER@${IP}:~/
done
```

On **each receiving system** (02-12), extract the crypto:
```bash
cd ~/Academic_RecordsBlockchain
tar -xzvf multihost-crypto-bundle.tar.gz
source env.sh
```

---

## PHASE 4: Setup /etc/hosts (All 12 Systems)

Run on **every single system** so Docker containers can resolve all hostnames:

```bash
# On ALL 12 systems (requires sudo)
sudo bash -c 'cat >> /etc/hosts << EOF
# === Academic Records Blockchain Network ===
192.168.1.101  orderer1.nitw.edu
192.168.1.102  orderer2.nitw.edu
192.168.1.103  orderer3.nitw.edu
192.168.1.104  peer0.nitwarangal.nitw.edu ca-nitwarangal
192.168.1.105  peer1.nitwarangal.nitw.edu
192.168.1.106  peer0.cse.departments.nitw.edu ca-departments
192.168.1.107  peer0.ece.departments.nitw.edu
192.168.1.108  peer0.me.departments.nitw.edu
192.168.1.109  peer0.dac.departments.nitw.edu
192.168.1.110  peer0.verifiers.nitw.edu ca-verifiers
192.168.1.111  peer1.verifiers.nitw.edu
# === END ===
EOF'
```

---

## PHASE 5: Start Docker Containers (Each System Runs Its Own File)

Start containers on each system **in this exact order**. Wait ~10 seconds between steps.

### 🔵 Step 1: Start Orderers (Systems 01, 02, 03)

**System 01:**
```bash
cd ~/Academic_RecordsBlockchain && source env.sh
docker-compose -f docker/docker-compose-orderer1.yaml up -d
# Containers: orderer1.nitw.edu, ca_orderer
```

**System 02:**
```bash
cd ~/Academic_RecordsBlockchain && source env.sh
docker-compose -f docker/docker-compose-orderer2.yaml up -d
# Containers: orderer2.nitw.edu
```

**System 03:**
```bash
cd ~/Academic_RecordsBlockchain && source env.sh
docker-compose -f docker/docker-compose-orderer3.yaml up -d
# Containers: orderer3.nitw.edu
```

> ⏳ Wait 10 seconds for Raft leader election to complete.

### 🟢 Step 2: Start NITWarangal Peers (Systems 04, 05)

**System 04:**
```bash
cd ~/Academic_RecordsBlockchain && source env.sh
docker-compose -f docker/docker-compose-nitwarangal-peer0.yaml up -d
# Containers: peer0.nitwarangal.nitw.edu, ca_nitwarangal, couchdb.nitw.peer0
```

**System 05:**
```bash
cd ~/Academic_RecordsBlockchain && source env.sh
docker-compose -f docker/docker-compose-nitwarangal-peer1.yaml up -d
# Containers: peer1.nitwarangal.nitw.edu, couchdb.nitw.peer1
```

### 🟡 Step 3: Start Department Peers (Systems 06, 07, 08, 09)

**System 06 (CSE — Anchor Peer):**
```bash
cd ~/Academic_RecordsBlockchain && source env.sh
docker-compose -f docker/docker-compose-depts-cse.yaml up -d
# Containers: peer0.cse.departments.nitw.edu, ca_departments, couchdb.cse
```

**System 07 (ECE):**
```bash
cd ~/Academic_RecordsBlockchain && source env.sh
docker-compose -f docker/docker-compose-depts-ece.yaml up -d
# Containers: peer0.ece.departments.nitw.edu, couchdb.ece
```

**System 08 (ME):**
```bash
cd ~/Academic_RecordsBlockchain && source env.sh
docker-compose -f docker/docker-compose-depts-me.yaml up -d
# Containers: peer0.me.departments.nitw.edu, couchdb.me
```

**System 09 (DAC):**
```bash
cd ~/Academic_RecordsBlockchain && source env.sh
docker-compose -f docker/docker-compose-depts-dac.yaml up -d
# Containers: peer0.dac.departments.nitw.edu, couchdb.dac
```

### 🟣 Step 4: Start Verifier Peers (Systems 10, 11)

**System 10 (Primary Verifier — Anchor Peer):**
```bash
cd ~/Academic_RecordsBlockchain && source env.sh
docker-compose -f docker/docker-compose-verifiers-peer0.yaml up -d
# Containers: peer0.verifiers.nitw.edu, ca_verifiers, couchdb.verifiers.peer0
```

**System 11 (Secondary Verifier):**
```bash
cd ~/Academic_RecordsBlockchain && source env.sh
docker-compose -f docker/docker-compose-verifiers-peer1.yaml up -d
# Containers: peer1.verifiers.nitw.edu, couchdb.verifiers.peer1
```

> ⏳ Wait 15 seconds for all peers to fully initialize and gossip discovery to propagate.

---

## PHASE 6: Create Channel & Join All Peers (System 01)

Run the `join-channel-multihost.sh` script from **System 01** which uses the CLI container:

```bash
cd ~/Academic_RecordsBlockchain
chmod +x join-channel-multihost.sh
./join-channel-multihost.sh
```

**What this does (in order):**
1. Joins **orderer1** to the channel via `osnadmin`
2. Joins all **9 peers** to the channel:
   - NITWarangal: peer0, peer1
   - Departments: peer0.cse, peer0.ece, peer0.me, peer0.dac (Note: in join-channel script they use peer0-peer2 naming)
   - Verifiers: peer0, peer1
3. **Packages** chaincode (`academic-records`)
4. **Installs** chaincode on all 9 peers
5. **Approves** for all 3 orgs (NITWarangalMSP, DepartmentsMSP, VerifiersMSP)
6. **Commits** chaincode with endorsement policy

### Manual Channel Join (Alternative)

If the script doesn't work, do it manually from System 01:

```bash
# Join orderer to channel
osnadmin channel join --channelID academic-records-channel \
    --config-block ./channel-artifacts/academic-records-channel.block \
    -o orderer1.nitw.edu:7053 \
    --ca-file ./organizations/ordererOrganizations/nitw.edu/orderers/orderer1.nitw.edu/tls/ca.crt \
    --client-cert ./organizations/ordererOrganizations/nitw.edu/orderers/orderer1.nitw.edu/tls/server.crt \
    --client-key ./organizations/ordererOrganizations/nitw.edu/orderers/orderer1.nitw.edu/tls/server.key

# Join each peer (example for peer0.nitwarangal)
CORE_PEER_LOCALMSPID=NITWarangalMSP \
CORE_PEER_ADDRESS=peer0.nitwarangal.nitw.edu:7051 \
CORE_PEER_TLS_ENABLED=true \
CORE_PEER_TLS_ROOTCERT_FILE=./organizations/peerOrganizations/nitwarangal.nitw.edu/peers/peer0.nitwarangal.nitw.edu/tls/ca.crt \
CORE_PEER_MSPCONFIGPATH=./organizations/peerOrganizations/nitwarangal.nitw.edu/users/Admin@nitwarangal.nitw.edu/msp \
peer channel join -b ./channel-artifacts/academic-records-channel.block
```

Repeat for every peer changing the MSP ID, address, and TLS paths.

---

## PHASE 7: Deploy Chaincode (System 01)

```bash
# 1. Vendor Go dependencies
cd chaincode-go && GO111MODULE=on go mod vendor && cd ..

# 2. Package
peer lifecycle chaincode package academic-records.tar.gz \
    --path ./chaincode-go --lang golang --label academic_records_2.0

# 3. Install on ALL 9 peers (example for one peer)
CORE_PEER_LOCALMSPID=NITWarangalMSP \
CORE_PEER_ADDRESS=peer0.nitwarangal.nitw.edu:7051 \
CORE_PEER_TLS_ROOTCERT_FILE=./organizations/peerOrganizations/nitwarangal.nitw.edu/peers/peer0.nitwarangal.nitw.edu/tls/ca.crt \
CORE_PEER_MSPCONFIGPATH=./organizations/peerOrganizations/nitwarangal.nitw.edu/users/Admin@nitwarangal.nitw.edu/msp \
peer lifecycle chaincode install academic-records.tar.gz
# Repeat for all 9 peers...

# 4. Get Package ID
PACKAGE_ID=$(peer lifecycle chaincode queryinstalled | grep academic_records_2.0 | sed -n 's/Package ID: \(.*\), Label:.*/\1/p')

# 5. Approve for each org (repeat for NITWarangalMSP, DepartmentsMSP, VerifiersMSP)
peer lifecycle chaincode approveformyorg -o orderer1.nitw.edu:7050 \
    --tls --cafile ./organizations/ordererOrganizations/nitw.edu/orderers/orderer1.nitw.edu/tls/ca.crt \
    --channelID academic-records-channel --name academic-records \
    --version 2.0 --package-id "$PACKAGE_ID" --sequence 1 \
    --signature-policy "OR('NITWarangalMSP.peer','DepartmentsMSP.peer','VerifiersMSP.peer')" \
    --collections-config ./collections_config.json

# 6. Commit (endorsement from all 3 anchor peers)
peer lifecycle chaincode commit -o orderer1.nitw.edu:7050 \
    --tls --cafile ./organizations/ordererOrganizations/nitw.edu/orderers/orderer1.nitw.edu/tls/ca.crt \
    --channelID academic-records-channel --name academic-records \
    --version 2.0 --sequence 1 \
    --peerAddresses peer0.nitwarangal.nitw.edu:7051 \
    --tlsRootCertFiles ./organizations/peerOrganizations/nitwarangal.nitw.edu/peers/peer0.nitwarangal.nitw.edu/tls/ca.crt \
    --peerAddresses peer0.cse.departments.nitw.edu:9051 \
    --tlsRootCertFiles ./organizations/peerOrganizations/departments.nitw.edu/peers/peer0.cse.departments.nitw.edu/tls/ca.crt \
    --peerAddresses peer0.verifiers.nitw.edu:11051 \
    --tlsRootCertFiles ./organizations/peerOrganizations/verifiers.nitw.edu/peers/peer0.verifiers.nitw.edu/tls/ca.crt
```

---

## PHASE 8: Start Backend API (Systems 04, 05, 06, 09, 10, 12)

Each system that serves users needs a backend instance.

### System 04 — Admin Backend

```bash
cd ~/Academic-Records-Blockchain-Backend
cat > .env << 'EOF'
PORT=3001
CHANNEL_NAME=academic-records-channel
CHAINCODE_NAME=academic-records
MSP_ID=NITWarangalMSP
PEER_ENDPOINT=peer0.nitwarangal.nitw.edu:7051
CA_ENDPOINT=https://ca-nitwarangal:8054
GATEWAY_DISCOVERY_AS_LOCALHOST=false
PINATA_API_KEY=<your-pinata-key>
PINATA_SECRET_API_KEY=<your-pinata-secret>
EOF
npm install && node src/enrollAdmin.js && npm run dev
```

### System 05 — Student Portal Backend

```bash
cd ~/Academic-Records-Blockchain-Backend
cat > .env << 'EOF'
PORT=3001
CHANNEL_NAME=academic-records-channel
CHAINCODE_NAME=academic-records
MSP_ID=NITWarangalMSP
PEER_ENDPOINT=peer1.nitwarangal.nitw.edu:7151
GATEWAY_DISCOVERY_AS_LOCALHOST=false
EOF
npm install && node src/enrollAdmin.js && npm run dev
```

### System 06 — CSE Department Backend

```bash
cd ~/Academic-Records-Blockchain-Backend
cat > .env << 'EOF'
PORT=3001
CHANNEL_NAME=academic-records-channel
CHAINCODE_NAME=academic-records
MSP_ID=DepartmentsMSP
PEER_ENDPOINT=peer0.cse.departments.nitw.edu:9051
CA_ENDPOINT=https://ca-departments:9054
GATEWAY_DISCOVERY_AS_LOCALHOST=false
DEPARTMENT=CSE
EOF
npm install && node src/enrollAdmin.js && npm run dev
```

> **Systems 07, 08** — same as System 06 but change `PEER_ENDPOINT` and `DEPARTMENT` to ECE/ME respectively.

### System 09 — DAC Committee Backend

```bash
cd ~/Academic-Records-Blockchain-Backend
cat > .env << 'EOF'
PORT=3001
CHANNEL_NAME=academic-records-channel
CHAINCODE_NAME=academic-records
MSP_ID=DepartmentsMSP
PEER_ENDPOINT=peer0.dac.departments.nitw.edu:9351
GATEWAY_DISCOVERY_AS_LOCALHOST=false
DEPARTMENT=DAC
EOF
npm install && node src/enrollAdmin.js && npm run dev
```

### System 10 — Primary Verifier Backend

```bash
cd ~/Academic-Records-Blockchain-Backend
cat > .env << 'EOF'
PORT=3001
CHANNEL_NAME=academic-records-channel
CHAINCODE_NAME=academic-records
MSP_ID=VerifiersMSP
PEER_ENDPOINT=peer0.verifiers.nitw.edu:11051
CA_ENDPOINT=https://ca-verifiers:11054
GATEWAY_DISCOVERY_AS_LOCALHOST=false
EOF
npm install && node src/enrollAdmin.js && npm run dev
```

### System 12 — Student Portal (SDK-only, No Peer)

```bash
cd ~/Academic-Records-Blockchain-Backend
cat > .env << 'EOF'
PORT=3001
CHANNEL_NAME=academic-records-channel
CHAINCODE_NAME=academic-records
MSP_ID=NITWarangalMSP
PEER_ENDPOINT=peer0.nitwarangal.nitw.edu:7051
GATEWAY_DISCOVERY_AS_LOCALHOST=false
EOF
npm install && node src/enrollAdmin.js && npm run dev
```

---

## PHASE 9: Start Frontend (Systems 04 and 12)

### System 04 — Admin Dashboard
```bash
cd ~/Academic-Records-Blockchain-Frontend
npm install
ng serve --host 0.0.0.0 --port 4200
# Access: http://192.168.1.104:4200
```

### System 12 — Student Portal Frontend
```bash
cd ~/Academic-Records-Blockchain-Frontend
npm install
ng serve --host 0.0.0.0 --port 4200
# Access: http://192.168.1.112:4200
```

---

## What Each System Becomes After Deployment

| System | Machine Role | What It Does | Who Uses It |
|--------|-------------|--------------|-------------|
| **01** | **Raft Primary Orderer** | Sequences transactions into blocks, distributes to all peers. Runs CA for orderer identities. Elects new leader if it fails. | Nobody directly — it's infrastructure |
| **02** | **Raft Follower Orderer** | Backup orderer. Replicates the block log. Takes over as leader if System 01 goes down. | Nobody directly — HA |
| **03** | **Raft Follower Orderer** | Second backup orderer. Ensures consensus survives 1 machine failure (2-of-3 majority). | Nobody directly — HA |
| **04** | **Admin Peer** | The university admin machine. Runs ExamSection approval, Dean approval, Admin Final Approval (the last step). Generates PDFs, uploads to IPFS. Calculates final CGPA. Auto-revokes certificates if CGPA < 5.0. Also runs the main CA. | Exam Section, Dean, University Admin |
| **05** | **Student Peer** | Read-only peer for students. Students can view their records, check approval status, request certificates, download from IPFS. Cannot modify records. | Students |
| **06** | **CSE Dept Peer** | CSE faculty submit academic records (with composite key duplicate detection). CSE HOD approves them. This is the anchor peer for the entire Departments org — enables gossip discovery to Systems 07-09. Runs the Dept CA. | CSE Faculty, CSE HOD |
| **07** | **ECE Dept Peer** | Same as System 06 but for ECE. Gossips with System 06 (anchor) to sync blocks. | ECE Faculty, ECE HOD |
| **08** | **ME Dept Peer** | Same as System 06 but for ME. | ME Faculty, ME HOD |
| **09** | **DAC Committee Peer** | Runs the multi-signature DAC approval (2-of-3 quorum). Three DAC members each call `DACApprove()`. After 2 signatures are collected, the record advances to `DAC_APPROVED`. | DAC Members (minimum 3) |
| **10** | **Primary Verifier** | External organizations (employers, other universities) upload PDFs here to verify authenticity. System computes SHA-256 hash, queries blockchain via `VerifyCertificateByHash()`, returns Valid/Revoked/Fake. Anchor peer for Verifiers org. Runs Verifiers CA. | Employers, HR agencies, other universities |
| **11** | **Secondary Verifier** | HA backup for System 10. Identical capability. | Same as System 10 |
| **12** | **Student Portal** | No Fabric peer — pure SDK client. Connects to System 04's peer via the Fabric Gateway. Runs the Angular frontend for students. Lightest machine — only needs Node.js. | Students (web browser) |

---

## Transaction Flow Across All 12 Systems

```
┌─── System 06 (CSE Faculty) ───────────────────────────────────────────────┐
│  Faculty creates academic record → CreateAcademicRecord()                 │
│  (Composite key record~student~semester checked for duplicates)           │
│  Record status: DRAFT → submits for approval                             │
└──────────── endorsed by peer0.cse ── sent to orderer1 (Sys 01) ──────────┘
                                           │
                    ┌──────────────────────┤ Orderer distributes block
                    ▼                      ▼                    ▼
            Systems 04-05           Systems 06-09         Systems 10-11
            (NITWarangal)           (Departments)          (Verifiers)
            All peers commit block to their local ledger + CouchDB

┌─── System 06 (CSE HOD) ──────────────────────────────────────────────────┐
│  HOD approves → HODApprove() → status: HOD_APPROVED                     │
│  72hr SLA deadline starts ticking                                        │
└──────────── endorsed → orderer → all peers get the block ────────────────┘

┌─── System 09 (DAC Members) ──────────────────────────────────────────────┐
│  DAC Member 1 calls DACApprove() → signature collected (1 of 3)          │
│  DAC Member 2 calls DACApprove() → quorum reached! (2 of 3)             │
│  Status: DAC_APPROVED                                                    │
└──────────────────────────────────────────────────────────────────────────┘

┌─── System 04 (ExamSection) ──────────────────────────────────────────────┐
│  ExamSection locks grades → status: EXAM_SECTION_APPROVED                │
└──────── then Dean approves → status: DEAN_APPROVED ──────────────────────┘

┌─── System 04 (Admin Final) ──────────────────────────────────────────────┐
│  AdminFinalApprove() — NITWarangalMSP only:                              │
│  ├── Calculates cumulative CGPA                                          │
│  ├── Updates student profile on-chain                                    │
│  ├── Status → ADMIN_FINALIZED                                            │
│  └── If CGPA < 5.0 → auto-revokes all DEGREE/PROVISIONAL certificates   │
│                                                                          │
│  IssueCertificate():                                                     │
│  ├── Generates PDF (Puppeteer + QR code)                                 │
│  ├── Computes SHA-256 hash                                               │
│  ├── Uploads to IPFS (Pinata → Kubo → Infura → local)                   │
│  └── Stores pdfHash + ipfsHash on blockchain                             │
└──────────────────────────────────────────────────────────────────────────┘

┌─── System 10 (External Verifier) ────────────────────────────────────────┐
│  Employer uploads PDF → SHA-256 computed → VerifyCertificateByHash()      │
│  Result: ✅ Authentic & Valid  OR  ⚠️ Revoked  OR  ❌ Fake               │
└──────────────────────────────────────────────────────────────────────────┘

┌─── System 05 or 12 (Student) ────────────────────────────────────────────┐
│  Student views records, checks approval progress                         │
│  Downloads certificate via IPFS gateway redirect                         │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Gossip & Block Synchronization

Every block committed on any peer is automatically replicated to all other peers through Fabric's gossip protocol:

```
Anchor Peers (discovery entry points):
  ├── peer0.nitwarangal.nitw.edu (System 04) — for NITWarangalMSP
  ├── peer0.cse.departments.nitw.edu (System 06) — for DepartmentsMSP
  └── peer0.verifiers.nitw.edu (System 10) — for VerifiersMSP

Within same org (intra-org gossip):
  System 04 ←→ System 05           (NITWarangal peers)
  System 06 ←→ 07 ←→ 08 ←→ 09     (Department peers)
  System 10 ←→ System 11           (Verifier peers)

Cross-org gossip (via anchor peers):
  System 04 ←→ System 06 ←→ System 10
```

---

## Quick Commands Reference

| Action | Command | Run On |
|--------|---------|--------|
| Start everything | `./network-multihost.sh up` | System 01 (if SSH configured) |
| Stop everything | `./network-multihost.sh down` | System 01 |
| Check status | `./network-multihost.sh status` | System 01 |
| Generate crypto | `./generate-multihost-crypto.sh` | System 01 |
| Channel + Chaincode | `./join-channel-multihost.sh` | System 01 |
| Enroll admin wallet | `node src/enrollAdmin.js` | Each backend system |
| Start backend | `npm run dev` | Systems 04-12 |
| Start frontend | `ng serve --host 0.0.0.0` | Systems 04, 12 |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Peer can't reach orderer | Check `/etc/hosts` on that machine. Run `ping orderer1.nitw.edu`. |
| "access denied" on chaincode invoke | Run `node src/enrollAdmin.js` on that backend's system. Wallet identity may be stale. |
| Gossip not syncing | Ensure `extra_hosts` in docker-compose has correct IPs. Check `docker logs <peer-container>`. |
| Channel join fails | Verify orderer is running: `docker logs orderer1.nitw.edu`. Check TLS cert paths. |
| Raft leader election stuck | Ensure all 3 orderers (01, 02, 03) are running. Need majority (2 of 3). |
| CouchDB connection refused | Verify CouchDB container is up: `docker ps`. Check CouchDB port isn't in use. |

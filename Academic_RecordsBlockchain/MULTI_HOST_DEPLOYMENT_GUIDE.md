# Multi-Machine Deployment — Step-by-Step Guide

> **Complete guide** to deploy the Academic Records Blockchain across multiple physical machines, where each machine acts as a different organization (peer/endorser/verifier).

---

## Prerequisites

| Machine | Role | What it runs |
|---------|------|-------------|
| **Machine 1** | Orderer Host | Orderer + CA Orderer |
| **Machine 2** | NITWarangal (Admin) | Peer + CA + CouchDB + Backend + Frontend |
| **Machine 3** | Departments | Peer + CA + CouchDB + Backend + Frontend |
| **Machine 4** | Verifiers | Peer + CA + CouchDB + Backend + Frontend |

> **Note:** You can run with just 2 machines too! Put Orderer + NITWarangal on Machine 1, and Departments + Verifiers on Machine 2.

### Required on ALL machines:
- Docker & Docker Compose
- Node.js (v18+) & npm
- Git
- Open firewall ports: `7050-7054, 8054, 9051-9054, 11051-11054, 3000, 4200`

### Required on Machine 1 (Orderer) only:
- Hyperledger Fabric binaries (`peer`, `configtxgen`, `osnadmin`)
- SSH key-based access to all other machines

---

## Step 1: Clone the Repository on All Machines

Run this on **every machine**:

```bash
git clone https://github.com/maaditi05-source/Academic_RecordsBlockchain.git
cd Academic_RecordsBlockchain
```

Also clone the backend and frontend repos (or copy them to the same relative path):
```bash
cd ..
# Make sure the directory structure looks like:
# workspace/
#   ├── Academic_RecordsBlockchain/    (blockchain network)
#   ├── Academic-Records-Blockchain-Backend/   (Node.js API)
#   └── Academic-Records-Blockchain-Frontend/  (Angular app)
```

---

## Step 2: Configure Machine IPs

On **Machine 1 (Orderer)**, edit `env.sh`:

```bash
cd Academic_RecordsBlockchain
nano env.sh
```

Change the IP addresses to match your machines:

```bash
# Example: 4-machine setup on a LAN
export ORDERER_HOST="192.168.1.100"      # Machine 1
export NITWARANGAL_HOST="192.168.1.101"  # Machine 2
export DEPARTMENTS_HOST="192.168.1.102"  # Machine 3
export VERIFIERS_HOST="192.168.1.103"    # Machine 4
```

> **To find your IP:** Run `hostname -I | awk '{print $1}'` on each machine.

> **For 2 machines:** Set `ORDERER_HOST` and `NITWARANGAL_HOST` to Machine 1's IP, and `DEPARTMENTS_HOST` and `VERIFIERS_HOST` to Machine 2's IP.

---

## Step 3: Setup Hostname Resolution

Run on **every machine** (requires sudo):

```bash
sudo ./setup-hosts.sh
```

This adds entries to `/etc/hosts` so that `peer0.nitwarangal.nitw.edu`, `orderer.nitw.edu`, etc. resolve to the correct IPs. Verify:

```bash
ping -c 1 orderer.nitw.edu
ping -c 1 peer0.nitwarangal.nitw.edu
ping -c 1 peer0.departments.nitw.edu
ping -c 1 peer0.verifiers.nitw.edu
```

All should respond with the correct IPs.

---

## Step 4: Generate Crypto Material (Machine 1 only)

On **Machine 1**, generate all certificates and keys:

```bash
# This uses your existing network.sh to generate identities
./network.sh up
```

Wait for it to complete. This creates the `organizations/` directory with all crypto material for every org.

> **Important:** After this step, Machine 1 has crypto for ALL orgs. We need to distribute it.

---

## Step 5: Distribute Crypto to Other Machines

On **Machine 1**, run:

```bash
./distribute-crypto.sh
```

This will:
1. Package each org's crypto material into tarballs
2. SCP them to the correct machines via SSH
3. Each machine receives: its own certs + orderer TLS certs + other orgs' TLS certs (for endorsement verification)

> **If SSH isn't set up:** Manually copy the tarballs from `dist-crypto/` to each machine:
> - `orderer-crypto.tar.gz` → Machine 1
> - `nitwarangal-crypto.tar.gz` → Machine 2
> - `departments-crypto.tar.gz` → Machine 3
> - `verifiers-crypto.tar.gz` → Machine 4

Then on each machine, extract to the correct paths under `organizations/`.

---

## Step 6: Stop Single-Machine Network, Start Multi-Host

First, stop the single-machine network (on Machine 1):

```bash
./network.sh clean
```

Now start individual containers on each machine:

**Machine 1 (Orderer):**
```bash
source env.sh
docker-compose -f docker/docker-compose-orderer.yaml up -d
```

**Machine 2 (NITWarangal):**
```bash
source env.sh
docker-compose -f docker/docker-compose-nitwarangal.yaml up -d
```

**Machine 3 (Departments):**
```bash
source env.sh
docker-compose -f docker/docker-compose-departments.yaml up -d
```

**Machine 4 (Verifiers):**
```bash
source env.sh
docker-compose -f docker/docker-compose-verifiers.yaml up -d
```

Wait ~20 seconds for all peers to initialize.

> **Or use the automated script from Machine 1:**
> ```bash
> ./network-multihost.sh up
> ```
> This SSHs into each machine and starts containers automatically.

---

## Step 7: Create Channel & Join Peers (Machine 1)

On **Machine 1**, create the blockchain channel and join all peers:

```bash
# Generate channel genesis block
FABRIC_CFG_PATH=${PWD}/configtx configtxgen \
    -profile AcademicRecordsChannel \
    -outputBlock channel-artifacts/academic-records-channel.block \
    -channelID academic-records-channel

# Join orderer
osnadmin channel join \
    --channelID academic-records-channel \
    --config-block channel-artifacts/academic-records-channel.block \
    -o orderer.nitw.edu:7053 \
    --ca-file ${PWD}/organizations/ordererOrganizations/nitw.edu/orderers/orderer.nitw.edu/tls/ca.crt \
    --client-cert ${PWD}/organizations/ordererOrganizations/nitw.edu/orderers/orderer.nitw.edu/tls/server.crt \
    --client-key ${PWD}/organizations/ordererOrganizations/nitw.edu/orderers/orderer.nitw.edu/tls/server.key

# Join each peer (example for NITWarangal)
CORE_PEER_LOCALMSPID="NITWarangalMSP" \
CORE_PEER_ADDRESS="peer0.nitwarangal.nitw.edu:7051" \
CORE_PEER_TLS_ENABLED=true \
CORE_PEER_TLS_ROOTCERT_FILE="${PWD}/organizations/peerOrganizations/nitwarangal.nitw.edu/peers/peer0.nitwarangal.nitw.edu/tls/ca.crt" \
CORE_PEER_MSPCONFIGPATH="${PWD}/organizations/peerOrganizations/nitwarangal.nitw.edu/users/Admin@nitwarangal.nitw.edu/msp" \
peer channel join -b channel-artifacts/academic-records-channel.block

# Repeat for Departments and Verifiers (change MSP, address, paths)
```

---

## Step 8: Deploy Chaincode (Machine 1)

```bash
# Package
peer lifecycle chaincode package academic-records.tar.gz \
    --path ${PWD}/chaincode-go --lang golang --label academic-records_1.0

# Install on ALL peers (run for each org, changing env vars)
# For NITWarangal:
CORE_PEER_LOCALMSPID="NITWarangalMSP" \
CORE_PEER_ADDRESS="peer0.nitwarangal.nitw.edu:7051" \
CORE_PEER_TLS_ENABLED=true \
CORE_PEER_TLS_ROOTCERT_FILE="${PWD}/organizations/peerOrganizations/nitwarangal.nitw.edu/peers/peer0.nitwarangal.nitw.edu/tls/ca.crt" \
CORE_PEER_MSPCONFIGPATH="${PWD}/organizations/peerOrganizations/nitwarangal.nitw.edu/users/Admin@nitwarangal.nitw.edu/msp" \
peer lifecycle chaincode install academic-records.tar.gz
# Repeat for Departments and Verifiers...

# Get package ID
peer lifecycle chaincode queryinstalled

# Approve for each org (using the PACKAGE_ID from above)
# Approve for NITWarangal:
CORE_PEER_LOCALMSPID="NITWarangalMSP" \
CORE_PEER_ADDRESS="peer0.nitwarangal.nitw.edu:7051" \
... \
peer lifecycle chaincode approveformyorg \
    -o orderer.nitw.edu:7050 --tls \
    --cafile ${PWD}/organizations/ordererOrganizations/nitw.edu/orderers/orderer.nitw.edu/tls/ca.crt \
    --channelID academic-records-channel \
    --name academic-records --version 1.0 \
    --package-id $PACKAGE_ID --sequence 1 \
    --collections-config collections_config.json
# Repeat for Departments and Verifiers...

# Commit (sends to all 3 peers for MAJORITY endorsement)
peer lifecycle chaincode commit \
    -o orderer.nitw.edu:7050 --tls \
    --cafile ${PWD}/organizations/ordererOrganizations/nitw.edu/orderers/orderer.nitw.edu/tls/ca.crt \
    --channelID academic-records-channel \
    --name academic-records --version 1.0 --sequence 1 \
    --collections-config collections_config.json \
    --peerAddresses peer0.nitwarangal.nitw.edu:7051 \
    --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/nitwarangal.nitw.edu/peers/peer0.nitwarangal.nitw.edu/tls/ca.crt \
    --peerAddresses peer0.departments.nitw.edu:9051 \
    --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/departments.nitw.edu/peers/peer0.departments.nitw.edu/tls/ca.crt \
    --peerAddresses peer0.verifiers.nitw.edu:11051 \
    --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/verifiers.nitw.edu/peers/peer0.verifiers.nitw.edu/tls/ca.crt
```

---

## Step 9: Generate Connection Profiles

On **Machine 1** (then copy to each machine):

```bash
./generate-connection-profiles.sh
```

This creates connection profiles that include ALL orgs, enabling SDK service discovery and multi-org endorsement.

---

## Step 10: Start Backend on Each Machine

On **each machine**, copy the correct `.env` file:

**Machine 2 (NITWarangal):**
```bash
cd Academic-Records-Blockchain-Backend
cp .env.nitwarangal .env

# For multi-host, update these in .env:
sed -i 's/GATEWAY_DISCOVERY_AS_LOCALHOST=true/GATEWAY_DISCOVERY_AS_LOCALHOST=false/' .env
sed -i 's|CA_URL=https://localhost:8054|CA_URL=https://192.168.1.101:8054|' .env
sed -i 's|CORS_ORIGIN=http://localhost:4200|CORS_ORIGIN=http://192.168.1.101:4200|' .env

# Import admin identity
node src/importAdmin.js

# Start backend
npm run dev
```

**Machine 3 (Departments):**
```bash
cd Academic-Records-Blockchain-Backend
cp .env.departments .env
# Same sed commands with Machine 3's IP and port 9054
node src/importAdmin.js
npm run dev
```

**Machine 4 (Verifiers):**
```bash
cd Academic-Records-Blockchain-Backend
cp .env.verifiers .env
# Same sed commands with Machine 4's IP and port 11054
node src/importAdmin.js
npm run dev
```

---

## Step 11: Start Frontend on Each Machine

On **each machine**:

```bash
cd Academic-Records-Blockchain-Frontend

# Update API URL to point to local backend
# Edit src/environments/environment.ts:
#   apiUrl: 'http://<THIS_MACHINES_IP>:3000/api'

npm start
```

---

## Step 12: Test Cross-Machine Sync! 🎉

1. Open `http://192.168.1.101:4200` (NITWarangal machine)
   - Login as admin
   - Create a student
   - Submit marks/records

2. Open `http://192.168.1.102:4200` (Departments machine)
   - Login as department admin
   - **You should see the student that was just created!**
   - Approve the pending records

3. Back on `http://192.168.1.101:4200`
   - **The approved status should now be visible!**
   - Request a certificate

4. Open `http://192.168.1.103:4200` (Verifiers machine)
   - **Certificate requests visible across all machines!**
   - Verify certificates

> **This works for ALL functionalities:** student creation, marks, records, approvals, certificates, revocations, department management — everything. The blockchain ledger IS the sync mechanism.

---

## What If an IP Changes?

```bash
# 1. Update env.sh with the new IP
nano env.sh

# 2. Regenerate configs
./deploy-multihost.sh reconfigure

# 3. If Docker containers need restarting:
./network-multihost.sh restart
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Peer can't connect to orderer | Check `/etc/hosts` and firewall ports |
| `GATEWAY_DISCOVERY_AS_LOCALHOST` error | Must be `false` in multi-host `.env` |
| Endorsement failure | Ensure ≥2 of 3 peers are running (MAJORITY) |
| Connection profile errors | Re-run `./generate-connection-profiles.sh` |
| `TLS handshake failed` | Crypto wasn't distributed; re-run `./distribute-crypto.sh` |

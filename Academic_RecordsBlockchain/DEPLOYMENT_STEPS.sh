# 12-System Deployment — Complete Step-by-Step Guide
# Academic Records Blockchain — NIT Warangal
#
# Run this on each machine according to the section labelled for it.
# ALL machines must have: Docker, Docker Compose, Node.js 18+, Git
#
# COLOR CODING IN THIS FILE:
#   [ALL]       = Run on every machine
#   [NODE01-03] = Orderer machines
#   [NODE04]    = NITWarangal peer0 (admin)
#   [NODE05]    = NITWarangal peer1 (student portal)
#   [NODE06-09] = Department peers (CSE/ECE/ME/DAC)
#   [NODE10-11] = Verifier peers
#   [NODE12]    = Student portal SDK-only

# ============================================================
# PHASE 0 — COLLECT ALL IPs (do this first, on any machine)
# ============================================================
# On each machine, run:
#   hostname -I | awk '{print $1}'
# Write down:
#   NODE01_IP = ___  (orderer1)
#   NODE02_IP = ___  (orderer2)
#   NODE03_IP = ___  (orderer3)
#   NODE04_IP = ___  (nitw peer0 / admin)
#   NODE05_IP = ___  (nitw peer1 / student)
#   NODE06_IP = ___  (cse dept)
#   NODE07_IP = ___  (ece dept)
#   NODE08_IP = ___  (me dept)
#   NODE09_IP = ___  (dac dept)
#   NODE10_IP = ___  (verifier0)
#   NODE11_IP = ___  (verifier1)
#   NODE12_IP = ___  (student portal)

# ============================================================
# PHASE 1 — INSTALL PREREQUISITES [ALL MACHINES]
# ============================================================

# 1.1 Install Docker
sudo apt-get update -y
sudo apt-get install -y docker.io docker-compose-plugin git curl wget

# 1.2 Add current user to docker group (avoids sudo for docker commands)
sudo usermod -aG docker $USER
newgrp docker

# 1.3 Install Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 1.4 Install Go 1.21 (for chaincode compilation on orderer/admin machine)
# Only needed on NODE01 and NODE04
wget https://go.dev/dl/go1.21.13.linux-amd64.tar.gz
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf go1.21.13.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc
go version  # should print go1.21.13

# 1.5 Install Hyperledger Fabric binaries (peer, orderer, configtxgen, cryptogen)
# Only needed on NODE01 and NODE04 (admin/tooling machines)
curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.5.12 1.5.12
# This downloads fabric-samples and puts peer/orderer/configtxgen into ~/fabric-samples/bin
# Add to PATH:
echo 'export PATH=$PATH:$HOME/fabric-samples/bin' >> ~/.bashrc
source ~/.bashrc
peer version  # should print 2.5.x

# ============================================================
# PHASE 2 — CLONE THE REPOSITORY [ALL MACHINES]
# ============================================================

# On every machine, clone both repos into the same parent directory:
mkdir -p ~/nitw && cd ~/nitw

git clone https://github.com/maaditi05-source/Academic_RecordsBlockchain.git
git clone https://github.com/maaditi05-source/Academic-Records-Blockchain-Backend.git
git clone https://github.com/maaditi05-source/Academic-Records-Blockchain-Frontend.git

# Verify directory structure:
ls ~/nitw
# Should show:
#   Academic_RecordsBlockchain/
#   Academic-Records-Blockchain-Backend/
#   Academic-Records-Blockchain-Frontend/

# ============================================================
# PHASE 3 — SET MACHINE IPs IN env.sh [NODE01 ONLY — then copy]
# ============================================================
# Do this ONCE on Node01, then copy env.sh to all other machines.

cd ~/nitw/Academic_RecordsBlockchain

# Edit env.sh and fill in real IPs:
nano env.sh

# Change these lines (replace x.x.x.x with the IPs you collected in Phase 0):
#   export ORDERER1_HOST="NODE01_IP"
#   export ORDERER2_HOST="NODE02_IP"
#   export ORDERER3_HOST="NODE03_IP"
#   export NITW_PEER0_HOST="NODE04_IP"
#   export NITW_PEER1_HOST="NODE05_IP"
#   export DEPT_CSE_HOST="NODE06_IP"
#   export DEPT_ECE_HOST="NODE07_IP"
#   export DEPT_ME_HOST="NODE08_IP"
#   export DEPT_DAC_HOST="NODE09_IP"
#   export VERI_PEER0_HOST="NODE10_IP"
#   export VERI_PEER1_HOST="NODE11_IP"
#   export STUDENT_PORTAL_HOST="NODE12_IP"

# Copy the filled env.sh to ALL other machines:
for NODE_IP in NODE02_IP NODE03_IP NODE04_IP NODE05_IP NODE06_IP NODE07_IP NODE08_IP NODE09_IP NODE10_IP NODE11_IP NODE12_IP; do
    scp env.sh user@${NODE_IP}:~/nitw/Academic_RecordsBlockchain/env.sh
done

# Verify on env.sh source:
source env.sh
# Should print the 12-system environment table

# ============================================================
# PHASE 4 — GENERATE CRYPTO MATERIAL [NODE01 ONLY]
# ============================================================

cd ~/nitw/Academic_RecordsBlockchain

# Source environment
source env.sh

# Generate all certificates and keys for all 12 nodes
cryptogen generate --config=./crypto-config.yaml --output=./organizations

# Verify output:
ls ./organizations/ordererOrganizations/nitw.edu/orderers/
# Should show: orderer1.nitw.edu  orderer2.nitw.edu  orderer3.nitw.edu

ls ./organizations/peerOrganizations/departments.nitw.edu/peers/
# Should show: peer0.cse.  peer0.ece.  peer0.me.  peer0.dac.

ls ./organizations/peerOrganizations/nitwarangal.nitw.edu/peers/
# Should show: peer0.nitwarangal.  peer1.nitwarangal.

ls ./organizations/peerOrganizations/verifiers.nitw.edu/peers/
# Should show: peer0.verifiers.  peer1.verifiers.

# ============================================================
# PHASE 5 — GENERATE GENESIS BLOCK + CHANNEL TX [NODE01 ONLY]
# ============================================================

cd ~/nitw/Academic_RecordsBlockchain

source env.sh
mkdir -p channel-artifacts

# Generate genesis block (uses configtx/configtx.yaml)
configtxgen \
  -profile AcademicRecordsGenesis \
  -channelID system-channel \
  -outputBlock ./channel-artifacts/genesis.block \
  -configPath ./configtx

# Generate channel creation tx
configtxgen \
  -profile AcademicRecordsChannel \
  -outputCreateChannelTx ./channel-artifacts/academic-records-channel.tx \
  -channelID academic-records-channel \
  -configPath ./configtx

# Generate anchor peer update txs
configtxgen -profile AcademicRecordsChannel \
  -outputAnchorPeersUpdate ./channel-artifacts/NITWarangalMSPanchors.tx \
  -channelID academic-records-channel -asOrg NITWarangalMSP -configPath ./configtx

configtxgen -profile AcademicRecordsChannel \
  -outputAnchorPeersUpdate ./channel-artifacts/DepartmentsMSPanchors.tx \
  -channelID academic-records-channel -asOrg DepartmentsMSP -configPath ./configtx

configtxgen -profile AcademicRecordsChannel \
  -outputAnchorPeersUpdate ./channel-artifacts/VerifiersMSPanchors.tx \
  -channelID academic-records-channel -asOrg VerifiersMSP -configPath ./configtx

echo "Channel artifacts generated successfully"
ls channel-artifacts/

# ============================================================
# PHASE 6 — GENERATE CONNECTION PROFILES [NODE01 ONLY]
# ============================================================

cd ~/nitw/Academic_RecordsBlockchain
source env.sh
chmod +x generate-connection-profiles.sh
./generate-connection-profiles.sh

# Verify:
ls organizations/peerOrganizations/*/connection-*.json

# ============================================================
# PHASE 7 — DISTRIBUTE CRYPTO MATERIAL [NODE01 ONLY]
# ============================================================

cd ~/nitw/Academic_RecordsBlockchain
source env.sh
chmod +x distribute-crypto.sh

# Edit distribute-crypto.sh to use the actual SSH username on each machine
# Replace "user" with your actual username on the remote machines
nano distribute-crypto.sh

# Then run:
./distribute-crypto.sh

# If distribute-crypto.sh is not set up yet, manually SCP each org to each machine:
# For NODE02 (orderer2):
tar czf /tmp/orderer2-crypto.tar.gz \
  organizations/ordererOrganizations/nitw.edu/orderers/orderer2.nitw.edu \
  organizations/ordererOrganizations/nitw.edu/msp
scp /tmp/orderer2-crypto.tar.gz user@NODE02_IP:~/nitw/
ssh user@NODE02_IP "cd ~/nitw && tar xzf orderer2-crypto.tar.gz -C Academic_RecordsBlockchain/"

# NODE04 (NITWarangal peer0) — needs full organizations dir + channel-artifacts
tar czf /tmp/nitw-peer0.tar.gz organizations/ channel-artifacts/
scp /tmp/nitw-peer0.tar.gz user@NODE04_IP:~/nitw/
ssh user@NODE04_IP "cd ~/nitw && tar xzf nitw-peer0.tar.gz -C Academic_RecordsBlockchain/"

# ... repeat for each node. Each node only needs its own org's peer certs
# + orderer TLS cert + other orgs' TLS certs (for validation).

# ============================================================
# PHASE 8 — UPDATE /etc/hosts [ALL MACHINES]
# ============================================================
# Run on every machine. Replace IPs with actual values.

cd ~/nitw/Academic_RecordsBlockchain
source env.sh
chmod +x setup-hosts.sh
sudo ./setup-hosts.sh

# Or manually add to /etc/hosts (as sudo):
sudo tee -a /etc/hosts << 'EOF'
# ---- Academic Records Blockchain 12-Node Network ----
NODE01_IP orderer1.nitw.edu
NODE02_IP orderer2.nitw.edu
NODE03_IP orderer3.nitw.edu
NODE04_IP peer0.nitwarangal.nitw.edu
NODE05_IP peer1.nitwarangal.nitw.edu
NODE06_IP peer0.cse.departments.nitw.edu
NODE07_IP peer0.ece.departments.nitw.edu
NODE08_IP peer0.me.departments.nitw.edu
NODE09_IP peer0.dac.departments.nitw.edu
NODE10_IP peer0.verifiers.nitw.edu
NODE11_IP peer1.verifiers.nitw.edu
# ---- End Academic Records Blockchain ----
EOF

# Verify resolution:
ping -c1 orderer1.nitw.edu
ping -c1 peer0.cse.departments.nitw.edu

# ============================================================
# PHASE 9 — START DOCKER CONTAINERS — PER MACHINE
# ============================================================
# Run the correct command on each machine:

# NODE01 — Orderer 1 (Primary)
cd ~/nitw/Academic_RecordsBlockchain
source env.sh
docker compose -f docker/docker-compose-orderer1.yaml up -d
docker ps   # should show: ca_orderer, orderer1.nitw.edu

# NODE02 — Orderer 2
cd ~/nitw/Academic_RecordsBlockchain
source env.sh
docker compose -f docker/docker-compose-orderer2.yaml up -d

# NODE03 — Orderer 3
cd ~/nitw/Academic_RecordsBlockchain
source env.sh
docker compose -f docker/docker-compose-orderer3.yaml up -d

# Give orderers 10 seconds to start:
sleep 10

# NODE04 — NITWarangal Peer 0 (Admin)
cd ~/nitw/Academic_RecordsBlockchain
source env.sh
docker compose -f docker/docker-compose-nitwarangal-peer0.yaml up -d
docker ps   # should show: ca_nitwarangal, couchdb.nitw.peer0, peer0.nitwarangal.nitw.edu

# NODE05 — NITWarangal Peer 1 (Student)
cd ~/nitw/Academic_RecordsBlockchain
source env.sh
docker compose -f docker/docker-compose-nitwarangal-peer1.yaml up -d

# NODE06 — CSE Department (Anchor peer + CA)
cd ~/nitw/Academic_RecordsBlockchain
source env.sh
docker compose -f docker/docker-compose-depts-cse.yaml up -d

# NODE07 — ECE Department
cd ~/nitw/Academic_RecordsBlockchain
source env.sh
docker compose -f docker/docker-compose-depts-ece.yaml up -d

# NODE08 — ME Department
cd ~/nitw/Academic_RecordsBlockchain
source env.sh
docker compose -f docker/docker-compose-depts-me.yaml up -d

# NODE09 — DAC Committee
cd ~/nitw/Academic_RecordsBlockchain
source env.sh
docker compose -f docker/docker-compose-depts-dac.yaml up -d

# NODE10 — Verifiers Peer 0 (Anchor + CA)
cd ~/nitw/Academic_RecordsBlockchain
source env.sh
docker compose -f docker/docker-compose-verifiers-peer0.yaml up -d

# NODE11 — Verifiers Peer 1
cd ~/nitw/Academic_RecordsBlockchain
source env.sh
docker compose -f docker/docker-compose-verifiers-peer1.yaml up -d

# ============================================================
# PHASE 10 — CREATE CHANNEL + JOIN PEERS [NODE04 — Admin]
# ============================================================
# All channel operations run from NODE04 using the CLI.
# NODE04 has the peer binary + channel-artifacts.

cd ~/nitw/Academic_RecordsBlockchain
source env.sh

# Export peer environment for the CLI commands:
export FABRIC_CFG_PATH=./configtx
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=NITWarangalMSP
export CORE_PEER_MSPCONFIGPATH=./organizations/peerOrganizations/nitwarangal.nitw.edu/users/Admin@nitwarangal.nitw.edu/msp
export CORE_PEER_ADDRESS=peer0.nitwarangal.nitw.edu:7051
export CORE_PEER_TLS_ROOTCERT_FILE=./organizations/peerOrganizations/nitwarangal.nitw.edu/peers/peer0.nitwarangal.nitw.edu/tls/ca.crt
export ORDERER_CA=./organizations/ordererOrganizations/nitw.edu/orderers/orderer1.nitw.edu/msp/tlscacerts/tlsca.nitw.edu-cert.pem

# 10.1 Create the channel
peer channel create \
  -o orderer1.nitw.edu:7050 \
  -c academic-records-channel \
  -f ./channel-artifacts/academic-records-channel.tx \
  --outputBlock ./channel-artifacts/academic-records-channel.block \
  --tls --cafile $ORDERER_CA

# 10.2 Join NITWarangal peer0 to channel
peer channel join -b ./channel-artifacts/academic-records-channel.block

# 10.3 Join NITWarangal peer1 to channel (switch address)
export CORE_PEER_ADDRESS=peer1.nitwarangal.nitw.edu:7151
export CORE_PEER_TLS_ROOTCERT_FILE=./organizations/peerOrganizations/nitwarangal.nitw.edu/peers/peer1.nitwarangal.nitw.edu/tls/ca.crt
peer channel join -b ./channel-artifacts/academic-records-channel.block

# 10.4 Join all Departments peers
export CORE_PEER_LOCALMSPID=DepartmentsMSP
export CORE_PEER_MSPCONFIGPATH=./organizations/peerOrganizations/departments.nitw.edu/users/Admin@departments.nitw.edu/msp

for PEER_ADDR in \
  "peer0.cse.departments.nitw.edu:9051" \
  "peer0.ece.departments.nitw.edu:9151" \
  "peer0.me.departments.nitw.edu:9251" \
  "peer0.dac.departments.nitw.edu:9351"; do
    export CORE_PEER_ADDRESS=$PEER_ADDR
    export CORE_PEER_TLS_ROOTCERT_FILE=./organizations/peerOrganizations/departments.nitw.edu/peers/${PEER_ADDR%%:*}/tls/ca.crt
    peer channel join -b ./channel-artifacts/academic-records-channel.block
    echo "Joined: $PEER_ADDR"
done

# 10.5 Join Verifier peers
export CORE_PEER_LOCALMSPID=VerifiersMSP
export CORE_PEER_MSPCONFIGPATH=./organizations/peerOrganizations/verifiers.nitw.edu/users/Admin@verifiers.nitw.edu/msp

for PEER_ADDR in \
  "peer0.verifiers.nitw.edu:11051" \
  "peer1.verifiers.nitw.edu:11151"; do
    export CORE_PEER_ADDRESS=$PEER_ADDR
    export CORE_PEER_TLS_ROOTCERT_FILE=./organizations/peerOrganizations/verifiers.nitw.edu/peers/${PEER_ADDR%%:*}/tls/ca.crt
    peer channel join -b ./channel-artifacts/academic-records-channel.block
    echo "Joined: $PEER_ADDR"
done

# 10.6 Set anchor peers (must sign tx with each org admin)
# NITWarangal anchor
export CORE_PEER_LOCALMSPID=NITWarangalMSP
export CORE_PEER_MSPCONFIGPATH=./organizations/peerOrganizations/nitwarangal.nitw.edu/users/Admin@nitwarangal.nitw.edu/msp
export CORE_PEER_ADDRESS=peer0.nitwarangal.nitw.edu:7051
export CORE_PEER_TLS_ROOTCERT_FILE=./organizations/peerOrganizations/nitwarangal.nitw.edu/peers/peer0.nitwarangal.nitw.edu/tls/ca.crt
peer channel update -o orderer1.nitw.edu:7050 -c academic-records-channel \
  -f ./channel-artifacts/NITWarangalMSPanchors.tx --tls --cafile $ORDERER_CA

# Departments anchor
export CORE_PEER_LOCALMSPID=DepartmentsMSP
export CORE_PEER_MSPCONFIGPATH=./organizations/peerOrganizations/departments.nitw.edu/users/Admin@departments.nitw.edu/msp
export CORE_PEER_ADDRESS=peer0.cse.departments.nitw.edu:9051
export CORE_PEER_TLS_ROOTCERT_FILE=./organizations/peerOrganizations/departments.nitw.edu/peers/peer0.cse.departments.nitw.edu/tls/ca.crt
peer channel update -o orderer1.nitw.edu:7050 -c academic-records-channel \
  -f ./channel-artifacts/DepartmentsMSPanchors.tx --tls --cafile $ORDERER_CA

# Verifiers anchor
export CORE_PEER_LOCALMSPID=VerifiersMSP
export CORE_PEER_MSPCONFIGPATH=./organizations/peerOrganizations/verifiers.nitw.edu/users/Admin@verifiers.nitw.edu/msp
export CORE_PEER_ADDRESS=peer0.verifiers.nitw.edu:11051
export CORE_PEER_TLS_ROOTCERT_FILE=./organizations/peerOrganizations/verifiers.nitw.edu/peers/peer0.verifiers.nitw.edu/tls/ca.crt
peer channel update -o orderer1.nitw.edu:7050 -c academic-records-channel \
  -f ./channel-artifacts/VerifiersMSPanchors.tx --tls --cafile $ORDERER_CA

echo "All peers joined and anchors set!"

# ============================================================
# PHASE 11 — DEPLOY CHAINCODE [NODE04 — Admin]
# ============================================================

cd ~/nitw/Academic_RecordsBlockchain
source env.sh

# 11.1 Package chaincode (only once)
peer lifecycle chaincode package academic-records.tar.gz \
  --path ./chaincode-go \
  --lang golang \
  --label academic-records_1.0

# 11.2 Install on ALL 8 peers (run once per peer org from NODE04)
# Helper function:
install_cc() {
  local MSP=$1; local MSP_PATH=$2; local PEER_ADDR=$3; local TLS_CERT=$4
  export CORE_PEER_LOCALMSPID=$MSP
  export CORE_PEER_MSPCONFIGPATH=$MSP_PATH
  export CORE_PEER_ADDRESS=$PEER_ADDR
  export CORE_PEER_TLS_ROOTCERT_FILE=$TLS_CERT
  peer lifecycle chaincode install academic-records.tar.gz
  echo "Installed on $PEER_ADDR"
}

NITW_MSP=NITWarangalMSP
NITW_ADMIN=./organizations/peerOrganizations/nitwarangal.nitw.edu/users/Admin@nitwarangal.nitw.edu/msp
NITW_TLS_DIR=./organizations/peerOrganizations/nitwarangal.nitw.edu/peers

DEPT_MSP=DepartmentsMSP
DEPT_ADMIN=./organizations/peerOrganizations/departments.nitw.edu/users/Admin@departments.nitw.edu/msp
DEPT_TLS_DIR=./organizations/peerOrganizations/departments.nitw.edu/peers

VERI_MSP=VerifiersMSP
VERI_ADMIN=./organizations/peerOrganizations/verifiers.nitw.edu/users/Admin@verifiers.nitw.edu/msp
VERI_TLS_DIR=./organizations/peerOrganizations/verifiers.nitw.edu/peers

install_cc $NITW_MSP $NITW_ADMIN "peer0.nitwarangal.nitw.edu:7051"      "$NITW_TLS_DIR/peer0.nitwarangal.nitw.edu/tls/ca.crt"
install_cc $NITW_MSP $NITW_ADMIN "peer1.nitwarangal.nitw.edu:7151"      "$NITW_TLS_DIR/peer1.nitwarangal.nitw.edu/tls/ca.crt"
install_cc $DEPT_MSP $DEPT_ADMIN "peer0.cse.departments.nitw.edu:9051"  "$DEPT_TLS_DIR/peer0.cse.departments.nitw.edu/tls/ca.crt"
install_cc $DEPT_MSP $DEPT_ADMIN "peer0.ece.departments.nitw.edu:9151"  "$DEPT_TLS_DIR/peer0.ece.departments.nitw.edu/tls/ca.crt"
install_cc $DEPT_MSP $DEPT_ADMIN "peer0.me.departments.nitw.edu:9251"   "$DEPT_TLS_DIR/peer0.me.departments.nitw.edu/tls/ca.crt"
install_cc $DEPT_MSP $DEPT_ADMIN "peer0.dac.departments.nitw.edu:9351"  "$DEPT_TLS_DIR/peer0.dac.departments.nitw.edu/tls/ca.crt"
install_cc $VERI_MSP $VERI_ADMIN "peer0.verifiers.nitw.edu:11051"       "$VERI_TLS_DIR/peer0.verifiers.nitw.edu/tls/ca.crt"
install_cc $VERI_MSP $VERI_ADMIN "peer1.verifiers.nitw.edu:11151"       "$VERI_TLS_DIR/peer1.verifiers.nitw.edu/tls/ca.crt"

# 11.3 Get Package ID (same on all peers since we used the same tar.gz)
export CORE_PEER_LOCALMSPID=NITWarangalMSP
export CORE_PEER_MSPCONFIGPATH=$NITW_ADMIN
export CORE_PEER_ADDRESS=peer0.nitwarangal.nitw.edu:7051
export CORE_PEER_TLS_ROOTCERT_FILE=$NITW_TLS_DIR/peer0.nitwarangal.nitw.edu/tls/ca.crt
peer lifecycle chaincode queryinstalled
# Copy the Package ID that looks like: academic-records_1.0:abc123...
export CC_PACKAGE_ID="academic-records_1.0:PASTE_HASH_HERE"

# 11.4 Approve chaincode for each org
ORDERER_CA=./organizations/ordererOrganizations/nitw.edu/orderers/orderer1.nitw.edu/msp/tlscacerts/tlsca.nitw.edu-cert.pem

# NITWarangal approves
export CORE_PEER_LOCALMSPID=NITWarangalMSP
export CORE_PEER_MSPCONFIGPATH=$NITW_ADMIN
export CORE_PEER_ADDRESS=peer0.nitwarangal.nitw.edu:7051
export CORE_PEER_TLS_ROOTCERT_FILE=$NITW_TLS_DIR/peer0.nitwarangal.nitw.edu/tls/ca.crt
peer lifecycle chaincode approveformyorg \
  -o orderer1.nitw.edu:7050 --tls --cafile $ORDERER_CA \
  --channelID academic-records-channel \
  --name academic-records --version 1.0 --sequence 1 \
  --package-id $CC_PACKAGE_ID \
  --signature-policy "OR('NITWarangalMSP.peer','DepartmentsMSP.peer','VerifiersMSP.peer')"

# Departments approves
export CORE_PEER_LOCALMSPID=DepartmentsMSP
export CORE_PEER_MSPCONFIGPATH=$DEPT_ADMIN
export CORE_PEER_ADDRESS=peer0.cse.departments.nitw.edu:9051
export CORE_PEER_TLS_ROOTCERT_FILE=$DEPT_TLS_DIR/peer0.cse.departments.nitw.edu/tls/ca.crt
peer lifecycle chaincode approveformyorg \
  -o orderer1.nitw.edu:7050 --tls --cafile $ORDERER_CA \
  --channelID academic-records-channel \
  --name academic-records --version 1.0 --sequence 1 \
  --package-id $CC_PACKAGE_ID \
  --signature-policy "OR('NITWarangalMSP.peer','DepartmentsMSP.peer','VerifiersMSP.peer')"

# Verifiers approves
export CORE_PEER_LOCALMSPID=VerifiersMSP
export CORE_PEER_MSPCONFIGPATH=$VERI_ADMIN
export CORE_PEER_ADDRESS=peer0.verifiers.nitw.edu:11051
export CORE_PEER_TLS_ROOTCERT_FILE=$VERI_TLS_DIR/peer0.verifiers.nitw.edu/tls/ca.crt
peer lifecycle chaincode approveformyorg \
  -o orderer1.nitw.edu:7050 --tls --cafile $ORDERER_CA \
  --channelID academic-records-channel \
  --name academic-records --version 1.0 --sequence 1 \
  --package-id $CC_PACKAGE_ID \
  --signature-policy "OR('NITWarangalMSP.peer','DepartmentsMSP.peer','VerifiersMSP.peer')"

# 11.5 Check commit readiness (all 3 orgs must show true)
peer lifecycle chaincode checkcommitreadiness \
  --channelID academic-records-channel \
  --name academic-records --version 1.0 --sequence 1 --output json \
  --signature-policy "OR('NITWarangalMSP.peer','DepartmentsMSP.peer','VerifiersMSP.peer')"

# 11.6 Commit chaincode (all 3 orgs must sign — include peer-addresses and tls-root-certs for all)
export CORE_PEER_LOCALMSPID=NITWarangalMSP
export CORE_PEER_MSPCONFIGPATH=$NITW_ADMIN
export CORE_PEER_ADDRESS=peer0.nitwarangal.nitw.edu:7051
export CORE_PEER_TLS_ROOTCERT_FILE=$NITW_TLS_DIR/peer0.nitwarangal.nitw.edu/tls/ca.crt

peer lifecycle chaincode commit \
  -o orderer1.nitw.edu:7050 --tls --cafile $ORDERER_CA \
  --channelID academic-records-channel \
  --name academic-records --version 1.0 --sequence 1 \
  --signature-policy "OR('NITWarangalMSP.peer','DepartmentsMSP.peer','VerifiersMSP.peer')" \
  --peerAddresses peer0.nitwarangal.nitw.edu:7051 \
    --tlsRootCertFiles $NITW_TLS_DIR/peer0.nitwarangal.nitw.edu/tls/ca.crt \
  --peerAddresses peer0.cse.departments.nitw.edu:9051 \
    --tlsRootCertFiles $DEPT_TLS_DIR/peer0.cse.departments.nitw.edu/tls/ca.crt \
  --peerAddresses peer0.verifiers.nitw.edu:11051 \
    --tlsRootCertFiles $VERI_TLS_DIR/peer0.verifiers.nitw.edu/tls/ca.crt

# Verify chaincode is committed:
peer lifecycle chaincode querycommitted --channelID academic-records-channel --name academic-records

# 11.7 Initialize the ledger
peer chaincode invoke \
  -o orderer1.nitw.edu:7050 --tls --cafile $ORDERER_CA \
  -C academic-records-channel -n academic-records \
  --peerAddresses peer0.nitwarangal.nitw.edu:7051 \
    --tlsRootCertFiles $NITW_TLS_DIR/peer0.nitwarangal.nitw.edu/tls/ca.crt \
  --peerAddresses peer0.cse.departments.nitw.edu:9051 \
    --tlsRootCertFiles $DEPT_TLS_DIR/peer0.cse.departments.nitw.edu/tls/ca.crt \
  -c '{"function":"InitLedger","Args":[]}'

echo "Chaincode deployed and initialized!"

# ============================================================
# PHASE 12 — START BACKEND [NODES 04-12]
# ============================================================
# Each node runs its own backend with the appropriate .env file.
# The .env file tells it which peer to connect to.

# NODE04 — NITWarangal peer0 (Admin dashboard — ExamSection, Dean, AdminFinal)
cd ~/nitw/Academic-Records-Blockchain-Backend
cp .env.nitwarangal .env
# For multi-host: edit .env and set:
#   GATEWAY_DISCOVERY_AS_LOCALHOST=false
#   CA_URL=https://NODE04_IP:8054
npm install
npm start &
echo "Backend started on NODE04 (port 3000)"

# NODE05 — NITWarangal peer1 (Student portal)
cd ~/nitw/Academic-Records-Blockchain-Backend
cp .env.nitwarangal-peer1 .env
# For multi-host: GATEWAY_DISCOVERY_AS_LOCALHOST=false, CA_URL=https://NODE04_IP:8054
npm install
npm start &
echo "Backend started on NODE05 (port 3001)"

# NODE06 — CSE Department
cd ~/nitw/Academic-Records-Blockchain-Backend
cp .env.cse .env
# For multi-host: GATEWAY_DISCOVERY_AS_LOCALHOST=false, CA_URL=https://NODE06_IP:9054
npm install && npm start &

# NODE07 — ECE
cd ~/nitw/Academic-Records-Blockchain-Backend
cp .env.ece .env
npm install && npm start &

# NODE08 — ME
cd ~/nitw/Academic-Records-Blockchain-Backend
cp .env.me .env
npm install && npm start &

# NODE09 — DAC Committee
cd ~/nitw/Academic-Records-Blockchain-Backend
cp .env.dac .env
npm install && npm start &

# NODE10 — Verifiers peer0
cd ~/nitw/Academic-Records-Blockchain-Backend
cp .env.verifiers .env
npm install && npm start &

# NODE11 — Verifiers peer1
cd ~/nitw/Academic-Records-Blockchain-Backend
cp .env.verifiers-peer1 .env
npm install && npm start &

# NODE12 — Student portal (SDK-only, no peer)
cd ~/nitw/Academic-Records-Blockchain-Backend
cp .env.student-portal .env
# For multi-host: GATEWAY_DISCOVERY_AS_LOCALHOST=false
# CA_URL=https://NODE04_IP:8054   ← points to NITW CA on Node04
npm install && npm start &

# ============================================================
# PHASE 13 — START FRONTEND [EACH MACHINE AS NEEDED]
# ============================================================

# Build once on NODE04, serve everywhere (recommended)
cd ~/nitw/Academic-Records-Blockchain-Frontend
npm install

# For multi-host: set the correct backend API URL for each machine
# In src/environments/environment.ts: apiUrl: 'http://THIS_MACHINE_IP:3000'

npm run build --prod
# Serve with nginx or:
npx serve -s dist/Academic-Records-Blockchain-Frontend -l 4200

# ============================================================
# PHASE 14 — MULTI-HOST env.sh VARIABLES TO SET IN EACH .env
# ============================================================
# After copying .env files, update these on every machine:
#
#   GATEWAY_DISCOVERY_AS_LOCALHOST=false
#   CA_URL=https://<THIS_MACHINES_CA_IP>:<CA_PORT>
#
# Node-to-CA mapping:
#   NODE04, NODE05, NODE12  → CA_URL=https://NODE04_IP:8054   (NITWarangal CA)
#   NODE06, NODE07, NODE08, NODE09 → CA_URL=https://NODE06_IP:9054  (Departments CA)
#   NODE10, NODE11          → CA_URL=https://NODE10_IP:11054  (Verifiers CA)

# ============================================================
# PHASE 15 — ENROLL INITIAL ADMIN USERS [NODE04]
# ============================================================
# After backend starts on NODE04, enroll the admin identity:

cd ~/nitw/Academic-Records-Blockchain-Backend

# This script enrolls admin with the CA and puts identity in the wallet
node src/utils/enrollAdmin.js

# Then create application users for each org on their respective machines.
# (NODE06 runs this for CSE faculty; NODE09 runs for DAC, etc.)

# ============================================================
# PHASE 16 — VERIFY CROSS-MACHINE SYNC
# ============================================================

# Test 1: Create a student from NODE04 (admin)
#   → It should appear when querying from NODE06 (dept) and NODE10 (verifier)

# Test 2: Submit approval from NODE06 (faculty) 
#   → Status should update on NODE04 admin view immediately

# Test 3: Complete the full approval chain:
#   Node06: Faculty Approve  → FACULTY_APPROVED
#   Node06: HOD Approve      → HOD_APPROVED
#   Node09: DAC Approve      → DAC_APPROVED
#   Node04: ExamSection      → EXAM_LOCKED
#   Node04: Dean Approve     → DEAN_APPROVED
#   Node04: Admin Final      → ADMIN_FINALIZED ✓ (CGPA calculated)

# Test 4: Issue certificate from NODE04 → verify from NODE10 or NODE11

# Test 5: Raft HA — shut down NODE02 or NODE03 → transactions should still work

# ============================================================
# TROUBLESHOOTING
# ============================================================
# Problem: "ENDORSEMENT_MISMATCH" or connection refused
#   Fix: Check /etc/hosts on all machines. Hostnames must resolve correctly.
#        Ping peer0.cse.departments.nitw.edu from NODE04.

# Problem: "context deadline exceeded" during peer channel join
#   Fix: The orderer may not be reachable. Check ORDERER1_HOST in env.sh
#        and that port 7050 is open (not blocked by firewall).

# Problem: "Error endorsing transaction: no peers available"
#   Fix: GATEWAY_DISCOVERY_AS_LOCALHOST must be false in .env for multi-host

# Problem: Chaincode container doesn't start
#   Fix: DOCKER_SOCK volume must be mounted. Check docker-compose file has:
#        /var/run/docker.sock:/host/var/run/docker.sock

# Problem: "access denied" wallet errors after restart
#   Fix: Re-enroll admin: node src/utils/enrollAdmin.js
#        Wallets are stored locally and don't survive machine reimages.

# Problem: Crypto material missing after git pull
#   Fix: Crypto material is NEVER committed to git (it's in .gitignore).
#        Always regenerate it with cryptogen or re-run distribute-crypto.sh.

# ============================================================
# IP CHANGE PROCEDURE (if a machine gets a new IP)
# ============================================================
# 1. Update env.sh on NODE01 with the new IP
# 2. Copy env.sh to all machines: scp env.sh user@IP:~/nitw/Academic_RecordsBlockchain/
# 3. Re-run setup-hosts.sh on ALL machines: sudo ./setup-hosts.sh
# 4. Re-run generate-connection-profiles.sh on NODE01, distribute to all
# 5. Restart all Docker containers:
#    docker compose -f docker/docker-compose-NODEFILE.yaml restart
# 6. Restart all backends: npm restart (or pm2 restart all)
# NOTE: No crypto regeneration needed for IP changes.

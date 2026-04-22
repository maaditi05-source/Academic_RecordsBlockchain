# 🖥️ Per-System Step-by-Step Execution Guide

> **IMPORTANT: You must follow these steps IN ORDER. The blockchain network must be fully running BEFORE you start any backend or frontend.**

## Order of Operations

```
1. System 01 generates crypto material
2. Distribute crypto to ALL other systems
3. ALL systems add /etc/hosts entries
4. Start orderer containers (Systems 01, 02, 03) — wait 10 seconds
5. Start peer containers (Systems 04–12)
6. System 01 creates the channel and joins ALL peers
7. System 01 deploys the chaincode
8. THEN start backend servers on each system
9. THEN start frontend (on student portal system)
```

---

## Prerequisites (Run on ALL 12 Systems FIRST)

```bash
# 1. Install Docker
sudo apt-get update
sudo apt-get install -y docker.io docker compose curl git jq build-essential
sudo systemctl start docker && sudo systemctl enable docker
sudo usermod -aG docker $USER
# LOG OUT AND LOG BACK IN after this step

# 2. Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install Go
wget https://go.dev/dl/go1.21.6.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.21.6.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc

# 4. Clone the repository
git clone https://github.com/maaditi05-source/Academic_RecordsBlockchain.git
cd Academic_RecordsBlockchain/Academic_RecordsBlockchain

# 5. Add /etc/hosts entries
sudo bash -c 'cat >> /etc/hosts << EOF
# === Academic Records Blockchain Network ===
172.20.233.222  orderer1.nitw.edu
172.20.242.77   orderer2.nitw.edu
172.20.241.65   orderer3.nitw.edu
172.20.248.26   peer0.nitwarangal.nitw.edu ca-nitwarangal
172.20.238.52   peer1.nitwarangal.nitw.edu
172.20.255.20   peer2.nitwarangal.nitw.edu
172.20.253.70   peer0.cse.departments.nitw.edu ca-departments
172.20.252.35   peer1.cse.departments.nitw.edu
172.20.244.89   peer0.ece.departments.nitw.edu
172.20.235.77   peer1.ece.departments.nitw.edu
172.20.254.157  peer0.verifiers.nitw.edu ca-verifiers
172.20.252.188  peer1.verifiers.nitw.edu
# === END ===
EOF'
```

---

## 💻 SYSTEM 1: Orderer Primary (172.20.233.222)

> ⚠️ **This system must complete ALL steps before other systems can proceed beyond Step 2.**

**Step 1:** Make all scripts executable.
```bash
cd ~/Academic_RecordsBlockchain/Academic_RecordsBlockchain
chmod +x generate-multihost-crypto.sh
chmod +x generate-connection-profiles.sh
chmod +x scripts/registerEnroll.sh
chmod +x scripts/utils.sh
chmod +x join-channel-multihost.sh
```

**Step 2:** Source the environment variables.
```bash
source env.sh
```

**Step 3:** Generate all cryptographic material for the entire network.
```bash
./generate-multihost-crypto.sh
```

**Step 4:** Transfer `multihost-crypto-bundle.tar.gz` to ALL 11 other systems.
```bash
# Option A: SCP (replace user/IP for each system)
scp multihost-crypto-bundle.tar.gz user@172.20.242.77:~/Academic_RecordsBlockchain/Academic_RecordsBlockchain/
scp multihost-crypto-bundle.tar.gz user@172.20.241.65:~/Academic_RecordsBlockchain/Academic_RecordsBlockchain/
scp multihost-crypto-bundle.tar.gz user@172.20.248.26:~/Academic_RecordsBlockchain/Academic_RecordsBlockchain/
scp multihost-crypto-bundle.tar.gz user@172.20.238.52:~/Academic_RecordsBlockchain/Academic_RecordsBlockchain/
scp multihost-crypto-bundle.tar.gz user@172.20.255.20:~/Academic_RecordsBlockchain/Academic_RecordsBlockchain/
scp multihost-crypto-bundle.tar.gz user@172.20.253.70:~/Academic_RecordsBlockchain/Academic_RecordsBlockchain/
scp multihost-crypto-bundle.tar.gz user@172.20.252.35:~/Academic_RecordsBlockchain/Academic_RecordsBlockchain/
scp multihost-crypto-bundle.tar.gz user@172.20.244.89:~/Academic_RecordsBlockchain/Academic_RecordsBlockchain/
scp multihost-crypto-bundle.tar.gz user@172.20.235.77:~/Academic_RecordsBlockchain/Academic_RecordsBlockchain/
scp multihost-crypto-bundle.tar.gz user@172.20.254.157:~/Academic_RecordsBlockchain/Academic_RecordsBlockchain/
scp multihost-crypto-bundle.tar.gz user@172.20.252.188:~/Academic_RecordsBlockchain/Academic_RecordsBlockchain/

# Option B: Use USB drive to transfer the file manually
```

**Step 5:** Start the orderer1 Docker containers.
```bash
source env.sh
docker compose -f docker/docker compose-orderer1.yaml up -d
```

**Step 6:** Wait for ALL other systems (02–12) to confirm their containers are running. Then wait at least 15 seconds for gossip discovery.

**Step 7:** Create the channel and join (System 1 Only).
```bash
docker cp channel-artifacts/academic-records-channel.block orderer1.nitw.edu:/tmp/academic-records-channel.block
docker exec orderer1.nitw.edu osnadmin channel join --channelID academic-records-channel --config-block /tmp/academic-records-channel.block -o 127.0.0.1:7053 --ca-file /var/hyperledger/orderer/tls/ca.crt --client-cert /var/hyperledger/orderer/tls/server.crt --client-key /var/hyperledger/orderer/tls/server.key
```

**Step 8:** Commit the chaincode (Aditi on System 4 runs this ONLY after all 3 orgs approve the chaincode!).

**Step 9:** ONLY after the blockchain is fully running, start the backend on this system (if needed).
```bash
cd ~/Academic_RecordsBlockchain/Academic-Records-Blockchain-Backend
npm install
node src/enrollAdmin.js
npm run dev
```

---

## 💻 SYSTEM 2: Orderer 2 (172.20.242.77)

**Step 1:** Wait to receive `multihost-crypto-bundle.tar.gz` from System 1.

**Step 2:** Extract and start.
```bash
cd ~/Academic_RecordsBlockchain/Academic_RecordsBlockchain
tar -xzvf multihost-crypto-bundle.tar.gz
source env.sh
docker compose -f docker/docker compose-orderer2.yaml up -d
```

**Step 3:** Confirm container is running: `docker ps`. Tell System 1 you are ready.

**Step 4:** Join the channel.
```bash
docker cp channel-artifacts/academic-records-channel.block orderer2.nitw.edu:/tmp/academic-records-channel.block
docker exec orderer2.nitw.edu osnadmin channel join --channelID academic-records-channel --config-block /tmp/academic-records-channel.block -o 127.0.0.1:7053 --ca-file /var/hyperledger/orderer/tls/ca.crt --client-cert /var/hyperledger/orderer/tls/server.crt --client-key /var/hyperledger/orderer/tls/server.key
```

---

## 💻 SYSTEM 3: Orderer 3 (172.20.241.65)

**Step 1:** Wait to receive `multihost-crypto-bundle.tar.gz` from System 1.

**Step 2:** Extract and start.
```bash
cd ~/Academic_RecordsBlockchain/Academic_RecordsBlockchain
tar -xzvf multihost-crypto-bundle.tar.gz
source env.sh
docker compose -f docker/docker compose-orderer3.yaml up -d
```

**Step 3:** Confirm container is running: `docker ps`. Tell System 1 you are ready.

**Step 4:** Join the channel.
```bash
docker cp channel-artifacts/academic-records-channel.block orderer3.nitw.edu:/tmp/academic-records-channel.block
docker exec orderer3.nitw.edu osnadmin channel join --channelID academic-records-channel --config-block /tmp/academic-records-channel.block -o 127.0.0.1:7053 --ca-file /var/hyperledger/orderer/tls/ca.crt --client-cert /var/hyperledger/orderer/tls/server.crt --client-key /var/hyperledger/orderer/tls/server.key
```

---

## 💻 SYSTEM 4: Admin Peer (172.20.248.26)

**Step 1:** Wait to receive `multihost-crypto-bundle.tar.gz` from System 1.

**Step 2:** Extract and start.
```bash
cd ~/Academic_RecordsBlockchain/Academic_RecordsBlockchain
tar -xzvf multihost-crypto-bundle.tar.gz
source env.sh
docker compose -f docker/docker compose-nitwarangal-peer0.yaml up -d
```

**Step 3:** Confirm container is running: `docker ps`. Tell System 1 you are ready.

**Step 4:** Join the network and install chaincode.
```bash
git pull
chmod +x run-cli.sh
./run-cli.sh peer channel join -b /tmp/channel-artifacts/academic-records-channel.block
./run-cli.sh peer lifecycle chaincode install /opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode-go/academic_records_2.0.tar.gz
```

**Step 5:** Start the backend
```bash
cd ~/Academic_RecordsBlockchain/Academic-Records-Blockchain-Backend
npm install
node src/enrollAdmin.js
npm run dev
```

---

## 💻 SYSTEM 5: Exam Section Peer (172.20.238.52)

**Step 1:** Wait to receive `multihost-crypto-bundle.tar.gz` from System 1.

**Step 2:** Extract and start.
```bash
cd ~/Academic_RecordsBlockchain/Academic_RecordsBlockchain
tar -xzvf multihost-crypto-bundle.tar.gz
source env.sh
docker compose -f docker/docker compose-nitwarangal-peer1.yaml up -d
```

**Step 3:** Confirm: `docker ps`. Tell System 1 you are ready.

**Step 4:** Join the network and install chaincode.
```bash
git pull
chmod +x run-cli.sh
./run-cli.sh peer channel join -b /tmp/channel-artifacts/academic-records-channel.block
./run-cli.sh peer lifecycle chaincode install /opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode-go/academic_records_2.0.tar.gz
```

**Step 5:** Start the backend
```bash
cd ~/Academic_RecordsBlockchain/Academic-Records-Blockchain-Backend
npm install
node src/enrollAdmin.js
npm run dev
```

---

## 💻 SYSTEM 6: Dean Academic Peer (172.20.255.20)

**Step 1:** Wait to receive `multihost-crypto-bundle.tar.gz` from System 1.

**Step 2:** Extract and start.
```bash
cd ~/Academic_RecordsBlockchain/Academic_RecordsBlockchain
tar -xzvf multihost-crypto-bundle.tar.gz
source env.sh
docker compose -f docker/docker compose-nitwarangal-peer2.yaml up -d
```

**Step 3:** Confirm: `docker ps`. Tell System 1 you are ready.

**Step 4:** Join the network and install chaincode.
```bash
git pull
chmod +x run-cli.sh
./run-cli.sh peer channel join -b /tmp/channel-artifacts/academic-records-channel.block
./run-cli.sh peer lifecycle chaincode install /opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode-go/academic_records_2.0.tar.gz
```

**Step 5:** Start the backend
```bash
cd ~/Academic_RecordsBlockchain/Academic-Records-Blockchain-Backend
npm install
node src/enrollAdmin.js
npm run dev
```

---

## 💻 SYSTEM 7: CSE HOD Peer (172.20.253.70)

**Step 1:** Wait to receive `multihost-crypto-bundle.tar.gz` from System 1.

**Step 2:** Extract and start.
```bash
cd ~/Academic_RecordsBlockchain/Academic_RecordsBlockchain
tar -xzvf multihost-crypto-bundle.tar.gz
source env.sh
docker compose -f docker/docker compose-depts-cse.yaml up -d
```

**Step 3:** Confirm: `docker ps`. Tell System 1 you are ready.

**Step 4:** Join the network and install chaincode.
```bash
git pull
chmod +x run-cli.sh
./run-cli.sh peer channel join -b /tmp/channel-artifacts/academic-records-channel.block
./run-cli.sh peer lifecycle chaincode install /opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode-go/academic_records_2.0.tar.gz
```

**Step 5:** Start the backend
```bash
cd ~/Academic_RecordsBlockchain/Academic-Records-Blockchain-Backend
npm install
node src/enrollAdmin.js
npm run dev
```

---

## 💻 SYSTEM 8: CSE Faculty Peer (172.20.252.35)

**Step 1:** Wait to receive `multihost-crypto-bundle.tar.gz` from System 1.

**Step 2:** Extract and start.
```bash
cd ~/Academic_RecordsBlockchain/Academic_RecordsBlockchain
tar -xzvf multihost-crypto-bundle.tar.gz
source env.sh
docker compose -f docker/docker compose-depts-cse-faculty.yaml up -d
```

**Step 3:** Confirm: `docker ps`. Tell System 1 you are ready.

**Step 4:** Join the network and install chaincode.
```bash
git pull
chmod +x run-cli.sh
./run-cli.sh peer channel join -b /tmp/channel-artifacts/academic-records-channel.block
./run-cli.sh peer lifecycle chaincode install /opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode-go/academic_records_2.0.tar.gz
```

**Step 5:** Start the backend
```bash
cd ~/Academic_RecordsBlockchain/Academic-Records-Blockchain-Backend
npm install
node src/enrollAdmin.js
npm run dev
```

---

## 💻 SYSTEM 9: ECE HOD Peer (172.20.244.89)

**Step 1:** Wait to receive `multihost-crypto-bundle.tar.gz` from System 1.

**Step 2:** Extract and start.
```bash
cd ~/Academic_RecordsBlockchain/Academic_RecordsBlockchain
tar -xzvf multihost-crypto-bundle.tar.gz
source env.sh
docker compose -f docker/docker compose-depts-ece.yaml up -d
```

**Step 3:** Confirm: `docker ps`. Tell System 1 you are ready.

**Step 4:** Join the network and install chaincode.
```bash
git pull
chmod +x run-cli.sh
./run-cli.sh peer channel join -b /tmp/channel-artifacts/academic-records-channel.block
./run-cli.sh peer lifecycle chaincode install /opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode-go/academic_records_2.0.tar.gz
```

**Step 5:** Start the backend
```bash
cd ~/Academic_RecordsBlockchain/Academic-Records-Blockchain-Backend
npm install
node src/enrollAdmin.js
npm run dev
```

---

## 💻 SYSTEM 10: ECE Faculty Peer (172.20.235.77)

**Step 1:** Wait to receive `multihost-crypto-bundle.tar.gz` from System 1.

**Step 2:** Extract and start.
```bash
cd ~/Academic_RecordsBlockchain/Academic_RecordsBlockchain
tar -xzvf multihost-crypto-bundle.tar.gz
source env.sh
docker compose -f docker/docker compose-depts-ece-faculty.yaml up -d
```

**Step 3:** Confirm: `docker ps`. Tell System 1 you are ready.

**Step 4:** Join the network and install chaincode.
```bash
git pull
chmod +x run-cli.sh
./run-cli.sh peer channel join -b /tmp/channel-artifacts/academic-records-channel.block
./run-cli.sh peer lifecycle chaincode install /opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode-go/academic_records_2.0.tar.gz
```

**Step 5:** Start the backend
```bash
cd ~/Academic_RecordsBlockchain/Academic-Records-Blockchain-Backend
npm install
node src/enrollAdmin.js
npm run dev
```

---

## 💻 SYSTEM 11: Primary Verifier Peer (172.20.254.157)

**Step 1:** Wait to receive `multihost-crypto-bundle.tar.gz` from System 1.

**Step 2:** Extract and start.
```bash
cd ~/Academic_RecordsBlockchain/Academic_RecordsBlockchain
tar -xzvf multihost-crypto-bundle.tar.gz
source env.sh
docker compose -f docker/docker compose-verifiers-peer0.yaml up -d
```

**Step 3:** Confirm: `docker ps`. Tell System 1 you are ready.

**Step 4:** Join the network and install chaincode.
```bash
git pull
chmod +x run-cli.sh
./run-cli.sh peer channel join -b /tmp/channel-artifacts/academic-records-channel.block
./run-cli.sh peer lifecycle chaincode install /opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode-go/academic_records_2.0.tar.gz
```

**Step 5:** Start the backend
```bash
cd ~/Academic_RecordsBlockchain/Academic-Records-Blockchain-Backend
npm install
node src/enrollAdmin.js
npm run dev
```

---

## 💻 SYSTEM 12: Secondary Verifier Peer (172.20.252.188)

**Step 1:** Wait to receive `multihost-crypto-bundle.tar.gz` from System 1.

**Step 2:** Extract and start.
```bash
cd ~/Academic_RecordsBlockchain/Academic_RecordsBlockchain
tar -xzvf multihost-crypto-bundle.tar.gz
source env.sh
docker compose -f docker/docker compose-verifiers-peer1.yaml up -d
```

**Step 3:** Confirm: `docker ps`. Tell System 1 you are ready.

**Step 4:** Join the network and install chaincode.
```bash
git pull
chmod +x run-cli.sh
./run-cli.sh peer channel join -b /tmp/channel-artifacts/academic-records-channel.block
./run-cli.sh peer lifecycle chaincode install /opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode-go/academic_records_2.0.tar.gz
```

**Step 5:** Start the backend
```bash
cd ~/Academic_RecordsBlockchain/Academic-Records-Blockchain-Backend
npm install
node src/enrollAdmin.js
npm run dev
```

---

## 🔎 Verification Checklist

After ALL containers are running and chaincode is deployed, verify from System 1:

```bash
# Check all containers are healthy
docker ps

# Check peer has joined the channel
peer channel list

# Test chaincode query
peer chaincode query -C academic-records-channel -n academic-records -c '{"Args":["GetAllRecords"]}'
```

## ❓ Troubleshooting

| Problem | Solution |
|---------|----------|
| `Permission denied` on scripts | `chmod +x <script-name>.sh` |
| `No such file or directory` for certs | Ensure you ran `tar -xzvf multihost-crypto-bundle.tar.gz` |
| `Cannot connect to peer` | Check `/etc/hosts` entries and `docker ps` on that system |
| `ENDORSEMENT_POLICY_FAILURE` | Ensure chaincode is installed on ALL 9 peers |
| Container crashes immediately | Run `docker logs <container-name>` to see the error |

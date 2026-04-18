# 🚀 DO THIS NOW — Current Step-by-Step Guide
> **Package ID (copy this exactly):**  
> `academic_records_2.0:ad101ee57747b7dc6a99e189508af0b48ab4513abcd1c6296a8234e963796e81`

---

## 🔵 SYSTEMS 1, 2, 3 — Orderers (Bhargav, Nithin, Rahul)

**Goal: Join the Raft channel.**

### System 1 (Bhargav — orderer1):
```bash
docker cp channel-artifacts/academic-records-channel.block orderer1.nitw.edu:/tmp/academic-records-channel.block
docker exec orderer1.nitw.edu osnadmin channel join --channelID academic-records-channel --config-block /tmp/academic-records-channel.block -o 127.0.0.1:7053 --ca-file /var/hyperledger/orderer/tls/ca.crt --client-cert /var/hyperledger/orderer/tls/server.crt --client-key /var/hyperledger/orderer/tls/server.key
```

### System 2 (Nithin — orderer2):
```bash
docker cp channel-artifacts/academic-records-channel.block orderer2.nitw.edu:/tmp/academic-records-channel.block
docker exec orderer2.nitw.edu osnadmin channel join --channelID academic-records-channel --config-block /tmp/academic-records-channel.block -o 127.0.0.1:7053 --ca-file /var/hyperledger/orderer/tls/ca.crt --client-cert /var/hyperledger/orderer/tls/server.crt --client-key /var/hyperledger/orderer/tls/server.key
```

### System 3 (Rahul — orderer3):
```bash
docker cp channel-artifacts/academic-records-channel.block orderer3.nitw.edu:/tmp/academic-records-channel.block
docker exec orderer3.nitw.edu osnadmin channel join --channelID academic-records-channel --config-block /tmp/academic-records-channel.block -o 127.0.0.1:7053 --ca-file /var/hyperledger/orderer/tls/ca.crt --client-cert /var/hyperledger/orderer/tls/server.crt --client-key /var/hyperledger/orderer/tls/server.key
```
> ✅ Done? Tell System 4 (Aditi) "orderers ready"

---

## 🟢 ALL PEER SYSTEMS (4–12) — Same 4 Steps

> ⚠️ **First, get the channel block from System 1 (Bhargav):**
> Ask Bhargav to run this on his machine, then send you the file or SCP it:
> ```bash
> # Bhargav sends the block to your IP — replace YOUR_IP and YOUR_USER
> scp channel-artifacts/academic-records-channel.block YOUR_USER@YOUR_IP:~/Academic_RecordsBlockchain/Academic_RecordsBlockchain/channel-artifacts/
> ```

### Step 1 — Pull latest code
```bash
cd ~/Academic_RecordsBlockchain/Academic_RecordsBlockchain
git pull
chmod +x run-cli.sh
```

### Step 2 — Join the channel
```bash
./run-cli.sh peer channel join -b /tmp/channel-artifacts/academic-records-channel.block
```
Expected output: `Successfully submitted proposal to join channel`

### Step 3 — Install chaincode
```bash
./run-cli.sh peer lifecycle chaincode install /opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode-go/academic_records_2.0.tar.gz
```
Expected output: `Chaincode code package identifier: academic_records_2.0:ad101ee...`

### Step 4 — Verify (optional)
```bash
./run-cli.sh peer lifecycle chaincode queryinstalled
```

---

## 🟡 APPROVE — Only 1 System Per Organization

Run this on **System 4** (NITWarangal), **System 7** (CSE HOD = Departments), **System 11** (Verifier).

```bash
./run-cli.sh peer lifecycle chaincode approveformyorg \
  -o orderer1.nitw.edu:7050 \
  --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/nitw.edu/orderers/orderer1.nitw.edu/tls/ca.crt \
  --channelID academic-records-channel \
  --name academic-records \
  --version 2.0 \
  --package-id academic_records_2.0:ad101ee57747b7dc6a99e189508af0b48ab4513abcd1c6296a8234e963796e81 \
  --sequence 1 \
  --collections-config /opt/gopath/src/github.com/hyperledger/fabric/peer/collections_config.json
```
Expected output: `Approved chaincode definition for channel 'academic-records-channel'`

> ✅ Systems 4, 7, 11 — tell Aditi when done.

---

## 🔴 COMMIT — System 4 Only (Aditi) — Do this LAST

**Run this ONLY after Systems 4, 7, and 11 have all successfully approved.**

```bash
./run-cli.sh peer lifecycle chaincode commit \
  -o orderer1.nitw.edu:7050 \
  --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/nitw.edu/orderers/orderer1.nitw.edu/tls/ca.crt \
  --channelID academic-records-channel \
  --name academic-records \
  --version 2.0 \
  --sequence 1 \
  --collections-config /opt/gopath/src/github.com/hyperledger/fabric/peer/collections_config.json \
  --peerAddresses peer0.nitwarangal.nitw.edu:7051 \
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/nitwarangal.nitw.edu/peers/peer0.nitwarangal.nitw.edu/tls/ca.crt \
  --peerAddresses peer0.cse.departments.nitw.edu:9051 \
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/departments.nitw.edu/peers/peer0.cse.departments.nitw.edu/tls/ca.crt \
  --peerAddresses peer0.verifiers.nitw.edu:11051 \
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/verifiers.nitw.edu/peers/peer0.verifiers.nitw.edu/tls/ca.crt
```
Expected output: `Chaincode definition committed on channel 'academic-records-channel'`

---

## ✅ VERIFY — Chaincode Is Live (System 4)
```bash
./run-cli.sh peer lifecycle chaincode querycommitted --channelID academic-records-channel --name academic-records
```

🎉 **If you see the chaincode listed — the blockchain is LIVE!**

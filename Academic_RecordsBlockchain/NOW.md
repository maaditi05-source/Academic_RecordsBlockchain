# 🚀 COLD START — Complete Step-by-Step (April 19, 2026)

> **All systems were shut down. Follow this guide IN ORDER.**
>
> **Package ID:** `academic_records_2.0:ad101ee57747b7dc6a99e189508af0b48ab4513abcd1c6296a8234e963796e81`

---

## ⚡ PHASE 0 — Everyone (All 12 Systems)

**Make sure `/etc/hosts` has these entries** (skip if already added):
```bash
sudo bash -c 'cat >> /etc/hosts << EOF
# === Academic Records Blockchain Network ===
172.20.233.222  orderer1.nitw.edu
172.20.242.77   orderer2.nitw.edu
172.20.241.65   orderer3.nitw.edu
172.20.229.166  peer0.nitwarangal.nitw.edu
172.20.238.52   peer1.nitwarangal.nitw.edu
172.20.255.20   peer2.nitwarangal.nitw.edu
172.20.247.9    peer0.cse.departments.nitw.edu
172.20.252.35   peer1.cse.departments.nitw.edu
172.20.244.89   peer0.ece.departments.nitw.edu
172.20.235.77   peer1.ece.departments.nitw.edu
172.20.254.157  peer0.verifiers.nitw.edu
172.20.252.188  peer1.verifiers.nitw.edu
# === END ===
EOF'
```

**Verify** (should show `172.20.x.x`, NOT `172.18.x.x`):
```bash
grep "nitw.edu" /etc/hosts
```

---

## 🔵 PHASE 1 — Start Orderers (Systems 1, 2, 3)

> **Do this FIRST. Peers cannot work without orderers.**

### System 1 — Bhargav (orderer1):
```bash
cd ~/Academic_RecordsBlockchain/Academic_RecordsBlockchain
git pull
source env.sh
docker compose -f docker/docker-compose-orderer1.yaml down -v
docker compose -f docker/docker-compose-orderer1.yaml up -d
docker ps   # Should show orderer1.nitw.edu + ca_orderer
```

### System 2 — Atul (orderer2):
```bash
cd ~/Academic_RecordsBlockchain/Academic_RecordsBlockchain
git pull
source env.sh
docker compose -f docker/docker-compose-orderer2.yaml down -v
docker compose -f docker/docker-compose-orderer2.yaml up -d
docker ps   # Should show orderer2.nitw.edu
```

### System 3 — Vindhya (orderer3):
```bash
cd ~/Academic_RecordsBlockchain/Academic_RecordsBlockchain
git pull
source env.sh
docker compose -f docker/docker-compose-orderer3.yaml down -v
docker compose -f docker/docker-compose-orderer3.yaml up -d
docker ps   # Should show orderer3.nitw.edu
```

> ⏳ **Wait 10 seconds** for orderers to initialize.

---

## 🔵 PHASE 2 — Join Orderers to Channel (Systems 1, 2, 3)

> **All 3 must complete this before any peer can transact.**

### System 1 — Bhargav:
```bash
docker run --rm --network host \
  -v $(pwd)/channel-artifacts:/tmp/channel-artifacts \
  -v $(pwd)/organizations:/organizations \
  hyperledger/fabric-tools:2.5 \
  osnadmin channel join --channelID academic-records-channel \
  --config-block /tmp/channel-artifacts/academic-records-channel.block \
  -o localhost:7053 \
  --ca-file /organizations/ordererOrganizations/nitw.edu/orderers/orderer1.nitw.edu/tls/ca.crt \
  --client-cert /organizations/ordererOrganizations/nitw.edu/orderers/orderer1.nitw.edu/tls/server.crt \
  --client-key /organizations/ordererOrganizations/nitw.edu/orderers/orderer1.nitw.edu/tls/server.key
```

### System 2 — Atul:
```bash
docker run --rm --network host \
  -v $(pwd)/channel-artifacts:/tmp/channel-artifacts \
  -v $(pwd)/organizations:/organizations \
  hyperledger/fabric-tools:2.5 \
  osnadmin channel join --channelID academic-records-channel \
  --config-block /tmp/channel-artifacts/academic-records-channel.block \
  -o localhost:8053 \
  --ca-file /organizations/ordererOrganizations/nitw.edu/orderers/orderer2.nitw.edu/tls/ca.crt \
  --client-cert /organizations/ordererOrganizations/nitw.edu/orderers/orderer2.nitw.edu/tls/server.crt \
  --client-key /organizations/ordererOrganizations/nitw.edu/orderers/orderer2.nitw.edu/tls/server.key
```

### System 3 — Vindhya:
```bash
docker run --rm --network host \
  -v $(pwd)/channel-artifacts:/tmp/channel-artifacts \
  -v $(pwd)/organizations:/organizations \
  hyperledger/fabric-tools:2.5 \
  osnadmin channel join --channelID academic-records-channel \
  --config-block /tmp/channel-artifacts/academic-records-channel.block \
  -o localhost:9053 \
  --ca-file /organizations/ordererOrganizations/nitw.edu/orderers/orderer3.nitw.edu/tls/ca.crt \
  --client-cert /organizations/ordererOrganizations/nitw.edu/orderers/orderer3.nitw.edu/tls/server.crt \
  --client-key /organizations/ordererOrganizations/nitw.edu/orderers/orderer3.nitw.edu/tls/server.key
```

✅ **Expected output:** `"status":"active"` — means Raft leader elected!

> ⏳ **Wait 15 seconds** for Raft leader election. Bhargav can verify:
> ```bash
> docker logs orderer1.nitw.edu 2>&1 | grep -i "leader"
> ```
> Should see: `Raft leader changed: 0 -> X`

---

## 🟢 PHASE 3 — Start Peers (Systems 4–12)

> **Do this ONLY after orderers are running and joined.**

Each system starts their container:

| System | Command |
|--------|---------|
| **4 (Aditi)** | `source env.sh && docker compose -f docker/docker-compose-nitwarangal-peer0.yaml down -v && docker compose -f docker/docker-compose-nitwarangal-peer0.yaml up -d` |
| **5** | `source env.sh && docker compose -f docker/docker-compose-nitwarangal-peer1.yaml down -v && docker compose -f docker/docker-compose-nitwarangal-peer1.yaml up -d` |
| **6** | `source env.sh && docker compose -f docker/docker-compose-nitwarangal-peer2.yaml down -v && docker compose -f docker/docker-compose-nitwarangal-peer2.yaml up -d` |
| **7 (CSE HOD)** | `source env.sh && docker compose -f docker/docker-compose-depts-cse.yaml down -v && docker compose -f docker/docker-compose-depts-cse.yaml up -d` |
| **8** | `source env.sh && docker compose -f docker/docker-compose-depts-cse-faculty.yaml down -v && docker compose -f docker/docker-compose-depts-cse-faculty.yaml up -d` |
| **9** | `source env.sh && docker compose -f docker/docker-compose-depts-ece.yaml down -v && docker compose -f docker/docker-compose-depts-ece.yaml up -d` |
| **10** | `source env.sh && docker compose -f docker/docker-compose-depts-ece-faculty.yaml down -v && docker compose -f docker/docker-compose-depts-ece-faculty.yaml up -d` |
| **11 (Verifier)** | `source env.sh && docker compose -f docker/docker-compose-verifiers-peer0.yaml down -v && docker compose -f docker/docker-compose-verifiers-peer0.yaml up -d` |
| **12** | `source env.sh && docker compose -f docker/docker-compose-verifiers-peer1.yaml down -v && docker compose -f docker/docker-compose-verifiers-peer1.yaml up -d` |

Everyone: `docker ps` — verify your peer + couchdb are "Up".

---

## 🟢 PHASE 4 — Join Peers to Channel (Systems 4–12)

> **Everyone runs these same commands:**

```bash
cd ~/Academic_RecordsBlockchain/Academic_RecordsBlockchain
git pull
chmod +x run-cli.sh
./run-cli.sh peer channel join -b /tmp/channel-artifacts/academic-records-channel.block
```

✅ Expected: `Successfully submitted proposal to join channel`
*(If it says "already exists" — that's fine, skip to Phase 5)*

---

## 🟢 PHASE 5 — Install Chaincode (Systems 4–12)

```bash
./run-cli.sh peer lifecycle chaincode install /opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode-go/academic_records_2.0.tar.gz
```

✅ Expected: `Chaincode code package identifier: academic_records_2.0:ad101ee...`
*(If "already installed" — that's fine, skip to Phase 6)*

---

## 🟡 PHASE 6 — Approve Chaincode (Systems 4, 7, 11 ONLY)

> **Only 1 system per organization approves!**
> - System 4 (Aditi) → NITWarangalMSP
> - System 7 (CSE HOD) → DepartmentsMSP
> - System 11 (Verifier) → VerifiersMSP

```bash
./run-cli.sh peer lifecycle chaincode approveformyorg \
  -o orderer1.nitw.edu:7050 \
  --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/nitw.edu/orderers/orderer1.nitw.edu/tls/ca.crt \
  --channelID academic-records-channel \
  --name academic-records \
  --version 2.0 \
  --package-id academic_records_2.0:ad101ee57747b7dc6a99e189508af0b48ab4513abcd1c6296a8234e963796e81 \
  --sequence 1 \
  --collections-config /opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode-go/../collections_config.json
```

✅ Expected: No error output = success!

> ⏳ **Wait for all 3 to confirm before proceeding.**

---

## 🔴 PHASE 7 — Commit Chaincode (System 4 ONLY — Aditi)

> **Run this ONLY after Systems 4, 7, and 11 have all approved.**

```bash
./run-cli.sh peer lifecycle chaincode commit \
  -o orderer1.nitw.edu:7050 \
  --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/nitw.edu/orderers/orderer1.nitw.edu/tls/ca.crt \
  --channelID academic-records-channel \
  --name academic-records \
  --version 2.0 \
  --sequence 1 \
  --collections-config /opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode-go/../collections_config.json \
  --peerAddresses peer0.nitwarangal.nitw.edu:7051 \
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/nitwarangal.nitw.edu/peers/peer0.nitwarangal.nitw.edu/tls/ca.crt \
  --peerAddresses peer0.cse.departments.nitw.edu:9051 \
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/departments.nitw.edu/peers/peer0.cse.departments.nitw.edu/tls/ca.crt \
  --peerAddresses peer0.verifiers.nitw.edu:11051 \
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/verifiers.nitw.edu/peers/peer0.verifiers.nitw.edu/tls/ca.crt
```

✅ Expected: `Chaincode definition committed on channel 'academic-records-channel'`

---

## ✅ PHASE 8 — Verify (System 4)

```bash
./run-cli.sh peer lifecycle chaincode querycommitted --channelID academic-records-channel --name academic-records
```

🎉 **If you see the chaincode listed — THE BLOCKCHAIN IS LIVE!**

---

## ❓ Troubleshooting

| Error | Fix |
|-------|-----|
| `no Raft leader` | Wait 15s. If persists, check orderer logs: `docker logs orderer1.nitw.edu` |
| `channel already exists` on orderer join | That's OK — orderer already joined |
| `ledger already exists` on peer join | That's OK — peer already joined |
| `already installed` | That's OK — chaincode already installed |
| `connection refused` | Check `/etc/hosts` has correct `172.20.x.x` IPs, not `172.18.x.x` |
| `certificate signed by unknown authority` | Missing `/etc/hosts` entries |
| `Cannot find active peer containers` | Run `docker compose up -d` first |
| `no such file collections_config.json` | Use the path with `chaincode-go/../collections_config.json` |

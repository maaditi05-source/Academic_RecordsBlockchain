# 🖥️ Post-Clone Execution Guide: System By System

> **Prerequisites:** 
> 1. You have cloned the repository on all 12 computers.
> 2. You have installed Docker, Docker-Compose, Node.js, and Go on all computers.
> 3. Your terminals on all computers are currently opened inside the `Academic_RecordsBlockchain` folder.

All computers must append this exact block to their `/etc/hosts` file (run `sudo nano /etc/hosts`):
```text
# === Academic Records Blockchain Network ===
172.20.242.77   orderer1.nitw.edu
172.20.233.222  orderer2.nitw.edu
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
```

---

## 💻 SYSTEM 1: Orderer Primary (172.20.242.77)
*You must start with this system first.*

1. **Step 1:** Generate all cryptographic keys for the entire network.
   ```bash
   ./generate-multihost-crypto.sh
   ```
2. **Step 2:** Securely transfer the resulting `multihost-crypto-bundle.tar.gz` file to **all 11 other systems** via USB, Email, or SCP.
3. **Step 3:** Start your Docker container.
   ```bash
   docker-compose -f docker/docker-compose-orderer1.yaml up -d
   ```
4. **Step 4:** **PAUSE.** Wait for the operators of Systems 2 through 12 to complete their steps and confirm their containers are running.
5. **Step 5:** Once all 12 systems are running, initialize the blockchain channel and deploy the smart contracts across the network:
   ```bash
   ./join-channel-multihost.sh
   ```

---

## 💻 SYSTEM 2: Orderer 2 (172.20.233.222)
1. **Step 1:** Wait to receive `multihost-crypto-bundle.tar.gz` from System 1. Place it in your cloned folder.
2. **Step 2:** Extract the crypto materials.
   ```bash
   tar -xzvf multihost-crypto-bundle.tar.gz
   ```
3. **Step 3:** Start your Docker container.
   ```bash
   docker-compose -f docker/docker-compose-orderer2.yaml up -d
   ```
4. **Step 4:** Inform System 1 that you are online.

---

## 💻 SYSTEM 3: Orderer 3 (172.20.241.65)
1. **Step 1:** Wait to receive `multihost-crypto-bundle.tar.gz` from System 1. Place it in your cloned folder.
2. **Step 2:** Extract the crypto materials.
   ```bash
   tar -xzvf multihost-crypto-bundle.tar.gz
   ```
3. **Step 3:** Start your Docker container.
   ```bash
   docker-compose -f docker/docker-compose-orderer3.yaml up -d
   ```
4. **Step 4:** Inform System 1 that you are online.

---

## 💻 SYSTEM 4: Admin Peer (172.20.229.166)
1. **Step 1:** Wait to receive `multihost-crypto-bundle.tar.gz` from System 1.
2. **Step 2:** Extract the materials.
   ```bash
   tar -xzvf multihost-crypto-bundle.tar.gz
   ```
3. **Step 3:** Start your Docker container.
   ```bash
   docker-compose -f docker/docker-compose-nitwarangal-peer0.yaml up -d
   ```
4. **Step 4:** Inform System 1 that you are online, and wait for System 1 to run the network setup script.
5. **Step 5:** Once System 1 confirms the setup is complete, start your backend server:
   ```bash
   cd ../Academic-Records-Blockchain-Backend
   npm install
   node src/enrollAdmin.js
   npm run dev
   ```

---

## 💻 SYSTEM 5: Exam Section Peer (172.20.238.52)
1. **Step 1:** Transfer and extract crypto bundle:
   ```bash
   tar -xzvf multihost-crypto-bundle.tar.gz
   ```
2. **Step 2:** Start your Docker container:
   ```bash
   docker-compose -f docker/docker-compose-nitwarangal-peer1.yaml up -d
   ```
3. **Step 3:** Wait for System 1 network setup, then start backend:
   ```bash
   cd ../Academic-Records-Blockchain-Backend
   npm install
   node src/enrollAdmin.js
   npm run dev
   ```

---

## 💻 SYSTEM 6: Dean Academic Peer (172.20.255.20)
1. **Step 1:** Transfer and extract crypto bundle:
   ```bash
   tar -xzvf multihost-crypto-bundle.tar.gz
   ```
2. **Step 2:** Start your Docker container:
   ```bash
   docker-compose -f docker/docker-compose-nitwarangal-peer2.yaml up -d
   ```
3. **Step 3:** Wait for System 1 network setup, then start backend:
   ```bash
   cd ../Academic-Records-Blockchain-Backend
   npm install
   node src/enrollAdmin.js
   npm run dev
   ```

---

## 💻 SYSTEM 7: CSE HOD Peer (172.20.247.9)
1. **Step 1:** Transfer and extract crypto bundle:
   ```bash
   tar -xzvf multihost-crypto-bundle.tar.gz
   ```
2. **Step 2:** Start your Docker container:
   ```bash
   docker-compose -f docker/docker-compose-depts-cse.yaml up -d
   ```
3. **Step 3:** Wait for System 1 network setup, then start backend:
   ```bash
   cd ../Academic-Records-Blockchain-Backend
   npm install
   node src/enrollAdmin.js
   npm run dev
   ```

---

## 💻 SYSTEM 8: CSE Faculty Peer (172.20.252.32)
1. **Step 1:** Transfer and extract crypto bundle:
   ```bash
   tar -xzvf multihost-crypto-bundle.tar.gz
   ```
2. **Step 2:** Start your Docker container:
   ```bash
   docker-compose -f docker/docker-compose-depts-cse-faculty.yaml up -d
   ```
3. **Step 3:** Wait for System 1 network setup, then start backend:
   ```bash
   cd ../Academic-Records-Blockchain-Backend
   npm install
   node src/enrollAdmin.js
   npm run dev
   ```

---

## 💻 SYSTEM 9: ECE HOD Peer (172.20.244.81)
1. **Step 1:** Transfer and extract crypto bundle:
   ```bash
   tar -xzvf multihost-crypto-bundle.tar.gz
   ```
2. **Step 2:** Start your Docker container:
   ```bash
   docker-compose -f docker/docker-compose-depts-ece.yaml up -d
   ```
3. **Step 3:** Wait for System 1 network setup, then start backend:
   ```bash
   cd ../Academic-Records-Blockchain-Backend
   npm install
   node src/enrollAdmin.js
   npm run dev
   ```

---

## 💻 SYSTEM 10: ECE Faculty Peer (172.20.235.77)
1. **Step 1:** Transfer and extract crypto bundle:
   ```bash
   tar -xzvf multihost-crypto-bundle.tar.gz
   ```
2. **Step 2:** Start your Docker container:
   ```bash
   docker-compose -f docker/docker-compose-depts-ece-faculty.yaml up -d
   ```
3. **Step 3:** Wait for System 1 network setup, then start backend:
   ```bash
   cd ../Academic-Records-Blockchain-Backend
   npm install
   node src/enrollAdmin.js
   npm run dev
   ```

---

## 💻 SYSTEM 11: Primary Verifier Peer (172.20.254.157)
1. **Step 1:** Transfer and extract crypto bundle:
   ```bash
   tar -xzvf multihost-crypto-bundle.tar.gz
   ```
2. **Step 2:** Start your Docker container:
   ```bash
   docker-compose -f docker/docker-compose-verifiers-peer0.yaml up -d
   ```
3. **Step 3:** Wait for System 1 network setup, then start backend:
   ```bash
   cd ../Academic-Records-Blockchain-Backend
   npm install
   node src/enrollAdmin.js
   npm run dev
   ```

---

## 💻 SYSTEM 12: Secondary Verifier Peer (172.20.252.188)
1. **Step 1:** Transfer and extract crypto bundle:
   ```bash
   tar -xzvf multihost-crypto-bundle.tar.gz
   ```
2. **Step 2:** Start your Docker container:
   ```bash
   docker-compose -f docker/docker-compose-verifiers-peer1.yaml up -d
   ```
3. **Step 3:** Wait for System 1 network setup, then start backend:
   ```bash
   cd ../Academic-Records-Blockchain-Backend
   npm install
   node src/enrollAdmin.js
   npm run dev
   ```

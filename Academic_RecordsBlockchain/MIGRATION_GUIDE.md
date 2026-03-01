# System Migration & Setup Guide

If you are moving this project to a new computer or a fresh environment, follow these steps to ensure everything connects correctly.

## 1. Prerequisites (The "Must-Haves")

The system requires **Linux (Ubuntu recommended)** or WSL2 on Windows.

| Component | Required Version | Purpose |
| :--- | :--- | :--- |
| **Docker** | 20.10+ | Runs the Fabric nodes (Peers, Orderers, CAs) |
| **Docker Compose** | 2.0+ | Orchestrates the network containers |
| **Node.js** | v18 or v20 | Runs the Backend server |
| **Angular CLI** | v17+ | Build and serve the Frontend |
| **Go** | 1.21+ | Compiles the Smart Contract (Chaincode) |
| **Git** | Latest | Cloning and version control |

---

## 2. Environment Setup

### Step A: Install Hyperledger Fabric Binaries
You don't just need the code; you need the Fabric tools (`peer`, `configtxgen`, etc.).
```bash
# In your home directory
curl -sSL https://bit.ly/2ysbOCi | bash -s -- 2.5.4 1.5.7
```
This creates a `fabric-samples` folder. Copy the `bin` and `config` folders from there into your project root (`Academic_RecordsBlockchain/`).

### Step B: Configure Backend Paths
The backend needs to know exactly where the Fabric certificates are.
1.  Open `Academic-Records-Blockchain-Backend/.env`
2.  Update `FABRIC_ORG_PATH` and `CONNECTION_PROFILE_PATH` to match your new absolute path (e.g., `/home/username/project/...`).
    > [!IMPORTANT]
    > Avoid using `(copy)` in folder names as it can cause path resolution issues in some SDKs.

---

## 3. First-Time Boot Sequence

Follow this exact order to avoid "Identity Not Found" or "Connection Refused" errors.

### 1. Launch the Blockchain
```bash
cd Academic_RecordsBlockchain/
chmod +x *.sh
./network.sh up
```
*Wait until you see "Chaincode definition committed on channel".*

### 2. Prepare the Backend Wallet
The first time you run on a new system, your unique identity must be registered.
```bash
cd ../Academic-Records-Blockchain-Backend/
npm install
rm -rf wallet/  # Clear any old identities from the old system
npm start
```
*The backend will automatically detect the new network, import the Admin identity, and seed the default students/departments.*

### 3. Launch the Frontend
```bash
cd ../Academic-Records-Blockchain-Frontend/
npm install
ng serve
```

---

## 4. Common "New System" Gotchas

| Issue | Likely Cause | Fix |
| :--- | :--- | :--- |
| **Permission Denied** | Docker needs root or sudo group. | `sudo usermod -aG docker $USER` then logout/login. |
| **Port 3000 busy** | Another Node app is running. | `fuser -k 3000/tcp` |
| **Connection Refused** | Fabric containers aren't healthy. | `docker ps` to ensure 7+ containers are running. |
| **Wrong Path Error** | Your `.env` still has the old username. | Double check absolute paths in `Backend/.env`. |

---

## 5. Deployment Checklist
- [ ] Docker is running.
- [ ] `.env` paths are updated to current absolute directory.
- [ ] `wallet/` folder is deleted before the very first start.
- [ ] Ports `7050`, `7051`, `8054`, `3000`, and `4200` are open.

This guide ensures that any system with the basic dependencies can recreate the exact environment we've built here.

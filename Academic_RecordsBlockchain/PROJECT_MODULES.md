# Academic Records Blockchain — Module Descriptions

---

## Module 1: Registration and Requests

### Person 1 — Identity & Infrastructure Registration
- **Admin** initiates the network by creating **Departments** and **Course Offerings** on the Hyperledger Fabric ledger — each department becomes a permanent, immutable ledger entry
- Admin registers **HODs, Faculty, Dean, and Exam Section** users — each user is issued an **X.509 digital certificate** via the Fabric Certificate Authority (CA), binding their identity cryptographically to the blockchain network
- **Role-Based Identity via Blockchain PKI:** Unlike the original project that used simple username/password authentication, our system uses Hyperledger Fabric's CA to issue X.509 certificates per user — every transaction is cryptographically signed, making impersonation mathematically impossible
- **On-Chain Department & Course Registry:** Departments and courses are registered as **chaincode state objects**, not just database entries — they cannot be silently modified or deleted after creation

### Person 2 — Student Enrollment & Request Submission
- HODs and Admins **enroll Students** onto the ledger — the chaincode function `CreateStudent` writes the student's identity (roll number, department, enrollment year) as a **World State object** on the blockchain, making it tamper-proof
- Students log into the portal and submit **certificate requests** (Bonafide, Transfer, Degree, Marksheets) — each request is recorded with a unique ID, timestamp, and status, entering the multi-tier approval pipeline
- Faculty **upload marks** via batch CSV — the backend parses, validates, and writes each grade entry to the ledger with an initial `submitted` status, triggering the approval state machine
- **On-Chain Duplicate Detection with Composite Keys:** The chaincode uses **composite keys** (e.g., `STUDENT~rollNumber~department`) to enforce uniqueness at the ledger level — the chaincode rejects duplicate registrations before they reach consensus
- **Role-Attribute Verification at Chaincode Level:** Every chaincode function verifies the caller's **X.509 certificate attributes** (role, department, MSP) before executing — a CSE HOD cannot create courses for ECE, enforced at the smart contract layer

### Person 3 — Approval Governance & Resilience
- **Time-Bound Approvals (SLA Enforcement):** Certificate and marks requests carry **timestamps** and the system enforces SLA deadlines — if an approval action is not taken within the predefined time window, the request is automatically flagged as `escalated`
- **Multi-Signature DAC Approval:** For critical academic decisions (degree revocations, consolidated marksheet issuance), the system requires **multi-signature approval from a Departmental Academic Committee (DAC)** — multiple authorized members must independently sign the transaction (2-of-3 quorum) before the chaincode accepts it
- **13-Node Distributed Registration:** Student and faculty registrations are propagated across all 13 peer nodes via the Fabric gossip protocol, ensuring every institution node holds a synchronized copy of the identity registry
- **Offline-Resilient Registration via DataSync:** When the blockchain network is temporarily unavailable, registrations are cached locally using the `dataSync` module and automatically synchronized to the admin node when connectivity is restored

---

## Module 2: Verification and Approval

### What Happens
- **5-tier marks consensus pipeline** enforced by chaincode: `submitted → hod_approved → exam_approved → dean_approved → locked` — once locked, the chaincode permanently rejects any modification attempts
- **Type-specific certificate approval pipelines:**
  - **Bonafide / Transfer:** `pending → hod_approved → dean_approved → issued` (skips Exam Section)
  - **Degree / Marksheets:** `pending → hod_approved → exam_approved → dean_approved → issued`
- Every approval is recorded in an immutable **approvalChain** on the blockchain — a permanent audit trail of who approved, when, and what status resulted


### Novelty Over Original Project
### Automated Academic Integrity (Revocation)
- **Performance Watchdog:** Every time a semester record is locked on-chain, the system recalculates the student's SGPA/CGPA
- **Threshold Enforcement:** If performance falls below a threshold (e.g., CGPA < 5.0), a **Revocation Event** is automatically triggered — marking all previously issued credentials as `REVOKED` on both the blockchain and local databases
- **Verification Impact:** Revoked certificates return *"⚠️ Authentic but INVALID"* during verification — the revocation itself is an immutable blockchain transaction that cannot be silently undone

### PDF-Blockchain Cryptographic Verification
- Every issued PDF is hashed via **SHA-256** and the hash is recorded immutably on the blockchain
- To verify, any user uploads the PDF — the system computes its hash and queries the ledger
- **Three outcomes:**
  - ✅ **Authentic & Valid** — hash matches, certificate is Active
  - ⚠️ **Authentic but Revoked** — hash matches, but certificate has been invalidated
  - ❌ **Fake or Modified** — hash not found on ledger (even a single byte change causes mismatch)


- **Type-Specific State Machine:** Document-type-aware approval routing — Bonafide skips Exam Section, Degree passes through it
- **Chaincode-Enforced Immutability:** `locked` status is enforced at the blockchain consensus layer, not just application logic
- **Automated Revocation Watchdog:** System auto-revokes credentials when academic performance drops below threshold — no manual intervention needed
- **Three-State Verification:** Adds an *Authentic but Revoked* state beyond the original project's simple valid/fake model
- **On-Chain Audit Trail:** Every approval action is a permanent, non-deletable blockchain transaction

---

## Module 3: IPFS Storing and Fetching

### What Happens
- When a certificate is **issued** (final status), the backend dynamically renders a **PDF** using `pdf-lib` containing the student's verified marks, institutional details, and a unique certificate ID
- The generated PDF is uploaded to **IPFS (InterPlanetary File System)** — a decentralized, content-addressed storage network — using a multi-tier fallback strategy:
  1. **Pinata Cloud** (primary) — managed IPFS pinning service for high availability
  2. **Local Kubo Node** (secondary) — self-hosted IPFS daemon running alongside the peer
  3. **Local filesystem** (emergency fallback) — ensures certificates are never lost
- IPFS returns a **Content Identifier (CID)** — a unique cryptographic hash of the file content. Only this CID string (not the 5MB PDF) is committed to the Hyperledger ledger as a blockchain transaction
- When a student or verifier requests a certificate download, the backend fetches the PDF from IPFS using the on-chain CID, streams it to the browser
- **Content addressing guarantees integrity** — if even a single byte of the PDF is modified, the CID changes, and the blockchain will report a hash mismatch during verification

### Novelty Over Original Project
- **Blockchain + IPFS Hybrid Architecture:** The original project stored certificates either entirely on-chain (expensive and slow) or entirely off-chain (no integrity guarantee). Our system stores **only the CID hash on-chain** and the **actual file on IPFS**, achieving both storage efficiency and cryptographic integrity
- **Triple-Fallback IPFS Strategy:** Unlike single-point-of-failure storage, our `ipfsService.js` implements a cascading Pinata → Kubo → Local fallback — if the cloud IPFS fails, the local daemon serves; if that fails, the local filesystem preserves the document
- **Content-Addressed Tamper Detection:** Because IPFS uses content-based addressing (not location-based like HTTP), any modification to a stored certificate automatically produces a different hash — the blockchain's stored CID will no longer match, making forgery self-evident
- **Decentralized File Distribution:** Unlike centralized file servers, IPFS distributes certificate files across multiple nodes — no single institution server can be destroyed to erase academic records

---

## Module 4: Distributed Peer Connection

### What Happens
- The network consists of **13 physical nodes** distributed across different systems, organized into 3 organizations:
  - **NITWarangal Org** (3 peers) — Admin, Exam Section, Dean
  - **Departments Org** (4 peers) — CSE HOD, CSE Faculty, ECE HOD, ECE Faculty
  - **Verifiers Org** (2 peers) — Independent external verifiers
  - **Orderer Cluster** (3 nodes) — Raft consensus for block ordering + 1 Fabric CA
- **Raft consensus** among 3 orderer nodes ensures Byzantine fault tolerance — the network continues operating even if 1 orderer goes down
- Each peer maintains its own **copy of the ledger** and **World State database (CouchDB)** — a transaction is only committed when endorsed by the required number of peers across organizations
- The **Fabric Gossip Protocol** automatically propagates new blocks to all peers across all organizations, keeping ledger state synchronized without manual intervention
- **DataSync module** (`dataSync.js`) implements an application-level data replication layer on top of Fabric — when a remote peer (e.g., HOD's system) writes data, it pushes changes to the Admin node which then synchronizes all other peers
- **Offline resilience via MockState** (`mockState.js`) — if a peer loses connection to the blockchain network, the backend automatically switches to a local JSON-backed offline store, allowing users to continue working. When connectivity is restored, changes are reconciled
- **Peer recovery mechanism** (`recover-peer.sh`) — if a peer crashes or is restarted, the recovery script automatically re-joins it to all channels and re-syncs the full ledger history from other peers

### Novelty Over Original Project
- **True Multi-Machine Deployment:** The original project ran all peers on a single machine via Docker. Our system deploys **13 real nodes across 13 separate physical systems**, demonstrating a production-grade distributed blockchain network
- **Raft-Based Orderer Cluster:** Instead of a single orderer (single point of failure), we deploy a **3-node Raft consensus cluster** — the network can tolerate 1 orderer failure while maintaining block ordering integrity
- **Cross-Organization Endorsement Policy:** Transactions require endorsement from peers in **multiple organizations** (e.g., both NITWarangal and Departments must endorse) — this prevents any single organization from unilaterally modifying records
- **Application-Level DataSync Protocol:** Beyond Fabric's native gossip, we implemented a custom `dataSync` module that replicates off-chain operational data (certificate requests, marks queues) across all 13 nodes using HTTP-based push/pull synchronization
- **Graceful Offline Degradation:** The `mockState` + `fabricGateway` fallback system allows the application to continue functioning during blockchain outages — the original project would crash entirely if the network went down
- **Hot Peer Recovery:** The `recover-peer.sh` script enables crashed peers to automatically rejoin the network and catch up on missed blocks — critical for a 13-node deployment where individual system failures are expected

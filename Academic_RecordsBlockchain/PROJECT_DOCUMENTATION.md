# Academic Records Blockchain — Comprehensive Documentation

This document provides an end-to-end, comprehensive overview of the Academic Records Blockchain system. It explains the architecture, blockchain mechanics, cryptographic hashing, user roles, detailed workflows, and backend operations.

---

## 1. System Architecture

The project follows a standard modern three-tier decentralized architecture:

1.  **Frontend (Angular 17+ Material):** The user interface where different roles interact with the system. It uses HTTP REST calls to communicate with the backend.
2.  **Backend (Node.js & Express):** The middleware that acts as a bridge between the frontend and the blockchain network. It manages user authentication (JWT), file generation (jsPDF), and uses the `fabric-network` Gateway SDK to submit transactions to the blockchain.
3.  **Blockchain Network (Hyperledger Fabric 2.x):** A permissioned, private blockchain network. It consists of:
    *   **Peers:** Nodes that maintain the ledger and run smart contracts (chaincode).
    *   **Orderer:** A node that packages transactions into blocks and distributes them to peers.
    *   **Certificate Authorities (CA):** Issue identity certificates (X.509) to users, allowing them to transact on the network.
    *   **Ledger:** The immutable database storing current states (World State) and the history of all transactions.
4.  **Off-Chain Storage (Local/IPFS):** Large files (like PDF documents) are not stored directly on the blockchain because it is expensive and slow. Instead, they are stored off-chain, and only their cryptographic hash and storage reference (CID) are saved on the blockchain.

---

## 2. Core Hyperledger Fabric Mechanics

### How does Hashing work in this project?
When an academic document (like a degree certificate) is generated and finalized:
1.  **Generation:** The backend generates a PDF document.
2.  **Hashing (SHA-256):** The backend computes a cryptographic hash (a unique digital fingerprint) of the exact PDF file using the SHA-256 algorithm.
3.  **Storage:** The physical PDF file is stored off-chain (in an IPFS-style local store). The computed **Hash**, the off-chain reference (**CID / URI**), and metadata (who issued it, timestamp) are sent to the chaincode.
4.  **Immutability:** The chaincode saves this Hash to the ledger. Once written, it can never be altered or deleted.
5.  **Verification:** When a third-party verifier wants to check a certificate, they upload the PDF. The backend recalculates the SHA-256 hash of the uploaded file and checks if this exact hash exists on the immutable ledger. If a single pixel or character is changed, the hash completely changes, and verification fails.

### How do Fabric Transactions work?
When the backend wants to update data (e.g., approve a record):
1.  **Proposal:** The backend (using the admin wallet identity) sends a transaction proposal to the Peer(s).
2.  **Endorsement:** The Peer runs the Smart Contract (`chaincode.go`). It simulates the changes, signs them to say "this is valid," and sends the endorsement back to the backend.
3.  **Ordering:** The backend collects the endorsement and sends it to the Orderer.
4.  **Commitment:** The Orderer packs it into a block and sends it back to all Peers. The Peers append the block to their local copy of the ledger.

---

## 3. User Roles, Capabilities, and Test Credentials

The system implements strict Role-Based Access Control (RBAC). Both the Node.js backend and the Go chaincode verify rules before executing any action.

| Username | Password | Role | Responsibilities & Capabilities |
| :--- | :--- | :--- | :--- |
| `admin` | `password123` | **Admin** | Manages system. Can view overview statistics, manage user credentials, view all departments and courses. Shares `Upload Marks` capability with Exam Section. |
| `exam_section_demo` | `password123` | **Exam Section** | Uploads raw marks for students. These marks start as "pending". Cannot finalize documents alone. |
| `faculty_demo`<br>`faculty_demo_2` | `password123` | **Faculty** | Logs in to see assigned courses. Reviews "pending" marks uploaded by Exam Section. Verifies them to make them official. |
| `hod_demo` | `password123` | **HOD** | Head of Department. Has faculty capabilities plus department-level overrides and approvals. |
| `dean_academic_demo` | `password123` | **Dean Academic**| Penultimate approver in the certification chain. Validates academic compliance. |
| `dac_member_1`<br>`dac_member_2`| `password123` | **DAC Member** | Departmental Academic Committee. **The final checkpoint**. Triggers final CGPA calculation and digitally signs the record, moving it to `FINALIZED`. |
| `25CSM2R26`<br>`CS21B001`<br>`CS22B002`| `password123` | **Student** | Read-only access to their own profile. Can view verified marks, download generated grade sheets, and request official certificates (Degree, Migration, etc.). | 

*(Note: There are also generic logic units like `CSE` and `MECH` departments representing organizational groupings).*

---

## 4. Distinct Workflows

### A. The Marks Upload & Verification Workflow
1.  **Action:** The **Exam Section** logs in, goes to "Upload Marks", inputs Student Roll No, Course, and marks obtained.
2.  **Backend:** Receives data, auto-calculates letter grades (A+, B, etc.) and grade points, and saves it locally in `data/marks.json` with status `pending`.
3.  **Action:** The **Faculty** assigned to that course logs in and goes to "Verify Marks". They review the pending marks and click "Verify".
4.  **Result:** The mark status changes to `verified`. The student can now see these marks in their dashboard.

### B. The Certificate Request & Approval Workflow
This corresponds exactly to the `roles.pdf` requirements:

1.  **Request:** A **Student** logs into their dashboard and clicks "Request New Certificate" (e.g., Degree Certificate, Transfer Certificate).
2.  **Approval Chain (The order matters):**
    *   *Step 1:* Faculty (Skipped for generic certs, used for direct grade approvals).
    *   *Step 2:* **HOD** reviews and approves. State moves to `HOD_APPROVED`.
    *   *Step 3:* **Exam Section** reviews and locks it. State moves to `EXAM_LOCKED`.
    *   *Step 4:* **Dean Academic** reviews and approves. State moves to `DEAN_APPROVED`.
    *   *Step 5:* **DAC Member** does final validation.
3.  **Finalization:** When the DAC member approves, the chaincode automatically calculates the student's cumulative CGPA, generates the final digital signature, and moves the state to `FINALIZED`. The student can now download the official PDF.

---

## 5. What Happens in the Backend? (Step-by-Step API execution)

Let's trace what happens when Dean Academic approves a certificate:

1.  **HTTP Request:** Frontend sends `PUT /api/certificates/requests/REQ123` with payload `{ status: 'APPROVED' }` and a Bearer JWT Token.
2.  **Auth Middleware (`auth.js`):** Backend extracts the JWT, verifies the cryptographic signature with the `JWT_SECRET`, and extracts the `userId` and `role`.
3.  **Controller Routing:** The request is routed to `approvalController.js -> deanApprove()`.
4.  **Fabric Gateway Setup:** The backend authenticates with the Hyperledger network. It looks in the `wallet/` directory for the cryptographic identity matching the system `admin` (or the specific user).
5.  **Transaction Submission:** The backend executes: `gateway.submitTransaction('DeanAcademicApprove', recordId, comment)`.
6.  **Chaincode Execution:** The Go code inside `chaincode.go` runs. It checks if the current state is `EXAM_LOCKED`. If yes, it updates the state to `DEAN_APPROVED` in the ledger.
7.  **Response & Notifications:** The backend receives a `Success` from the blockchain. It fires a `Socket.io` event to notify the student's frontend in real-time and returns an HTTP 200 JSON response.

---

## 6. System Network Initialization & Auto-Seeding

Because blockchains are intentionally difficult to modify, initializing the network requires a specific flow:

### 1. `./network.sh up` (The Fabric Lifecycle)
When the network is started, a massive sequence occurs:
*   Old docker containers and volumes are purged.
*   Cryptographic keys (X.509 certs, private keys) are generated for the orderer, org peers, and users via the Fabric CA.
*   The Genesis Block is created, and the Channel is joined by all peers.
*   The Go chaincode (`chaincode.go`) is compiled, packaged, installed on peers, approved by organizations, and committed to the channel.

### 2. `npm start` (The Backend Auto-Seed)
When the backend starts, the ledger is initially empty. To make testing seamless, `server.js` runs `autoSeedBlockchain()`:
*   It reads `data/users.json`, `data/departments.json`, and `data/courses.json`.
*   It checks the blockchain (e.g., `GetStudent`, `GetDepartment`) to see if the entries exist.
*   If they do not exist, it automatically submits transactions (`CreateStudent`, `CreateDepartment`, `CreateCourseOffering`) to populate the blockchain.
*   **Idempotency:** Because it checks first, you can restart the backend 100 times without duplicating data on the blockchain.

### 3. Wallet Management
The `wallet/` directory holds the private keys used to talk to the blockchain. When the Fabric network is destroyed and recreated (via `network.sh`), **all old certificates become invalid**. The backend automatically detects stale keys and overwrites them with fresh ones from the newly spawned CA, guaranteeing smooth reconnections.

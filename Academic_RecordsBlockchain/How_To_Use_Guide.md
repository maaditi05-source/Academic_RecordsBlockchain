# How to Use: Academic Records Blockchain

This guide explains how to operate the various features of the enhanced Academic Records Blockchain system, structured by user role.

---

## 🏗️ 1. Project Overview: What Does This System Do?

The system serves as a cryptographically verifiable ledger for academic records (grades, certificates, transcripts). It ensures that once a university issues a degree, it cannot be tampered with or forged.

**Key Features Build During Enhancements:**
1. **Student Document Uploads:** Students can upload PDFs of their transcripts/certificates. The system hashes the file and stores the hash on the blockchain.
2. **Dynamic Approval Pipeline:** Uploaded documents must go through an approval chain (Faculty → Admin). Both Admins and Faculty get real-time **Notification Bells** in their UI when a new document awaits their review. Students see a visual **Timeline** of their document's progress.
3. **Automated PDF Generation:** Once fully approved, the system generates a downloadable, official PDF certificate for the student.
4. **On-Chain Consent Management (Privacy):** Verifiers (employers) cannot see a student's data. Students must explicitly **Grant Consent** (via a smart contract transaction) to specific verifier addresses before verifiers can query the student's records.

---

## 🚀 2. System Startup Guide

Whenever you start working on the project, you need three components running:

### Step A: The Blockchain Network
1. Open a terminal in `Academic_RecordsBlockchain/`
2. Run: `sudo env PATH="$HOME/fabric-bin/bin:$PATH" ./network.sh up`
3. Wait until you see `🎉 NETWORK IS UP AND RUNNING!`

### Step B: The Node.js Backend API
1. Open a new terminal in `Academic-Records-Blockchain-Backend/`
2. Run: `npm start` (or `npm run dev`)
3. Wait until you see `Server running on port 3000`

### Step C: The Angular Frontend
1. Open a new terminal in `Academic-Records-Blockchain-Frontend/`
2. Run: `npm start`
3. Wait until compilation finishes, then open `http://localhost:4200` in your browser.

---

## 👨‍🎓 3. How to Use: The Student Workflow
*(Login on the frontend using any student Mock ID, e.g., "S12345")*

1. **Dashboard Home:** You will see a summary of your Academic Records.
2. **Upload a Document:** 
   * Navigate to the **Document Upload** section.
   * Attach a sample PDF.
   * You will instantly see this document appear in your **Approval Pipeline Timeline**.
3. **Timeline view:** Watch the document visually move from "Pending Faculty Review" to "Approved".
4. **Download Certificate:** Once your document is fully approved by Admin, a "Download PDF" button will appear so you can retrieve your officially generated certificate.
5. **Manage Privacy (Consent):** 
   * Navigate to the **Consent Management** tab.
   * You can type in the ID of a Verifier (e.g., an Employer ID) and click **Grant Access**.
   * You can revoke this access at any time using the corresponding "Revoke" button.

---

## 👨‍🏫 4. How to Use: The Faculty Workflow
*(Login on the frontend using a faculty ID)*

1. **Notification Indicator:** Look at the top right of your dashboard. If a student recently uploaded a document, the **Notification Bell** will show a red badge (e.g., `[1]`).
2. **Review Pending Documents:** Click the bell or navigate to the "Pending Approvals" table.
3. **Approve/Reject:** Review the student's document hash and details, then click **Approve** (which forwards it to the Admin) or **Reject** (which returns it to the student with a comment).

---

## 👨‍💻 5. How to Use: The Admin Workflow
*(Login on the frontend using an Admin ID)*

1. **Final Verification:** Like the Faculty, Admins have a **Notification Bell**. When the Faculty approves a document, it hits the Admin's queue.
2. **Issue Certificate:** Once the Admin clicks **Final Approve**, the smart contract commits the final verification to the blockchain. The system then automatically triggers the PDF generation for the student.
3. **System Auditing:** Admins have access to global views to audit any record on the blockchain to ensure data integrity.

---

## 🏢 6. How to Use: The Verifier Workflow

1. **Attempt Verification (Without Consent):** If a Verifier tries to query a student's record using the backend API or frontend **without** the student having granted consent, the blockchain smart contract will forcefully **REJECT** the query, throwing an "Access Denied / No Active Consent found" error.
2. **Attempt Verification (With Consent):** Once the student grants consent on their dashboard, the Verifier can input the student's ID and the Document Hash. The smart contract validates the consent on-chain and returns `true` (Valid) or `false` (Forged), proving the authenticity of the degree to the employer.

# Assignment Report: Academic Records Blockchain System

**Course name:** [Insert Course Name]  
**Submitted By:** [Insert Student Name/Roll Number]  
**Date:** [Insert Date]  

---

## 1. Project Overview

The **Academic Records Blockchain** is a secure, decentralized application built on Hyperledger Fabric. Its primary objective is to cryptographically secure student academic records, degrees, and transcripts to prevent document forgery and streamline the verification process for employers and academic institutions. 

The system implements a multi-organization consortium network consisting of three primary participants (Organizations):
* **NITWarangal (Admin/Core):** Manages global academic policies and issues final certificates.
* **Departments (Faculty):** Responsible for evaluating grades and approving student-uploaded documents.
* **Verifiers (Employers/Agencies):** Third-party entities that verify the authenticity of a student's degree.

---

## 2. Technology Stack

* **Blockchain Framework:** Hyperledger Fabric (v2.x) Let Go Chaincode (Smart Contracts)
* **State Database:** CouchDB (for rich querying)
* **Backend:** Node.js with Express framework and Fabric Node SDK
* **Frontend:** Angular (TypeScript, HTML, CSS)
* **Containerization:** Docker & Docker Compose

---

## 3. Core Architecture & Workflow

The basic architecture relies on students uploading their academic documents to the system. The smart contract (chaincode) ensures immutability. Once uploaded, the documents undergo a rigorous approval pipeline.

**Base Features Include:**
* Basic user enrollment and identity management via Fabric CA.
* Submitting and storing academic hashes on the ledger to guarantee data integrity.
* Role-based access for Admins, Students, and Verifiers.

---

## 4. Key Enhancements (Improvements over the Base "Prince Kumar" Repo)

While the original repository provided a functional foundation for blockchain-based certificate storage, this enhanced project introduces several **enterprise-grade features**, significantly upgrading the system's privacy, usability, and workflow automation.

### Enhancement 1: Dynamic Approval Pipeline & Visual Timeline
* **Previous State:** Basic binary (approved/rejected) status with limited visibility into who was holding up the approval.
* **Enhancement:** Implemented a robust, multi-stage approval pipeline (Faculty Advisor → Department HOD → Admin). The **Student Dashboard** now features a dynamic **Visual Timeline** that tracks real-time progress for every uploaded document, giving students transparency into exactly where their document is in the validation process.

### Enhancement 2: On-Chain Data Privacy & Consent Management (Sprint 3)
* **Previous State:** Once an academic record was on the blockchain, any enrolled verifier could potentially query the network for student records if they had the ID.
* **Enhancement:** Developed a strict **Consent Management System** directly inside the Chaincode. 
  * Smart Contract functions (`GrantConsent`, `RevokeConsent`, `CheckConsent`) were added.
  * Verifiers **cannot** view a student's record without explicit, time-stamped digital consent granted by the student.
  * Students have a dedicated interface to manage, grant, and revoke access to specific verifiers, putting students directly in control of their data privacy.

### Enhancement 3: Centralized Notification System
* **Previous State:** Faculty and Admins had to manually refresh or dig through tables to find pending documents that required their action.
* **Enhancement:** Built a global `<app-notification-bell>` component integrated seamlessly into the **Admin and Faculty Dashboards**. This alerts authorized personnel immediately when new documents are uploaded or moved into their queue, dramatically speeding up the turnaround time for certificate approvals.

### Enhancement 4: Automated PDF Certificate Generation
* **Previous State:** The system only provided raw data or a simple hash verification on the frontend.
* **Enhancement:** Built an integrated backend service that dynamically generates a formally structured, fully downloadable **PDF Certificate**. This pulls verified, tamper-proof data directly from the blockchain state database, formatting it into a professional academic transcript that the student can download directly from their dashboard.

### Enhancement 5: DevOps & Deployment Stability
* **Previous State:** `network.sh` scripts often failed during chaincode packaging due to permission errors (`permission denied` on `go mod vendor`) or missing TLS certificates.
* **Enhancement:** Heavily refactored the Docker deployment and chaincode installation scripts (`upgrade-chaincode.sh`). Handled cryptographic material generation correctly by injecting the `fabric-ca-client`, enforcing correct file ownership, and ensuring the chaincode smoothly deploys Sprint 3 functions dynamically without network crashes.

---

## 5. Conclusion

This enhanced Academic Records Blockchain transforms a basic proof-of-concept repository into a robust, production-ready system. By drastically improving data privacy through on-chain consent, streamlining the user experience with UI notifications and approval timelines, and providing tangible outputs like generated PDF certificates, the platform successfully solves real-world challenges in academic credential verification.

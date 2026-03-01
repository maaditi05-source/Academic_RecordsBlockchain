# Academic Records Blockchain — Complete Project Documentation

**Institution:** National Institute of Technology Warangal (NIT Warangal)  
**Technology:** Hyperledger Fabric v2.x, Node.js, Angular  
**Base Repository:** [prince-0.1 / Academic_RecordsBlockchain](https://github.com) (enhanced)

---

## Table of Contents

1. [Project Overview](#1-project-overview)  
2. [System Architecture](#2-system-architecture)  
3. [Technology Stack](#3-technology-stack)  
4. [Blockchain Network Design](#4-blockchain-network-design)  
5. [Chaincode (Smart Contracts)](#5-chaincode-smart-contracts)  
6. [Backend API](#6-backend-api)  
7. [Frontend Application](#7-frontend-application)  
8. [Data Flow & Workflows](#8-data-flow--workflows)  
9. [Startup & Deployment Guide](#9-startup--deployment-guide)  
10. [Pre-Created User Accounts](#10-pre-created-user-accounts)  
11. [Enhancements Over the Base Repository](#11-enhancements-over-the-base-repository)

---

## 1. Project Overview

The **Academic Records Blockchain** is a production-grade, decentralized application for NIT Warangal that cryptographically records and verifies student academic credentials on the Hyperledger Fabric blockchain.

**Core Goals:**
- Prevent academic document forgery and tampering
- Streamline multi-stage approval workflows for documents and certificates
- Give students control over their own data privacy via on-chain consent management
- Allow third-party employers and agencies to verify credentials without manual paperwork

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   FRONTEND (Angular SPA)                        │
│  Student Dashboard │ Faculty Dashboard │ Admin Panel │ Verifier  │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/REST + Socket.io (real-time)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              BACKEND (Node.js + Express)                        │
│  Auth (JWT) │ Student API │ Record API │ Certificate API        │
│  Document API │ Consent API │ Report API │ PDF Generator        │
│  Fabric CA Client │ Fabric Gateway (SDK) │ Socket.io events     │
└──────────────────────────────┬──────────────────────────────────┘
                               │ Fabric Node SDK gRPC
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│         HYPERLEDGER FABRIC NETWORK (Docker)                     │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐   │
│  │ NITWarangal Org │  │ Departments Org  │  │ Verifiers Org│   │
│  │  Peer (CouchDB) │  │  Peer (CouchDB)  │  │ Peer(CouchDB)│   │
│  │  CA + Admin MSP │  │  CA + Admin MSP  │  │ CA + Admin   │   │
│  └─────────────────┘  └─────────────────┘  └──────────────┘   │
│                                                                 │
│           Orderer (Solo) — academic-records-channel             │
│                    Chaincode: academic-records                  │
└─────────────────────────────────────────────────────────────────┘
                               │
                         CouchDB State DB
                     (rich query / document store)
```

---

## 3. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Blockchain | Hyperledger Fabric v2.5.x | Immutable ledger, smart contracts |
| State DB | CouchDB | Rich JSON queries on ledger state |
| Smart Contracts | Go (golang) | On-chain business logic |
| Backend | Node.js + Express | REST API server |
| Blockchain SDK | `fabric-network` v2.x | Node.js gateway to Fabric |
| Auth | JWT (JSON Web Tokens) | Stateless session management |
| Real-time | Socket.io | Live notifications to frontend |
| PDF Generation | Puppeteer | Dynamic certificate PDF rendering |
| QR Codes | qrcode | Embeds verification URL in certificate PDF |
| Frontend | Angular 17 | SPA with role-based dashboards |
| Containerization | Docker + Docker Compose | Peer/orderer/CA/CouchDB containers |

---

## 4. Blockchain Network Design

### Organizations & Peers

| Organization | MSP ID | Role |
|---|---|---|
| NIT Warangal | `NITWarangalMSP` | Admin authority, issues final certificates |
| Departments | `DepartmentsMSP` | Faculty advisors, HOD review and approval |
| Verifiers | `VerifiersMSP` | Employers / external agencies |

### Network Setup
- **Channel:** `academic-records-channel` (all 3 orgs)
- **Orderer:** Solo orderer at `orderer.nitw.edu:7050`
- **CAs:** One Fabric CA per organization for identity management
- **Consensus:** Solo (single orderer — suitable for dev/staging)

### Key Ports
| Service | Port |
|---|---|
| NITWarangal Peer | 7051 |
| Departments Peer | 8051 |
| Verifiers Peer | 9051 |
| Orderer | 7050 |
| CouchDB (per peer) | 5984, 6984, 7984 |
| NITWarangal CA | 7054 |

---

## 5. Chaincode (Smart Contracts)

**Language:** Go  
**Package:** `academic_records`  
**Location:** `Academic_RecordsBlockchain/chaincode-go/`

### Data Models on the Ledger

| Asset | Key Description |
|---|---|
| `Student` | `rollNumber` |
| `AcademicRecord` | `recordId` (semester records) |
| `Certificate` | `certificateId` |
| `CourseOffering` | `departmentId:courseCode:semester` |
| `Department` | `departmentId` |
| `DocumentUpload` | `docId` |
| `SemesterRegistration` | `regId` |
| `ApprovalRecord` | `recordId` (7-stage pipeline state) |
| `ConsentRecord` | `consentId` |

### Smart Contract Functions

#### Student Management
- `CreateStudent` — stores identity + private data in private collection
- `GetStudent` / `GetAllStudents` / `QueryStudentsByDepartment`
- `UpdateStudentStatus` / `UpdateStudentDepartment`

#### Academic Records
- `SubmitAcademicRecord` — stores grades + SGPA/CGPA for a semester
- `GetAcademicRecord` / `GetStudentRecords` / `GetAllRecords`
- `ApproveRecord` / `RejectRecord`

#### Certificates
- `IssueCertificate` — issues final degree after admin approval
- `VerifyCertificate` — cryptographically verifies authenticity
- `RevokeCertificate`

#### Document Approvals (7-stage pipeline)
- `GetApprovalRecord` / `ApproveStep` / `RejectStep`
- `UpdateDocumentStatus` *(Sprint 3 enhancement)*

#### Consent Management *(Sprint 3 — new)*
- `GrantConsent` — student grants a verifier access to their records
- `RevokeConsent` — student revokes a previously granted consent
- `CheckConsent` — verifier queries whether consent is active on-chain
- `GetConsentsByStudent` — student views all their consent records

### Endorsement Policy
```
OR('NITWarangalMSP.peer', 'DepartmentsMSP.peer', 'VerifiersMSP.peer')
```
Any one peer can endorse — maximizes availability.

---

## 6. Backend API

**Base URL:** `http://localhost:3000/api`  
**Swagger Docs:** `http://localhost:3000/api-docs`  
**Auth:** Bearer JWT token (pass via `Authorization: Bearer <token>` header)

### Route Groups

| Route Prefix | Description |
|---|---|
| `/auth` | Login, register, refresh token |
| `/students` | CRUD for student blockchain records |
| `/records` | Academic record submission + approval |
| `/certificates` | Issue, verify, revoke certificates |
| `/documents` | Upload, status pipeline, versioning |
| `/approvals` | 7-stage approval workflow management |
| `/consent` | On-chain consent grant/revoke/check |
| `/pdf` | Generate and download PDF certificates |
| `/reports` | Dashboard stats, CSV exports, blockchain explorer, audit trail |
| `/departments` | Department management |
| `/faculty` | Faculty advisor dedicated endpoints |
| `/semester` | Semester registration |

### Key Endpoints

```
POST   /auth/login
POST   /auth/register
GET    /students/all                 ← the endpoint that was returning 500
POST   /students/create
GET    /certificates/:certId/verify
POST   /documents/upload
PATCH  /documents/status/:docId
POST   /consent/grant
DELETE /consent/revoke/:consentId
GET    /consent/check/:studentId/:requesterId
GET    /pdf/generate/:certId         ← returns PDF binary
GET    /reports/explorer
GET    /reports/audit/:recordId
GET    /reports/certificates.csv
```

### Important Utility Scripts

| Script | Command | When to Run |
|---|---|---|
| Import admin wallet | `npm run import-admin` | After every `network.sh up` |
| Seed student blockchain records | `npm run seed` | After every `network.sh up` |
| Start backend | `npm start` or `npm run dev` | Normal operation |

---

## 7. Frontend Application

**Framework:** Angular 17  
**Location:** `Academic-Records-Blockchain-Frontend/`  
**Dev Server:** `http://localhost:4200`

### Dashboards by Role

| Role | Route | Key Features |
|---|---|---|
| **Admin** | `/admin/dashboard` | View all students, approve final certificates, audit logs, notification bell |
| **Student** | `/student/dashboard` | Upload documents, approval pipeline timeline, download PDF cert, manage consent |
| **Faculty** | `/faculty/dashboard` | Review pending docs, approve/reject, notification bell |
| **HOD** | `/faculty/dashboard` | Second-stage approvals |
| **Verifier** | `/verifier/dashboard` | Paste student ID + document hash → verify authenticity |
| **Department** | `/department/dashboard` | Department-level management |

### Key Angular Components

```
src/app/features/
  admin/admin-dashboard.component
  student/student-dashboard.component
  faculty/faculty-dashboard.component
  verifier/verifier-dashboard.component
  auth/login.component

src/app/shared/
  notification-bell/notification-bell.component   ← global notification UI
```

---

## 8. Data Flow & Workflows

### A. Student Document Upload → Certificate

```
Student uploads PDF
    │
    ▼
Backend: SHA-256 hash calculated, IPFS upload attempted (3-tier: Kubo → Infura → local)
    │  Chaincode: UploadDocument (stores hash + IPFS CID on ledger)
    │
    ▼  [UPLOADED]
Faculty Advisor reviews → Approves / Rejects
    │
    ▼  [UNDER_REVIEW]
Department HOD reviews → Approves
    │
    ▼  [AUTHENTICATED]
Exam Section → Approves
    ▼
DAC Member → Approves
    ▼
Dean Academic → Approves
    │
    ▼  [APPROVED]
Admin: IssueCertificate chaincode call
    │  Backend: pdfService generates QR-code PDF certificate
    │
    ▼  [ON_CHAIN]
Student: Downloads PDF from /api/pdf/generate/:certId
```

### B. Verifier Checking a Certificate (With Consent)

```
Student (on dashboard): GrantConsent(verifierId, scope, expiry)
    │  Chaincode stores ConsentRecord on ledger
    ▼
Verifier: Queries /consent/check/:studentId/:verifierId
    │  Chaincode: CheckConsent → returns active consent or throws
    ▼
Verifier: Calls /certificates/:certId/verify
    │  Chaincode: VerifyCertificate → true / false
    ▼
Verifier sees: ✅ Certificate is VALID
```

### C. Real-time Notifications

```
Any approval step happens in backend
    │
    ▼
notificationService.emit(userId, event, payload)  [Socket.io]
    │
    ▼
Angular NotificationBellComponent receives socket event
    │  Increments unread badge, shows dropdown item
    ▼
Faculty / Admin sees notification instantly — no refresh required
```

---

## 9. Startup & Deployment Guide

### Prerequisites

- Docker + Docker Compose  
- Node.js ≥ 18  
- Go 1.21+ (for chaincode build)  
- `fabric-ca-client` binary in PATH (`~/fabric-bin/bin/fabric-ca-client`)

### Full Startup Sequence

#### Step 1: Start the Blockchain Network
```bash
cd "Academic_RecordsBlockchain"
sudo env PATH="$HOME/fabric-bin/bin:$PATH" ./network.sh up
# Wait for: 🎉 NETWORK IS UP AND RUNNING!
```

#### Step 2: Fix Permissions & Sync Admin Wallet
```bash
# Fix ownership of generated crypto materials
sudo chown -R $USER:$USER organizations/

# Import fresh admin identity into the backend wallet
cd "../Academic-Records-Blockchain-Backend"
npm run import-admin
```

#### Step 3: Seed Student Records to Blockchain
```bash
# Re-create student blockchain records (wiped with every network restart)
npm run seed
```

#### Step 4: Start the Backend
```bash
npm start
# Server on http://localhost:3000
# Swagger at http://localhost:3000/api-docs
```

#### Step 5: Start the Frontend
```bash
cd "../Academic-Records-Blockchain-Frontend"
npm start
# App on http://localhost:4200
```

### After Every `network.sh up`

Run steps 2 → 3 → 4 to restore the backend to a working state. The `data/users.json` auth accounts survive restarts and do **not** need to be re-created.

---

## 10. Pre-Created User Accounts

**Default password for all demo accounts:** `password123`  
**Student default password:** their roll number (e.g., `25CSM2R26`)

| Username | Email | Role |
|---|---|---|
| `admin` | admin@nitw.ac.in | Admin |
| `faculty_demo` | faculty@nitw.ac.in | Faculty Advisor |
| `hod_demo` | hod@nitw.ac.in | Head of Department |
| `dac_member_demo` | dac_member@nitw.ac.in | DAC Member |
| `exam_section_demo` | exam_section@nitw.ac.in | Exam Section |
| `dean_academic_demo` | dean_academic@nitw.ac.in | Dean Academic |
| `cse` | cse@nitw.ac.in | Department (CSE) |
| `mech` | mech@nitw.ac.in | Department (MECH) |
| `25CSM2R26` | am25csm2r26@student.nitw.ac.in | Student (Aditi Mishra) |
| `CS21B001` | cs21b001@student.nitw.ac.in | Student (John Doe) |
| `CS22B002` | cs22b002@student.nitw.ac.in | Student (Priya Sharma) |

---

## 11. Enhancements Over the Base Repository

The base "Prince Kumar" repository provided a functional Hyperledger Fabric skeleton. All of the following features were designed and implemented from scratch.

### Enhancement 1: 7-Stage Document Approval Pipeline

- **Base repo:** Binary approve/reject with no intermediate tracking  
- **Enhancement:** Full 7-stage state machine: `UPLOADED → UNDER_REVIEW → AUTHENTICATED → APPROVED → ON_CHAIN` with dedicated roles at each stage (Faculty Advisor → HOD → DAC Member → Exam Section → Dean Academic → Admin)
- A separate `ApprovalRecord` asset on-chain tracks who approved at each stage, with timestamps and transaction IDs as an immutable audit trail

### Enhancement 2: Real-time Notification System

- **Base repo:** No notifications; users had to manually refresh pages  
- **Enhancement:** Socket.io integration in the backend emits events on every approval state change. The Angular `<app-notification-bell>` component (admin and faculty dashboards) shows a live unread badge count and dropdown list of pending actions — no page refresh needed

### Enhancement 3: On-Chain Consent Management

- **Base repo:** No data access controls between orgs; any enrolled peer could query any student data  
- **Enhancement:** Added 4 new chaincode functions (`GrantConsent`, `RevokeConsent`, `CheckConsent`, `GetConsentsByStudent`). Verifiers are **blocked at the smart-contract level** from reading any student record unless the student has explicitly granted time-scoped consent. Students manage this from their dashboard

### Enhancement 4: Automated PDF Certificate Generation

- **Base repo:** No certificate download; only raw JSON data was returned  
- **Enhancement:** Puppeteer-based PDF service (`pdfService.js`) dynamically renders a professional academic certificate from verified on-chain data, embeds a QR code linking to the verification URL, and serves it as a downloadable binary from `GET /api/pdf/generate/:certId`

### Enhancement 5: IPFS Document Storage

- **Base repo:** No distributed file storage; files were stored locally or not at all  
- **Enhancement:** 3-tier IPFS upload pipeline: local Kubo node → Infura gateway → local filesystem fallback. The IPFS CID is stored on-chain alongside the SHA-256 hash, meaning documents are referenced both immutably on-chain and retrievably from a distributed network

### Enhancement 6: Blockchain Explorer & Reporting

- **Base repo:** No visibility into raw ledger state  
- **Enhancement:** `reportController.js` provides:
  - Dashboard summary stats (total students, pending approvals, issued certificates)
  - Raw blockchain explorer (`GET /reports/explorer?type=records|certificates|students`)
  - Per-record audit trail with full approval history (`GET /reports/audit/:recordId`)
  - Bulk CSV exports for students, certificates, and approvals

### Enhancement 7: Swagger API Documentation

- **Base repo:** No API documentation  
- **Enhancement:** Full OpenAPI 3.0 Swagger docs auto-generated and served at `/api-docs`

### Enhancement 8: Wallet Sync & Post-Restart Recovery

- **Base repo:** No handling of stale wallet identities after a network restart  
- **Enhancement:** `walletSync.js` detects on startup if the admin wallet cert mismatches the current network's cert (indicating a network restart) and automatically purges and re-imports the admin identity. A `seedBlockchain.js` script (`npm run seed`) re-populates student records on the fresh ledger

### Enhancement 9: Student Visual Approval Timeline (Frontend)

- **Base repo:** No frontend visualization of the approval pipeline  
- **Enhancement:** The Student Dashboard includes an animated timeline showing each stage of the document approval with colour-coded statuses (pending / approved / rejected) and the name of the approver at each step

### Enhancement 10: Privacy-First Architecture

- **Base repo:** Student data stored in a single public collection  
- **Enhancement:** Student sensitive data (phone, Aadhaar hash, personal email) is stored in a **Fabric Private Data Collection** (`StudentPrivateDetails`) — different from the public ledger. Only the NITWarangal peer can access the private collection; other orgs only see public fields

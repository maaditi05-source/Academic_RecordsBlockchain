import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { APP_CONFIG } from '../../core/config/app.config';
import { NotificationBellComponent } from '../../shared/notification-bell.component';

@Component({
  selector: 'app-faculty-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NotificationBellComponent],
  template: `
    <div class="faculty-container">
      <!-- Header -->
      <div class="faculty-header">
        <div class="header-left">
          <div class="logo-badge">
            <span class="logo-icon">🎓</span>
          </div>
          <div>
            <h1 class="header-title">Faculty Dashboard</h1>
            <p class="header-subtitle">Academic Records Approval System — NIT Warangal</p>
          </div>
        </div>
        <div class="header-right">
          <span class="user-badge">{{ currentUser?.username || 'Faculty' }}</span>
          <app-notification-bell></app-notification-bell>
          <button class="logout-btn" (click)="logout()">Sign Out</button>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon pending-icon">⏳</div>
          <div class="stat-info">
            <div class="stat-value">{{ pendingApprovals.length }}</div>
            <div class="stat-label">Pending Approval</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon approved-icon">✅</div>
          <div class="stat-info">
            <div class="stat-value">{{ approvedCount }}</div>
            <div class="stat-label">Approved This Week</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon docs-icon">📄</div>
          <div class="stat-info">
            <div class="stat-value">{{ docCount }}</div>
            <div class="stat-label">Documents Verified</div>
          </div>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="tab-bar">
        <button class="tab-btn" [class.active]="activeTab === 'queue'" (click)="activeTab='queue'; loadQueue()">
          📋 Approval Queue
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'upload'" (click)="activeTab='upload'">
          📤 Upload Document
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'verify'" (click)="activeTab='verify'">
          🔍 Verify Document
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'semester'" (click)="activeTab='semester'">
          📅 Semester Registration
        </button>
      </div>

      <!-- APPROVAL QUEUE TAB -->
      <div class="tab-content" *ngIf="activeTab === 'queue'">
        <div class="section-header">
          <h2>Records Awaiting Your Approval</h2>
          <button class="refresh-btn" (click)="loadQueue()">↻ Refresh</button>
        </div>

        <div *ngIf="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Loading approval queue...</p>
        </div>

        <div *ngIf="!loading && pendingApprovals.length === 0" class="empty-state">
          <div class="empty-icon">✓</div>
          <p>No records pending approval</p>
        </div>

        <div class="records-grid" *ngIf="!loading">
          <div class="record-card" *ngFor="let record of pendingApprovals">
            <div class="record-header">
              <div class="record-id">{{ record.recordId }}</div>
              <div class="status-badge" [class]="getStatusClass(record.currentStatus || record.status)">
                {{ record.currentStatus || record.status }}
              </div>
            </div>
            <div class="record-details">
              <div class="detail-row">
                <span class="detail-label">Student</span>
                <span class="detail-value">{{ record.studentId }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Department</span>
                <span class="detail-value">{{ record.department }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Semester</span>
                <span class="detail-value">Semester {{ record.semester }}</span>
              </div>
            </div>

            <!-- Approval Pipeline -->
            <div class="approval-pipeline">
              <div class="pipeline-step" [class.done]="isPipelineDone(record, 'department')" [class.active]="isPipelineActive(record, 'department')">
                <div class="step-dot"></div>
                <div class="step-label">Submit</div>
              </div>
              <div class="pipeline-line"></div>
              <div class="pipeline-step" [class.done]="isPipelineDone(record, 'faculty')" [class.active]="isPipelineActive(record, 'faculty')">
                <div class="step-dot"></div>
                <div class="step-label">Faculty</div>
              </div>
              <div class="pipeline-line"></div>
              <div class="pipeline-step" [class.done]="isPipelineDone(record, 'hod')" [class.active]="isPipelineActive(record, 'hod')">
                <div class="step-dot"></div>
                <div class="step-label">HOD</div>
              </div>
              <div class="pipeline-line"></div>
              <div class="pipeline-step" [class.done]="isPipelineDone(record, 'dac_member')" [class.active]="isPipelineActive(record, 'dac_member')">
                <div class="step-dot"></div>
                <div class="step-label">DAC</div>
              </div>
              <div class="pipeline-line"></div>
              <div class="pipeline-step" [class.done]="isPipelineDone(record, 'exam_section')" [class.active]="isPipelineActive(record, 'exam_section')">
                <div class="step-dot"></div>
                <div class="step-label">ES</div>
              </div>
              <div class="pipeline-line"></div>
              <div class="pipeline-step" [class.done]="isPipelineDone(record, 'dean_academic')" [class.active]="isPipelineActive(record, 'dean_academic')">
                <div class="step-dot"></div>
                <div class="step-label">Dean</div>
              </div>
            </div>

            <div class="record-actions">
              <input class="comment-input" [(ngModel)]="record._comment" placeholder="Optional comment..." />
              <button class="approve-btn" (click)="approveRecord(record)" [disabled]="record._loading">
                <span *ngIf="!record._loading">✓ Approve</span>
                <span *ngIf="record._loading">Processing...</span>
              </button>
              <button class="reject-btn" (click)="openReject(record)" [disabled]="record._loading">
                ✗ Reject
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- DOCUMENT UPLOAD TAB -->
      <div class="tab-content" *ngIf="activeTab === 'upload'">
        <div class="section-header">
          <h2>Upload and Hash Document</h2>
        </div>
        <div class="upload-card">
          <div class="upload-description">
            <p>Upload any academic document (grade sheet, certificate, etc.). 
               The system will compute its <strong>SHA-256 hash</strong> and store it permanently on the blockchain for authenticity verification.</p>
          </div>
          <div class="form-group">
            <label>Student Roll Number</label>
            <input class="form-input" [(ngModel)]="uploadForm.studentId" placeholder="e.g. CS21B001" />
          </div>
          <div class="form-group">
            <label>Document Type</label>
            <select class="form-input" [(ngModel)]="uploadForm.docType">
              <option value="GRADE_SHEET">Grade Sheet</option>
              <option value="MARKSHEET">Mark Sheet</option>
              <option value="TRANSCRIPT">Transcript</option>
              <option value="DEGREE_CERT">Degree Certificate</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Semester (0 = Not semester-specific)</label>
              <input class="form-input" [(ngModel)]="uploadForm.semester" type="number" min="0" max="8" />
            </div>
            <div class="form-group">
              <label>Academic Year</label>
              <input class="form-input" [(ngModel)]="uploadForm.academicYear" placeholder="e.g. 2024-25" />
            </div>
          </div>

          <!-- Drag & Drop Area -->
          <div class="drop-zone" 
               [class.drag-over]="isDragOver"
               (dragover)="onDragOver($event)"
               (dragleave)="onDragLeave($event)"
               (drop)="onDrop($event)"
               (click)="fileInput.click()">
            <div class="drop-icon">📁</div>
            <div class="drop-text" *ngIf="!selectedFile">
              <strong>Drag & drop</strong> or <span class="browse-link">browse</span>
              <br><small>PDF, JPEG, PNG — max 10MB</small>
            </div>
            <div class="file-selected" *ngIf="selectedFile">
              <span class="file-icon">📄</span> {{ selectedFile.name }}
              <br><small>{{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB</small>
            </div>
          </div>
          <input #fileInput type="file" style="display:none" accept=".pdf,.jpg,.jpeg,.png" (change)="onFileSelect($event)" />

          <button class="upload-submit-btn" (click)="uploadDocument()" [disabled]="uploading || !selectedFile">
            <span *ngIf="!uploading">🔗 Upload & Store Hash on Blockchain</span>
            <span *ngIf="uploading">Uploading...</span>
          </button>

          <div class="upload-result" *ngIf="uploadResult">
            <div class="result-success" *ngIf="uploadResult.success">
              <div class="result-title">✅ Document Anchored on Blockchain</div>
              <div class="result-hash">
                <span class="hash-label">SHA-256 Hash:</span>
                <code class="hash-value">{{ uploadResult.data?.sha256Hash }}</code>
              </div>
              <div class="result-meta">
                <span>Doc ID: {{ uploadResult.data?.docId }}</span>
              </div>
            </div>
            <div class="result-error" *ngIf="!uploadResult.success">
              ❌ {{ uploadResult.message }}
            </div>
          </div>
        </div>
      </div>

      <!-- VERIFY DOCUMENT TAB -->
      <div class="tab-content" *ngIf="activeTab === 'verify'">
        <div class="section-header">
          <h2>Verify Document Authenticity</h2>
        </div>
        <div class="verify-card">
          <p class="verify-description">Upload a document to verify if it matches the blockchain record. Any tampering will be detected.</p>
          
          <div class="verify-toggle">
            <button [class.active]="verifyMode === 'upload'" (click)="verifyMode='upload'">Upload File</button>
            <button [class.active]="verifyMode === 'hash'" (click)="verifyMode='hash'">Enter Hash</button>
          </div>

          <div *ngIf="verifyMode === 'upload'">
            <div class="drop-zone" (click)="verifyFileInput.click()">
              <div class="drop-icon">🔍</div>
              <div *ngIf="!verifyFile">Click to select file to verify</div>
              <div *ngIf="verifyFile">{{ verifyFile.name }}</div>
            </div>
            <input #verifyFileInput type="file" style="display:none" accept=".pdf,.jpg,.jpeg,.png" (change)="onVerifyFileSelect($event)" />
            <button class="verify-btn" (click)="verifyDocument()" [disabled]="verifying || !verifyFile">
              <span *ngIf="!verifying">🔍 Verify on Blockchain</span>
              <span *ngIf="verifying">Verifying...</span>
            </button>
          </div>

          <div *ngIf="verifyMode === 'hash'">
            <div class="form-group">
              <label>SHA-256 Hash</label>
              <input class="form-input" [(ngModel)]="hashToVerify" placeholder="Enter the 64-character SHA-256 hash..." />
            </div>
            <button class="verify-btn" (click)="verifyByHash()" [disabled]="verifying || !hashToVerify">
              <span *ngIf="!verifying">🔍 Check Hash on Blockchain</span>
              <span *ngIf="verifying">Checking...</span>
            </button>
          </div>

          <div class="verify-result" *ngIf="verifyResult">
            <div class="verify-authentic" *ngIf="verifyResult.data?.verified">
              <div class="verify-icon">✅</div>
              <div class="verify-title">Document is Authentic</div>
              <div class="verify-detail">Hash matches blockchain record</div>
              <div class="verify-hash"><code>{{ verifyResult.data?.sha256Hash }}</code></div>
            </div>
            <div class="verify-tampered" *ngIf="!verifyResult.data?.verified">
              <div class="verify-icon">⚠️</div>
              <div class="verify-title">Document Not Found</div>
              <div class="verify-detail">{{ verifyResult.data?.message }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- SEMESTER REGISTRATION TAB -->
      <div class="tab-content" *ngIf="activeTab === 'semester'">
        <div class="section-header">
          <h2>Semester Registration</h2>
        </div>
        <div class="semester-card">
          <div class="form-group">
            <label>Student Roll Number</label>
            <input class="form-input" [(ngModel)]="semForm.studentId" placeholder="e.g. CS21B001" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Semester</label>
              <select class="form-input" [(ngModel)]="semForm.semester">
                <option *ngFor="let s of [1,2,3,4,5,6,7,8]" [value]="s">Semester {{ s }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Academic Year</label>
              <input class="form-input" [(ngModel)]="semForm.academicYear" placeholder="e.g. 2024-25" />
            </div>
          </div>
          <div class="form-group">
            <label>Faculty Advisor Name</label>
            <input class="form-input" [(ngModel)]="semForm.facultyAdvisor" placeholder="Full name of faculty advisor" />
          </div>
          <button class="submit-btn" (click)="registerSemester()" [disabled]="semLoading">
            <span *ngIf="!semLoading">📅 Register for Semester</span>
            <span *ngIf="semLoading">Registering...</span>
          </button>
          <div class="success-msg" *ngIf="semResult?.success">✅ {{ semResult.message }}</div>
          <div class="error-msg" *ngIf="semResult && !semResult.success">❌ {{ semResult.message }}</div>
        </div>
      </div>

      <!-- Reject Modal -->
      <div class="modal-overlay" *ngIf="rejectModal" (click)="rejectModal=null">
        <div class="modal-box" (click)="$event.stopPropagation()">
          <h3>Reject Record</h3>
          <p>Record: <strong>{{ rejectModal?.recordId }}</strong></p>
          <textarea class="modal-textarea" [(ngModel)]="rejectReason" placeholder="Provide a clear reason for rejection..."></textarea>
          <div class="modal-actions">
            <button class="cancel-btn" (click)="rejectModal=null">Cancel</button>
            <button class="confirm-reject-btn" (click)="confirmReject()" [disabled]="!rejectReason">Confirm Rejection</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    .faculty-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
      color: #fff;
      font-family: 'Inter', 'Segoe UI', sans-serif;
      padding-bottom: 40px;
    }

    .faculty-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 32px;
      background: rgba(255,255,255,0.05);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .header-left { display: flex; align-items: center; gap: 16px; }
    .logo-badge {
      width: 48px; height: 48px;
      background: linear-gradient(135deg, #7c3aed, #2563eb);
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: 24px;
    }
    .header-title { font-size: 22px; font-weight: 700; }
    .header-subtitle { font-size: 13px; color: rgba(255,255,255,0.6); }
    .header-right { display: flex; align-items: center; gap: 12px; }
    .user-badge {
      background: rgba(124,58,237,0.3);
      border: 1px solid rgba(124,58,237,0.5);
      padding: 6px 16px; border-radius: 20px;
      font-size: 13px; font-weight: 600;
    }
    .logout-btn {
      background: rgba(239,68,68,0.2);
      border: 1px solid rgba(239,68,68,0.4);
      color: #fca5a5; padding: 6px 16px;
      border-radius: 8px; cursor: pointer;
      font-size: 13px;
      transition: all 0.2s;
    }
    .logout-btn:hover { background: rgba(239,68,68,0.4); }

    .stats-row {
      display: flex; gap: 16px; padding: 24px 32px;
    }
    .stat-card {
      flex: 1; background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px; padding: 20px;
      display: flex; align-items: center; gap: 16px;
      transition: transform 0.2s;
    }
    .stat-card:hover { transform: translateY(-2px); }
    .stat-icon { font-size: 36px; }
    .stat-value { font-size: 28px; font-weight: 800; }
    .stat-label { font-size: 13px; color: rgba(255,255,255,0.6); margin-top: 2px; }

    .tab-bar {
      display: flex; gap: 4px; padding: 0 32px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .tab-btn {
      background: none; border: none; color: rgba(255,255,255,0.6);
      padding: 12px 20px; cursor: pointer; font-size: 14px;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
    }
    .tab-btn.active {
      color: #a78bfa;
      border-bottom-color: #a78bfa;
    }
    .tab-btn:hover { color: #fff; }

    .tab-content { padding: 24px 32px; }

    .section-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 20px;
    }
    .section-header h2 { font-size: 18px; font-weight: 600; }
    .refresh-btn {
      background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
      color: #fff; padding: 6px 14px; border-radius: 8px; cursor: pointer;
    }

    .loading-state, .empty-state {
      text-align: center; padding: 60px;
      color: rgba(255,255,255,0.5);
    }
    .spinner {
      width: 40px; height: 40px;
      border: 3px solid rgba(255,255,255,0.2);
      border-top-color: #7c3aed;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty-icon { font-size: 48px; margin-bottom: 12px; }

    .records-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 20px; }
    .record-card {
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px; padding: 20px;
    }
    .record-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 16px;
    }
    .record-id { font-size: 13px; color: rgba(255,255,255,0.5); font-family: monospace; }
    .status-badge {
      font-size: 11px; font-weight: 700; padding: 4px 10px;
      border-radius: 20px; text-transform: uppercase;
    }
    .status-submitted { background: rgba(245,158,11,0.2); color: #fbbf24; border: 1px solid rgba(245,158,11,0.3); }
    .status-faculty-approved { background: rgba(16,185,129,0.2); color: #34d399; border: 1px solid rgba(16,185,129,0.3); }
    .status-draft { background: rgba(107,114,128,0.3); color: #9ca3af; border: 1px solid rgba(107,114,128,0.3); }
    .status-approved { background: rgba(34,197,94,0.2); color: #4ade80; border: 1px solid rgba(34,197,94,0.3); }

    .record-details { margin-bottom: 16px; }
    .detail-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .detail-label { font-size: 12px; color: rgba(255,255,255,0.5); }
    .detail-value { font-size: 13px; font-weight: 500; }

    /* Approval Pipeline */
    .approval-pipeline {
      display: flex; align-items: center;
      margin: 16px 0; padding: 12px;
      background: rgba(255,255,255,0.04);
      border-radius: 10px;
    }
    .pipeline-step { display: flex; flex-direction: column; align-items: center; min-width: 36px; }
    .step-dot {
      width: 14px; height: 14px;
      border-radius: 50%;
      background: rgba(255,255,255,0.2);
      border: 2px solid rgba(255,255,255,0.2);
    }
    .pipeline-step.done .step-dot {
      background: #10b981; border-color: #10b981;
    }
    .pipeline-step.active .step-dot {
      background: #7c3aed; border-color: #a78bfa;
      box-shadow: 0 0 8px #7c3aed;
      animation: pulse 1.5s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 4px #7c3aed; }
      50% { box-shadow: 0 0 12px #a78bfa; }
    }
    .step-label { font-size: 10px; color: rgba(255,255,255,0.5); margin-top: 4px; }
    .pipeline-step.done .step-label { color: #10b981; }
    .pipeline-step.active .step-label { color: #a78bfa; font-weight: 600; }
    .pipeline-line { flex: 1; height: 2px; background: rgba(255,255,255,0.1); margin: 0 2px; margin-bottom: 14px; }

    .record-actions { display: flex; gap: 8px; margin-top: 14px; }
    .comment-input {
      flex: 1; background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.15);
      color: #fff; padding: 8px 12px; border-radius: 8px;
      font-size: 13px; outline: none;
    }
    .approve-btn {
      background: linear-gradient(135deg, #059669, #10b981);
      border: none; color: #fff;
      padding: 8px 16px; border-radius: 8px;
      cursor: pointer; font-size: 13px; font-weight: 600;
      white-space: nowrap;
    }
    .approve-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .reject-btn {
      background: rgba(239,68,68,0.2);
      border: 1px solid rgba(239,68,68,0.4);
      color: #fca5a5; padding: 8px 16px;
      border-radius: 8px; cursor: pointer; font-size: 13px;
    }

    /* Upload Card */
    .upload-card, .verify-card, .semester-card {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px; padding: 28px;
      max-width: 680px;
    }
    .upload-description, .verify-description { color: rgba(255,255,255,0.7); margin-bottom: 24px; font-size: 14px; line-height: 1.6; }
    strong { color: #a78bfa; }

    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; font-size: 13px; color: rgba(255,255,255,0.6); margin-bottom: 6px; }
    .form-input {
      width: 100%; background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.15);
      color: #fff; padding: 10px 14px; border-radius: 10px;
      font-size: 14px; outline: none;
      transition: border-color 0.2s;
    }
    .form-input:focus { border-color: #7c3aed; }
    .form-input option { background: #302b63; }
    .form-row { display: flex; gap: 16px; }
    .form-row .form-group { flex: 1; }

    .drop-zone {
      border: 2px dashed rgba(124,58,237,0.4);
      border-radius: 14px; padding: 40px;
      text-align: center; cursor: pointer;
      transition: all 0.2s; margin: 16px 0;
      background: rgba(124,58,237,0.05);
    }
    .drop-zone:hover, .drop-zone.drag-over {
      border-color: #7c3aed;
      background: rgba(124,58,237,0.1);
    }
    .drop-icon { font-size: 36px; margin-bottom: 10px; }
    .browse-link { color: #a78bfa; text-decoration: underline; }

    .upload-submit-btn {
      width: 100%;
      background: linear-gradient(135deg, #7c3aed, #2563eb);
      border: none; color: #fff;
      padding: 14px; border-radius: 10px;
      font-size: 15px; font-weight: 700; cursor: pointer;
      transition: opacity 0.2s;
    }
    .upload-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .upload-result { margin-top: 20px; }
    .result-success {
      background: rgba(16,185,129,0.1);
      border: 1px solid rgba(16,185,129,0.3);
      border-radius: 12px; padding: 16px;
    }
    .result-title { font-weight: 700; margin-bottom: 12px; color: #34d399; }
    .hash-label { font-size: 12px; color: rgba(255,255,255,0.6); display: block; margin-bottom: 4px; }
    .hash-value {
      font-family: monospace; font-size: 12px;
      word-break: break-all; color: #a78bfa;
      background: rgba(0,0,0,0.3); padding: 8px; border-radius: 6px;
      display: block;
    }
    .result-error { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 12px; padding: 16px; color: #fca5a5; }

    /* Verify */
    .verify-toggle { display: flex; gap: 8px; margin-bottom: 20px; }
    .verify-toggle button {
      background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15);
      color: rgba(255,255,255,0.7); padding: 8px 16px; border-radius: 8px; cursor: pointer;
    }
    .verify-toggle button.active { background: rgba(124,58,237,0.3); border-color: #7c3aed; color: #a78bfa; }
    .verify-btn {
      width: 100%; background: rgba(59,130,246,0.3); border: 1px solid #3b82f6;
      color: #93c5fd; padding: 12px; border-radius: 10px; cursor: pointer;
      font-size: 14px; font-weight: 600; margin-top: 12px;
    }
    .verify-result { margin-top: 20px; }
    .verify-authentic {
      background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3);
      border-radius: 12px; padding: 24px; text-align: center;
    }
    .verify-tampered {
      background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3);
      border-radius: 12px; padding: 24px; text-align: center;
    }
    .verify-icon { font-size: 36px; margin-bottom: 8px; }
    .verify-title { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
    .verify-detail { font-size: 13px; color: rgba(255,255,255,0.6); margin-bottom: 12px; }
    .verify-hash code { font-family: monospace; font-size: 11px; word-break: break-all; }

    /* Semester */
    .submit-btn {
      width: 100%; background: linear-gradient(135deg, #2563eb, #1d4ed8);
      border: none; color: #fff; padding: 12px; border-radius: 10px;
      font-size: 14px; font-weight: 700; cursor: pointer;
    }
    .submit-btn:disabled { opacity: 0.5; }
    .success-msg { margin-top: 12px; color: #34d399; font-size: 14px; }
    .error-msg { margin-top: 12px; color: #fca5a5; font-size: 14px; }

    /* Modal */
    .modal-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.7); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center; z-index: 1000;
    }
    .modal-box {
      background: #1e1b4b; border: 1px solid rgba(255,255,255,0.2);
      border-radius: 16px; padding: 28px; width: 480px;
    }
    .modal-box h3 { font-size: 18px; margin-bottom: 8px; }
    .modal-box p { color: rgba(255,255,255,0.6); margin-bottom: 16px; font-size: 14px; }
    .modal-textarea {
      width: 100%; background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.15);
      color: #fff; padding: 12px; border-radius: 10px;
      font-size: 14px; min-height: 100px; resize: vertical; outline: none;
    }
    .modal-actions { display: flex; gap: 10px; margin-top: 16px; justify-content: flex-end; }
    .cancel-btn {
      background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
      color: #fff; padding: 10px 20px; border-radius: 8px; cursor: pointer;
    }
    .confirm-reject-btn {
      background: linear-gradient(135deg, #dc2626, #b91c1c);
      border: none; color: #fff; padding: 10px 20px;
      border-radius: 8px; cursor: pointer; font-weight: 600;
    }
    .confirm-reject-btn:disabled { opacity: 0.5; }
  `]
})
export class FacultyDashboardComponent implements OnInit {
  activeTab = 'queue';
  loading = false;
  pendingApprovals: any[] = [];
  approvedCount = 0;
  docCount = 0;

  // Upload form
  uploadForm = { studentId: '', docType: 'GRADE_SHEET', semester: 0, academicYear: '' };
  selectedFile: File | null = null;
  isDragOver = false;
  uploading = false;
  uploadResult: any = null;

  // Verify
  verifyMode = 'upload';
  verifyFile: File | null = null;
  verifying = false;
  verifyResult: any = null;
  hashToVerify = '';

  // Semester
  semForm = { studentId: '', semester: 1, academicYear: '', facultyAdvisor: '' };
  semLoading = false;
  semResult: any = null;

  // Reject modal
  rejectModal: any = null;
  rejectReason = '';

  currentUser: any;
  private apiUrl = APP_CONFIG.api.baseUrl;

  constructor(private http: HttpClient, private router: Router) { }

  ngOnInit() {
    const stored = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (stored) this.currentUser = JSON.parse(stored);
    this.loadQueue();
  }

  private getHeaders() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  loadQueue() {
    this.loading = true;
    this.http.get<any>(`${this.apiUrl}/approval/queue/SUBMITTED`, { headers: this.getHeaders() })
      .subscribe({
        next: (res) => {
          this.pendingApprovals = res.data?.records || (Array.isArray(res.data) ? res.data : []);
          // Fetch approval status for each record
          this.pendingApprovals.forEach(r => this.loadApprovalStatus(r));
          this.loading = false;
        },
        error: () => { this.pendingApprovals = []; this.loading = false; }
      });
  }

  loadApprovalStatus(record: any) {
    this.http.get<any>(`${this.apiUrl}/approval/status/${record.recordId || record.recordID}`, { headers: this.getHeaders() })
      .subscribe({
        next: (res) => { Object.assign(record, res.data); },
        error: () => { }
      });
  }

  getStatusClass(status: string): string {
    const map: { [key: string]: string } = {
      'SUBMITTED': 'status-badge status-submitted',
      'FACULTY_APPROVED': 'status-badge status-faculty-approved',
      'DRAFT': 'status-badge status-draft',
      'APPROVED': 'status-badge status-approved',
    };
    return map[status] || 'status-badge status-draft';
  }

  isPipelineDone(record: any, role: string): boolean {
    const chain: any[] = record.approvalChain || [];
    return chain.some((s: any) => s.role === role);
  }

  isPipelineActive(record: any, role: string): boolean {
    const statusToRole: { [key: string]: string } = {
      'SUBMITTED': 'department',
      'FACULTY_APPROVED': 'faculty',
      'HOD_APPROVED': 'hod',
      'DAC_APPROVED': 'dac_member',
      'ES_APPROVED': 'exam_section',
      'APPROVED': 'dean_academic'
    };
    const nextRole = statusToRole[record.currentStatus || record.status || 'DRAFT'];
    return nextRole === role && !this.isPipelineDone(record, role);
  }

  approveRecord(record: any) {
    record._loading = true;
    const id = record.recordId || record.recordID;
    this.http.post<any>(`${this.apiUrl}/approval/faculty/${id}`,
      { comment: record._comment || '' },
      { headers: this.getHeaders() }
    ).subscribe({
      next: () => {
        record._loading = false;
        this.approvedCount++;
        this.loadQueue();
      },
      error: (err) => {
        record._loading = false;
        alert('Error: ' + (err.error?.message || 'Approval failed'));
      }
    });
  }

  openReject(record: any) {
    this.rejectModal = record;
    this.rejectReason = '';
  }

  confirmReject() {
    if (!this.rejectReason) return;
    const id = this.rejectModal.recordId || this.rejectModal.recordID;
    this.http.post<any>(`${this.apiUrl}/approval/reject/${id}`,
      { reason: this.rejectReason },
      { headers: this.getHeaders() }
    ).subscribe({
      next: () => { this.rejectModal = null; this.loadQueue(); },
      error: (err) => alert('Error: ' + (err.error?.message || 'Rejection failed'))
    });
  }

  // Drag & drop
  onDragOver(e: DragEvent) { e.preventDefault(); this.isDragOver = true; }
  onDragLeave(e: DragEvent) { this.isDragOver = false; }
  onDrop(e: DragEvent) {
    e.preventDefault(); this.isDragOver = false;
    if (e.dataTransfer?.files[0]) this.selectedFile = e.dataTransfer.files[0];
  }
  onFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files?.[0]) this.selectedFile = input.files[0];
  }
  onVerifyFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files?.[0]) this.verifyFile = input.files[0];
  }

  uploadDocument() {
    if (!this.selectedFile || !this.uploadForm.studentId) return;
    this.uploading = true;
    this.uploadResult = null;

    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('studentId', this.uploadForm.studentId);
    formData.append('docType', this.uploadForm.docType);
    formData.append('semester', String(this.uploadForm.semester));
    formData.append('academicYear', this.uploadForm.academicYear);

    this.http.post<any>(`${this.apiUrl}/documents/upload`, formData, { headers: this.getHeaders() })
      .subscribe({
        next: (res) => { this.uploadResult = res; this.uploading = false; this.docCount++; },
        error: (err) => { this.uploadResult = { success: false, message: err.error?.message || 'Upload failed' }; this.uploading = false; }
      });
  }

  verifyDocument() {
    if (!this.verifyFile) return;
    this.verifying = true;
    this.verifyResult = null;

    const formData = new FormData();
    formData.append('file', this.verifyFile);

    this.http.post<any>(`${this.apiUrl}/documents/verify`, formData)
      .subscribe({
        next: (res) => { this.verifyResult = res; this.verifying = false; },
        error: (err) => { this.verifyResult = { data: { verified: false, message: err.error?.message } }; this.verifying = false; }
      });
  }

  verifyByHash() {
    if (!this.hashToVerify) return;
    this.verifying = true;
    this.verifyResult = null;

    this.http.get<any>(`${this.apiUrl}/documents/verify/${this.hashToVerify}`)
      .subscribe({
        next: (res) => { this.verifyResult = res; this.verifying = false; },
        error: (err) => { this.verifyResult = { data: { verified: false, message: 'Not found' } }; this.verifying = false; }
      });
  }

  registerSemester() {
    this.semLoading = true;
    this.semResult = null;

    this.http.post<any>(`${this.apiUrl}/semester/register`, this.semForm, { headers: this.getHeaders() })
      .subscribe({
        next: (res) => { this.semResult = res; this.semLoading = false; },
        error: (err) => { this.semResult = { success: false, message: err.error?.message || 'Registration failed' }; this.semLoading = false; }
      });
  }

  logout() {
    localStorage.clear(); sessionStorage.clear();
    this.router.navigate(['/auth/login']);
  }
}

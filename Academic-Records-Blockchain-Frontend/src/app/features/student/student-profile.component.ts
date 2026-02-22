import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { BlockchainService } from '../../core/services/blockchain.service';
import { Student, AcademicRecord, Certificate } from '../../core/models/blockchain.model';
import { CertificateRequestDialogComponent } from './certificate-request-dialog.component';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { APP_CONFIG, getVerificationUrl } from '../../core/config/app.config';

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  template: `
    <div class="profile-container" *ngIf="!loading; else loadingTemplate">
      <!-- Animated Background -->
      <div class="bg-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
      </div>

      <!-- Header -->
      <div class="profile-header">
        <div class="header-content">
          <div class="header-left">
            <button mat-icon-button class="back-button" (click)="goBack()" *ngIf="isViewingAsAdmin" matTooltip="Back to Dashboard">
              <mat-icon>arrow_back</mat-icon>
            </button>
            <div class="logo-wrapper">
              <div class="avatar-circle">
                <mat-icon>person</mat-icon>
              </div>
            </div>
            <div class="student-info">
              <div class="welcome-text">
                <mat-icon class="dashboard-icon">account_circle</mat-icon>
                <h1>{{student?.name || 'Student Name'}}</h1>
              </div>
              <div class="student-meta">
                <span class="roll-number">
                  <mat-icon>badge</mat-icon>
                  {{student?.rollNumber || rollNumber}}
                </span>
                <span class="department">
                  <mat-icon>domain</mat-icon>
                  {{student?.department || 'Department'}}
                </span>
                <span class="enrollment-year">
                  <mat-icon>event</mat-icon>
                  Year {{student?.enrollmentYear || 'N/A'}}
                </span>
                <mat-chip class="status-chip" [class]="getStatusClass(student?.status || '')">
                  {{student?.status || 'N/A'}}
                </mat-chip>
              </div>
            </div>
          </div>
          <div class="header-actions" *ngIf="!isViewingAsAdmin">
            <button mat-raised-button color="primary" (click)="requestCertificate()" class="action-btn">
              <mat-icon>request_page</mat-icon>
              <span>Request Certificate</span>
            </button>
            <button mat-raised-button color="warn" (click)="logout()" class="action-btn">
              <mat-icon>logout</mat-icon>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="stats-cards">
        <mat-card class="stat-card">
          <div class="stat-icon-wrapper cgpa">
            <mat-icon>school</mat-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{student?.currentCGPA?.toFixed(2) || '0.00'}}</div>
            <div class="stat-label">Current CGPA</div>
          </div>
          <div class="stat-badge cgpa-badge">GPA</div>
        </mat-card>

        <mat-card class="stat-card">
          <div class="stat-icon-wrapper credits">
            <mat-icon>library_books</mat-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{student?.totalCreditsEarned || 0}}</div>
            <div class="stat-label">Credits Earned</div>
          </div>
          <div class="stat-badge credits-badge">Credits</div>
        </mat-card>

        <mat-card class="stat-card">
          <div class="stat-icon-wrapper records">
            <mat-icon>assignment</mat-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{records.length}}</div>
            <div class="stat-label">Academic Records</div>
          </div>
          <div class="stat-badge records-badge">Records</div>
        </mat-card>

        <mat-card class="stat-card">
          <div class="stat-icon-wrapper certificates">
            <mat-icon>workspace_premium</mat-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{certificates.length}}</div>
            <div class="stat-label">Certificates</div>
          </div>
          <div class="stat-badge certificates-badge">Certs</div>
        </mat-card>
      </div>

      <!-- Main Content -->
      <mat-card class="content-card">
        <mat-tab-group>
          <!-- Profile Tab -->
          <mat-tab label="Profile">
            <div class="tab-content">
              <div class="profile-details">
                <h2>Personal Information</h2>
                
                <div class="details-grid">
                  <div class="detail-item">
                    <span class="label">Full Name</span>
                    <span class="value">{{student?.name || 'N/A'}}</span>
                  </div>

                  <div class="detail-item">
                    <span class="label">Roll Number</span>
                    <span class="value">{{student?.rollNumber || 'N/A'}}</span>
                  </div>

                  <div class="detail-item">
                    <span class="label">Student ID</span>
                    <span class="value">{{student?.studentId || student?.rollNumber || 'N/A'}}</span>
                  </div>

                  <div class="detail-item">
                    <span class="label">Email</span>
                    <span class="value">{{student?.email || 'N/A'}}</span>
                  </div>

                  <div class="detail-item">
                    <span class="label">Department</span>
                    <span class="value">{{student?.department || 'N/A'}}</span>
                  </div>

                  <div class="detail-item">
                    <span class="label">Enrollment Year</span>
                    <span class="value">{{student?.enrollmentYear || 'N/A'}}</span>
                  </div>

                  <div class="detail-item">
                    <span class="label">Admission Category</span>
                    <span class="value">{{student?.admissionCategory || 'N/A'}}</span>
                  </div>

                  <div class="detail-item">
                    <span class="label">Current CGPA</span>
                    <span class="value">{{student?.currentCGPA?.toFixed(2) || '0.00'}}</span>
                  </div>

                  <div class="detail-item">
                    <span class="label">Total Credits Earned</span>
                    <span class="value">{{student?.totalCreditsEarned || 0}}</span>
                  </div>

                  <div class="detail-item">
                    <span class="label">Status</span>
                    <span class="value">
                      <mat-chip [class]="getStatusClass(student?.status || '')">
                        {{student?.status || 'N/A'}}
                      </mat-chip>
                    </span>
                  </div>

                  <div class="detail-item">
                    <span class="label">Created At</span>
                    <span class="value">{{formatDate(student?.createdAt)}}</span>
                  </div>

                  <div class="detail-item">
                    <span class="label">Last Modified</span>
                    <span class="value">{{formatDate(student?.modifiedAt)}}</span>
                  </div>
                </div>
              </div>
            </div>
          </mat-tab>

          <!-- Academic Records Tab -->
          <mat-tab label="Academic Records">
            <div class="tab-content">
              <div class="tab-header">
                <h2>Academic Records ({{records.length}})</h2>
                <button mat-raised-button color="primary" (click)="loadRecords()">
                  <mat-icon>refresh</mat-icon>
                  Refresh
                </button>
              </div>

              <div *ngIf="records.length > 0; else noRecords" class="records-list">
                <div *ngFor="let record of records" class="record-card">
                  <div class="record-header">
                    <div class="record-title-section">
                      <div class="semester-badge">
                        <mat-icon>calendar_month</mat-icon>
                        <span>Semester {{record.semester}}</span>
                      </div>
                      <div class="record-meta">
                        <span class="record-id">
                          <mat-icon>fingerprint</mat-icon>
                          {{record.recordId}}
                        </span>
                        <span class="record-dept">
                          <mat-icon>domain</mat-icon>
                          {{record.department}}
                        </span>
                      </div>
                    </div>
                    <div class="record-stats">
                      <mat-chip class="status-chip" [class]="getStatusClass(record.status)">
                        <mat-icon>{{getStatusIcon(record.status)}}</mat-icon>
                        {{record.status}}
                      </mat-chip>
                      <div class="gpa-badges">
                        <div class="gpa-badge sgpa">
                          <span class="gpa-label">SGPA</span>
                          <span class="gpa-value">{{record.sgpa.toFixed(2) || '0.00'}}</span>
                        </div>
                        <div class="gpa-badge cgpa">
                          <span class="gpa-label">CGPA</span>
                          <span class="gpa-value">{{record.cgpa.toFixed(2) || '0.00'}}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="courses-table" *ngIf="record.courses && record.courses.length > 0">
                    <table>
                      <thead>
                        <tr>
                          <th>Course Code</th>
                          <th>Course Name</th>
                          <th>Credits</th>
                          <th>Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let course of record.courses">
                          <td>{{course.courseCode}}</td>
                          <td>{{course.courseName}}</td>
                          <td>{{course.credits}}</td>
                          <td><strong>{{course.grade}}</strong></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- Approval Pipeline (new) -->
                  <div class="approval-pipeline" *ngIf="record.status !== 'DRAFT'">
                    <div class="pipeline-label">Approval Pipeline</div>
                    <div class="pipeline-steps">
                      <div class="pipeline-step" *ngFor="let step of getApprovalSteps(record.status)"
                           [class.done]="step.done" [class.active]="step.active">
                        <div class="step-dot">{{ step.done ? '✓' : (step.active ? '●' : '') }}</div>
                        <div class="step-name">{{ step.label }}</div>
                      </div>
                    </div>
                  </div>

                  <div class="record-footer">
                    <div class="record-summary">
                      <span class="credits">Total Credits: {{record.totalCredits || 0}}</span>
                      <span class="sgpa">SGPA: {{record.sgpa.toFixed(2) || '0.00'}}</span>
                      <span class="cgpa">CGPA: {{record.cgpa.toFixed(2) || '0.00'}}</span>
                    </div>
                    <div class="record-actions">
                      <button mat-stroked-button color="primary" (click)="downloadRecord(record)">
                        <mat-icon>download</mat-icon>
                        Download
                      </button>
                      <button mat-stroked-button color="accent" (click)="shareRecord(record)">
                        <mat-icon>share</mat-icon>
                        Share
                      </button>
                    </div>
                    <span class="submission-date">
                      Submitted: {{formatDate(record.timestamp)}}
                    </span>
                  </div>
                </div>
              </div>

              <ng-template #noRecords>
                <div class="empty-state">
                  <mat-icon>assignment_late</mat-icon>
                  <h3>No Academic Records</h3>
                  <p>Academic records will appear here once submitted and approved</p>
                </div>
              </ng-template>
            </div>
          </mat-tab>

          <!-- Certificates Tab -->
          <mat-tab label="Certificates">
            <div class="tab-content">
              <div class="tab-header">
                <h2>Certificates ({{certificates.length}})</h2>
                <button mat-raised-button color="primary" (click)="loadCertificates()">
                  <mat-icon>refresh</mat-icon>
                  Refresh
                </button>
              </div>

              <div *ngIf="certificates.length > 0; else noCertificates" class="certificates-grid">
                <mat-card *ngFor="let cert of certificates" class="certificate-card">
                  <div class="cert-icon">
                    <mat-icon>workspace_premium</mat-icon>
                  </div>
                  <h3>{{cert.degreeAwarded || cert.type || 'Certificate'}}</h3>
                  <p class="cert-id">ID: {{cert.certificateId}}</p>
                  <div class="cert-details">
                    <p><strong>Student:</strong> {{cert.studentId}}</p>
                    <p *ngIf="cert.finalCGPA"><strong>Final CGPA:</strong> {{cert.finalCGPA.toFixed(2)}}</p>
                    <p><strong>Issued:</strong> {{formatDate(cert.issueDate)}}</p>
                    <p *ngIf="cert.expiryDate"><strong>Expires:</strong> {{formatDate(cert.expiryDate)}}</p>
                    <p><strong>Status:</strong> 
                      <mat-chip [class]="cert.isValid ? 'status-approved' : 'status-rejected'">
                        {{cert.isValid ? 'VALID' : (cert.revoked ? 'REVOKED' : 'EXPIRED')}}
                      </mat-chip>
                    </p>
                    <p *ngIf="cert.revoked && cert.revocationReason">
                      <strong>Reason:</strong> {{cert.revocationReason}}
                    </p>
                  </div>
                  <div class="cert-actions">
                    <button mat-button color="primary" (click)="viewCertificate(cert)">
                      <mat-icon>visibility</mat-icon>
                      View
                    </button>
                    <button mat-button color="accent" (click)="downloadCertificate(cert)" [disabled]="!cert.isValid">
                      <mat-icon>download</mat-icon>
                      Download
                    </button>
                  </div>
                </mat-card>
              </div>

              <ng-template #noCertificates>
                <div class="empty-state">
                  <mat-icon>card_membership</mat-icon>
                  <h3>No Certificates Yet</h3>
                  <p>Certificates will be available here once issued by the administration</p>
                </div>
              </ng-template>
            </div>
          </mat-tab>
        </mat-tab-group>
      </mat-card>
    </div>

    <ng-template #loadingTemplate>
      <div class="loading-container">
        <mat-spinner></mat-spinner>
        <p>Loading student data...</p>
      </div>
    </ng-template>
  `,
  styles: [`
    /* Container & Background */
    .profile-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      padding: 2rem;
      position: relative;
      overflow-x: hidden;
    }

    /* Animated Background Shapes */
    .bg-shapes {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      z-index: 0;
      pointer-events: none;
    }

    .shape {
      position: absolute;
      opacity: 0.1;
      animation: float 25s infinite ease-in-out;
    }

    .shape-1 {
      width: 300px;
      height: 300px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      top: 10%;
      left: 10%;
      animation-delay: 0s;
    }

    .shape-2 {
      width: 400px;
      height: 400px;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
      top: 50%;
      right: 10%;
      animation-delay: 5s;
    }

    .shape-3 {
      width: 250px;
      height: 250px;
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      border-radius: 63% 37% 54% 46% / 55% 48% 52% 45%;
      bottom: 10%;
      left: 20%;
      animation-delay: 10s;
    }

    @keyframes float {
      0%, 100% {
        transform: translate(0, 0) rotate(0deg);
      }
      25% {
        transform: translate(30px, -50px) rotate(90deg);
      }
      50% {
        transform: translate(-20px, 30px) rotate(180deg);
      }
      75% {
        transform: translate(50px, 20px) rotate(270deg);
      }
    }

    /* Header Styles */
    .profile-header {
      position: relative;
      z-index: 1;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 24px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
      margin-bottom: 2rem;
      overflow: hidden;
    }

    .profile-header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
    }

    .header-content {
      padding: 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1.5rem;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      flex: 1;
    }

    .back-button {
      background: rgba(102, 126, 234, 0.1);
      color: #667eea;
      transition: all 0.3s ease;
    }

    .back-button:hover {
      background: rgba(102, 126, 234, 0.2);
      transform: translateX(-5px);
    }

    .logo-wrapper {
      position: relative;
    }

    .avatar-circle {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
      animation: pulse 3s infinite;
    }

    .avatar-circle mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: white;
    }

    @keyframes pulse {
      0%, 100% {
        box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
      }
      50% {
        box-shadow: 0 8px 32px rgba(102, 126, 234, 0.5);
      }
    }

    .student-info {
      flex: 1;
    }

    .welcome-text {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }

    .welcome-text h1 {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 700;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .dashboard-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #667eea;
    }

    .student-meta {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 1rem;
      font-size: 0.875rem;
      color: #666;
    }

    .student-meta > span {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }

    .student-meta mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #667eea;
    }

    .roll-number {
      font-weight: 600;
      color: #667eea;
    }

    .status-chip {
      font-size: 0.75rem;
      height: 24px;
      padding: 0 12px;
      font-weight: 600;
    }

    .header-actions {
      display: flex;
      gap: 1rem;
    }

    .action-btn {
      border-radius: 12px;
      padding: 0 24px;
      height: 44px;
      font-weight: 600;
      transition: all 0.3s ease;
    }

    .action-btn mat-icon {
      margin-right: 8px;
    }

    .action-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
    }

    /* Stats Cards */
    .stats-cards {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      position: relative;
      padding: 1.75rem;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
      cursor: pointer;
    }

    .stat-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .stat-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
    }

    .stat-card:hover::before {
      opacity: 1;
    }

    .stat-icon-wrapper {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
      position: relative;
      overflow: hidden;
    }

    .stat-icon-wrapper::before {
      content: '';
      position: absolute;
      inset: 0;
      opacity: 0.1;
      transition: opacity 0.3s ease;
    }

    .stat-card:hover .stat-icon-wrapper::before {
      opacity: 0.2;
    }

    .stat-icon-wrapper.cgpa {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .stat-icon-wrapper.credits {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }

    .stat-icon-wrapper.records {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    }

    .stat-icon-wrapper.certificates {
      background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
    }

    .stat-icon-wrapper mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: white;
      z-index: 1;
    }

    .stat-content {
      flex: 1;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 0.25rem;
      line-height: 1;
    }

    .stat-label {
      font-size: 0.875rem;
      color: #64748b;
      font-weight: 500;
    }

    .stat-badge {
      position: absolute;
      top: 1rem;
      right: 1rem;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 600;
      opacity: 0.6;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .cgpa-badge {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .credits-badge {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
    }

    .records-badge {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      color: white;
    }

    .certificates-badge {
      background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
      color: white;
    }

    /* Main Content Card */
    .content-card {
      position: relative;
      z-index: 1;
      border-radius: 24px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
      margin-bottom: 2rem;
      overflow: hidden;
    }

    /* Material Tabs Customization */
    .content-card ::ng-deep .mat-mdc-tab-group {
      font-family: inherit;
    }

    .content-card ::ng-deep .mat-mdc-tab-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 24px 24px 0 0;
    }

    .content-card ::ng-deep .mat-mdc-tab-labels {
      padding: 0 1rem;
    }

    .content-card ::ng-deep .mat-mdc-tab {
      color: rgba(255, 255, 255, 0.7);
      font-weight: 600;
      min-width: 120px;
      height: 56px;
    }

    .content-card ::ng-deep .mat-mdc-tab.mdc-tab--active {
      color: white;
    }

    .content-card ::ng-deep .mat-mdc-tab:hover {
      color: white;
      background: rgba(255, 255, 255, 0.1);
    }

    .content-card ::ng-deep .mdc-tab-indicator__content--underline {
      border-color: white;
      border-width: 3px;
    }

    .content-card ::ng-deep .mat-mdc-tab-body-content {
      overflow-x: hidden;
    }

    /* Tab Content */
    .tab-content {
      padding: 2rem;
    }

    .tab-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .tab-header h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: #1a1a2e;
    }

    .tab-header button {
      border-radius: 12px;
      font-weight: 600;
    }

    /* Profile Details */
    .profile-details h2 {
      margin: 0 0 2rem 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: #1a1a2e;
    }

    .details-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    .detail-item {
      padding: 1.25rem;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
      border-radius: 12px;
      border-left: 4px solid #667eea;
      transition: all 0.3s ease;
    }

    .detail-item:hover {
      transform: translateX(5px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
    }

    .detail-item .label {
      display: block;
      font-size: 0.75rem;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.5px;
      margin-bottom: 0.5rem;
    }

    .detail-item .value {
      display: block;
      font-size: 1rem;
      color: #1a1a2e;
      font-weight: 600;
    }

    /* Academic Records */
    .records-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .record-card {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.03) 0%, rgba(118, 75, 162, 0.03) 100%);
      border-radius: 16px;
      padding: 1.5rem;
      border: 2px solid rgba(102, 126, 234, 0.1);
      transition: all 0.3s ease;
    }

    .record-card:hover {
      border-color: #667eea;
      box-shadow: 0 8px 24px rgba(102, 126, 234, 0.15);
      transform: translateY(-4px);
    }

    .record-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.25rem;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .record-title-section {
      flex: 1;
    }

    .semester-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 12px;
      font-weight: 600;
      font-size: 1rem;
      margin-bottom: 0.75rem;
    }

    .semester-badge mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .record-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      font-size: 0.875rem;
      color: #64748b;
    }

    .record-meta > span {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }

    .record-meta mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #667eea;
    }

    .record-stats {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.75rem;
    }

    .status-chip mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-right: 4px;
    }

    .gpa-badges {
      display: flex;
      gap: 0.75rem;
    }

    .gpa-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0.5rem 1rem;
      border-radius: 12px;
      min-width: 80px;
    }

    .gpa-badge.sgpa {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
      border: 2px solid rgba(102, 126, 234, 0.3);
    }

    .gpa-badge.cgpa {
      background: linear-gradient(135deg, rgba(240, 147, 251, 0.1) 0%, rgba(245, 87, 108, 0.1) 100%);
      border: 2px solid rgba(240, 147, 251, 0.3);
    }

    .gpa-label {
      font-size: 0.7rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .gpa-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: #667eea;
      margin-top: 0.25rem;
    }

    /* Courses Table */
    .courses-table {
      margin: 1.5rem 0;
      overflow-x: auto;
      border-radius: 12px;
    }

    .courses-table table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .courses-table th,
    .courses-table td {
      padding: 1rem;
      text-align: left;
    }

    .courses-table thead {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .courses-table th {
      color: white;
      font-weight: 600;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .courses-table tbody tr {
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      transition: background 0.2s ease;
    }

    .courses-table tbody tr:hover {
      background: rgba(102, 126, 234, 0.05);
    }

    .courses-table tbody tr:last-child {
      border-bottom: none;
    }

    .courses-table td {
      color: #1a1a2e;
      font-size: 0.875rem;
    }

    .courses-table td strong {
      color: #667eea;
      font-size: 1rem;
    }

    /* ── Approval Pipeline Timeline ─────────────────────────── */
    .approval-pipeline {
      margin: 1rem 0 0.5rem;
      padding: 1rem 0.5rem;
      border-top: 1px solid rgba(102, 126, 234, 0.12);
    }
    .pipeline-label {
      font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.8px; color: #64748b; margin-bottom: 0.75rem;
    }
    .pipeline-steps {
      display: flex; gap: 0; position: relative;
      justify-content: space-between;
    }
    .pipeline-steps::before {
      content: ''; position: absolute; top: 14px; left: 0; right: 0;
      height: 2px; background: #e2e8f0; z-index: 0;
    }
    .pipeline-step {
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      flex: 1; position: relative; z-index: 1;
    }
    .step-dot {
      width: 28px; height: 28px; border-radius: 50%;
      background: #e2e8f0; border: 2px solid #cbd5e1;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 700; color: #94a3b8;
      transition: all 0.3s;
    }
    .pipeline-step.done .step-dot {
      background: linear-gradient(135deg, #667eea, #764ba2);
      border-color: #667eea; color: white;
    }
    .pipeline-step.active .step-dot {
      background: white; border: 2.5px solid #f59e0b;
      color: #f59e0b; box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.2);
      animation: pulseDot 1.5s infinite;
    }
    @keyframes pulseDot {
      0%,100% { box-shadow: 0 0 0 4px rgba(245,158,11,0.2); }
      50% { box-shadow: 0 0 0 8px rgba(245,158,11,0.1); }
    }
    .step-name {
      font-size: 0.65rem; font-weight: 600; color: #94a3b8;
      text-align: center; white-space: nowrap;
    }
    .pipeline-step.done .step-name { color: #667eea; }
    .pipeline-step.active .step-name { color: #f59e0b; font-weight: 700; }

    .record-footer {

      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 1.25rem;
      padding-top: 1.25rem;
      border-top: 2px solid rgba(102, 126, 234, 0.1);
      flex-wrap: wrap;
      gap: 1rem;
    }

    .record-summary {
      display: flex;
      gap: 1.5rem;
      flex-wrap: wrap;
      font-size: 0.875rem;
      font-weight: 600;
      color: #64748b;
    }

    .record-summary .credits,
    .record-summary .sgpa,
    .record-summary .cgpa {
      color: #667eea;
    }

    .record-actions {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .record-actions button {
      height: 36px !important;
      font-size: 0.875rem !important;
      font-weight: 600 !important;
      border-radius: 8px !important;
      border-width: 2px !important;
      transition: all 0.3s ease !important;
    }

    .record-actions button mat-icon {
      font-size: 1.125rem;
      width: 1.125rem;
      height: 1.125rem;
      margin-right: 4px;
    }

    .record-actions button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .submission-date {
      font-size: 0.8rem;
      color: #94a3b8;
      font-style: italic;
    }

    /* Certificates Grid */
    .certificates-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .certificate-card {
      position: relative;
      padding: 2rem 1.5rem;
      border-radius: 16px;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.03) 0%, rgba(118, 75, 162, 0.03) 100%);
      border: 2px solid rgba(102, 126, 234, 0.1);
      transition: all 0.3s ease;
      text-align: center;
    }

    .certificate-card:hover {
      border-color: #667eea;
      box-shadow: 0 12px 32px rgba(102, 126, 234, 0.2);
      transform: translateY(-8px);
    }

    .cert-icon {
      margin-bottom: 1rem;
      position: relative;
    }

    .cert-icon mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: pulse 3s infinite;
    }

    .certificate-card h3 {
      margin: 0 0 0.75rem 0;
      font-size: 1.25rem;
      font-weight: 700;
      color: #1a1a2e;
    }

    .cert-id {
      font-size: 0.75rem;
      color: #64748b;
      margin-bottom: 1rem;
      font-family: monospace;
    }

    .cert-details {
      margin: 1.25rem 0;
      padding: 1rem;
      background: white;
      border-radius: 12px;
      text-align: left;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .cert-details p {
      margin: 0.5rem 0;
      font-size: 0.875rem;
      color: #64748b;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .cert-details strong {
      color: #1a1a2e;
      font-weight: 600;
    }

    .cert-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
      margin-top: 1.25rem;
    }

    .cert-actions button {
      border-radius: 12px;
      font-weight: 600;
      transition: all 0.3s ease;
    }

    .cert-actions button:hover:not([disabled]) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
    }

    .empty-state mat-icon {
      font-size: 80px;
      width: 80px;
      height: 80px;
      color: #cbd5e1;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      margin: 0 0 0.75rem 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #64748b;
    }

    .empty-state p {
      margin: 0;
      color: #94a3b8;
      font-size: 0.875rem;
    }

    /* Status Chips */
    mat-chip.status-pending,
    mat-chip.status-submitted {
      background-color: #FFF9C4 !important;
      color: #F57F17 !important;
    }

    mat-chip.status-approved,
    mat-chip.status-active {
      background-color: #C8E6C9 !important;
      color: #2E7D32 !important;
    }

    mat-chip.status-rejected {
      background-color: #FFCDD2 !important;
      color: #C62828 !important;
    }

    mat-chip.status-draft {
      background-color: #E3F2FD !important;
      color: #1565C0 !important;
    }

    /* Loading State */
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    }

    .loading-container p {
      margin-top: 1.5rem;
      color: #64748b;
      font-size: 1rem;
      font-weight: 500;
    }

    /* Responsive Design */
    @media (max-width: 1024px) {
      .stats-cards {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .profile-container {
        padding: 1rem;
      }

      .header-content {
        padding: 1.5rem;
        flex-direction: column;
        align-items: stretch;
      }

      .header-left {
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .student-meta {
        flex-direction: column;
        align-items: center;
      }

      .header-actions {
        flex-direction: column;
        width: 100%;
      }

      .action-btn {
        width: 100%;
      }

      .stats-cards {
        grid-template-columns: 1fr;
      }

      .tab-content {
        padding: 1.5rem;
      }

      .details-grid {
        grid-template-columns: 1fr;
      }

      .record-header {
        flex-direction: column;
        align-items: stretch;
      }

      .record-stats {
        align-items: flex-start;
      }

      .gpa-badges {
        width: 100%;
      }

      .gpa-badge {
        flex: 1;
      }

      .certificates-grid {
        grid-template-columns: 1fr;
      }

      .courses-table {
        font-size: 0.8rem;
      }

      .courses-table th,
      .courses-table td {
        padding: 0.75rem 0.5rem;
      }
    }

    @media (max-width: 480px) {
      .welcome-text h1 {
        font-size: 1.25rem;
      }

      .stat-value {
        font-size: 1.5rem;
      }

      .tab-header {
        flex-direction: column;
        align-items: stretch;
      }

      .tab-header button {
        width: 100%;
      }
    }
  `]
})
export class StudentProfileComponent implements OnInit {
  student: Student | null = null;
  records: AcademicRecord[] = [];
  certificates: Certificate[] = [];
  currentUser = this.authService.currentUser;
  rollNumber: string | null = null;
  loading = true;
  isViewingAsAdmin = false;

  constructor(
    private authService: AuthService,
    private blockchainService: BlockchainService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    // Get roll number from route params or use current user
    this.route.params.subscribe(params => {
      this.rollNumber = params['rollNumber'];

      // Check if viewing as admin (route contains rollNumber param)
      this.isViewingAsAdmin = !!this.rollNumber && this.currentUser?.role === 'admin';

      // If no roll number in params, use current user's ID
      if (!this.rollNumber) {
        this.rollNumber = this.currentUser?.userId || null;
      }

      if (this.rollNumber) {
        this.loadStudentData();
      } else {
        this.snackBar.open('Unable to identify student', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  loadStudentData(): void {
    if (!this.rollNumber) return;

    this.loading = true;

    // Load all data in parallel
    Promise.all([
      this.loadStudentProfile(),
      this.loadRecords(),
      this.loadCertificates()
    ]).then(() => {
      this.loading = false;
    }).catch(error => {
      console.error('Error loading student data:', error);
      this.loading = false;
      this.snackBar.open('Error loading student data', 'Close', { duration: 3000 });
    });
  }

  loadStudentProfile(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.rollNumber) {
        reject('No roll number');
        return;
      }

      this.blockchainService.getStudent(this.rollNumber).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.student = response.data;
            console.log('Loaded student:', this.student);
          }
          resolve();
        },
        error: (error) => {
          console.error('Error loading student profile:', error);
          reject(error);
        }
      });
    });
  }

  loadRecords(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.rollNumber) {
        reject('No roll number');
        return;
      }

      this.blockchainService.getStudentRecords(this.rollNumber).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.records = response.data;
            console.log('Loaded academic records:', this.records);
          }
          resolve();
        },
        error: (error) => {
          console.error('Error loading records:', error);
          // Don't reject - student might have no records
          this.records = [];
          resolve();
        }
      });
    });
  }

  loadCertificates(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.rollNumber) {
        reject('No roll number');
        return;
      }

      this.blockchainService.getStudentCertificates(this.rollNumber).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.certificates = response.data;
            console.log('Loaded certificates:', this.certificates);
          }
          resolve();
        },
        error: (error) => {
          console.error('Error loading certificates:', error);
          // Don't reject - student might have no certificates
          this.certificates = [];
          resolve();
        }
      });
    });
  }

  getStatusClass(status: string): string {
    if (!status) return '';
    const statusUpper = status.toUpperCase();
    switch (statusUpper) {
      case 'DRAFT': return 'status-draft';
      case 'SUBMITTED': return 'status-submitted';
      case 'APPROVED': return 'status-approved';
      case 'REJECTED': return 'status-rejected';
      case 'ACTIVE': return 'status-active';
      default: return '';
    }
  }

  /**
   * Returns a 6-step pipeline array for the approval status timeline in the template.
   * Each step has: label, done (fully completed), active (current in-progress step).
   */
  getApprovalSteps(status: string): Array<{ label: string, done: boolean, active: boolean }> {
    const stages = ['SUBMITTED', 'FACULTY_APPROVED', 'HOD_APPROVED', 'DAC_APPROVED', 'ES_APPROVED', 'APPROVED'];
    const labels = ['Submitted', 'Faculty', 'HOD', 'DAC', 'Exam Sec.', 'Dean ✓'];
    const idx = stages.indexOf(status);
    return stages.map((s, i) => ({
      label: labels[i],
      done: i < idx || status === 'APPROVED',
      active: i === idx && status !== 'APPROVED'
    }));
  }

  getStatusIcon(status: string): string {

    if (!status) return 'help';
    const statusUpper = status.toUpperCase();
    switch (statusUpper) {
      case 'DRAFT': return 'edit';
      case 'SUBMITTED': return 'schedule';
      case 'APPROVED': return 'check_circle';
      case 'REJECTED': return 'cancel';
      case 'ACTIVE': return 'check_circle';
      default: return 'help';
    }
  }

  viewCertificate(cert: Certificate): void {
    this.snackBar.open(`Certificate: ${cert.certificateId || cert.type}`, 'Close', { duration: 3000 });
  }

  downloadCertificate(cert: Certificate): void {
    if (!cert.isValid || cert.revoked) {
      this.snackBar.open('Cannot download invalid or revoked certificate', 'Close', { duration: 3000 });
      return;
    }
    // Try backend Puppeteer PDF first, fall back to jsPDF
    const token = localStorage.getItem('access_token');
    const certId = cert.certificateId;
    const baseUrl = 'http://localhost:3000/api/v1';
    this.snackBar.open('Generating PDF certificate...', '', { duration: 2000 });
    this.http.post(`${baseUrl}/pdf/generate/${certId}`, {}, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob',
      params: { studentId: this.rollNumber || '', recordId: cert.recordId || '' }
    }).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `certificate-${certId}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.snackBar.open('✅ Certificate downloaded!', 'Close', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Backend PDF unavailable — generating locally...', '', { duration: 1500 });
        this.generateCertificatePDF(cert);
      }
    });
  }

  async generateCertificatePDF(cert: Certificate): Promise<void> {
    const pdf = new jsPDF('landscape', 'mm', 'a4');

    // Generate QR Code
    const verifyUrl = getVerificationUrl('certificate', cert.certificateId);
    const qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: APP_CONFIG.qrCode.size,
      margin: APP_CONFIG.qrCode.margin,
      errorCorrectionLevel: APP_CONFIG.qrCode.errorCorrectionLevel
    });

    // Border
    pdf.setLineWidth(2);
    pdf.setDrawColor(63, 81, 181);
    pdf.rect(10, 10, 277, 190);

    pdf.setLineWidth(0.5);
    pdf.rect(15, 15, 267, 180);

    // Watermark
    pdf.setFontSize(60);
    pdf.setTextColor(63, 81, 181);
    pdf.setGState(new (pdf as any).GState({ opacity: 0.03 }));
    pdf.text('NIT WARANGAL', 148.5, 105, { align: 'center', angle: 45 });
    pdf.setGState(new (pdf as any).GState({ opacity: 1 }));
    pdf.setTextColor(0, 0, 0);

    // Header
    pdf.setTextColor(63, 81, 181);
    pdf.setFontSize(32);
    pdf.setFont('helvetica', 'bold');
    pdf.text('🎓', 148.5, 35, { align: 'center' });

    pdf.setFontSize(24);
    pdf.text(APP_CONFIG.app.instituteName, 148.5, 45, { align: 'center' });

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(102, 102, 102);
    pdf.text('An Institute of National Importance', 148.5, 52, { align: 'center' });

    // Certificate Title
    pdf.setFontSize(28);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(63, 81, 181);
    pdf.text(`${cert.type} CERTIFICATE`, 148.5, 68, { align: 'center' });

    // Content
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    pdf.text('This is to certify that', 148.5, 82, { align: 'center' });

    // Student Name
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text(this.student?.name || 'N/A', 148.5, 95, { align: 'center' });

    // Details
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Roll Number: ${this.student?.rollNumber || 'N/A'}`, 148.5, 105, { align: 'center' });

    if (cert.degreeAwarded) {
      pdf.text(`has been awarded`, 148.5, 112, { align: 'center' });
      pdf.setFont('helvetica', 'bold');
      pdf.text(cert.degreeAwarded, 148.5, 119, { align: 'center' });
      pdf.setFont('helvetica', 'normal');
    }

    // Certificate Details Box
    let yPos = 135;
    pdf.setFillColor(248, 249, 250);
    pdf.rect(40, yPos - 5, 180, cert.finalCGPA ? 35 : 30, 'F');

    pdf.setFontSize(11);
    pdf.text(`Certificate ID: ${cert.certificateId}`, 50, yPos);
    yPos += 6;
    pdf.text(`Department: ${this.student?.department || 'N/A'}`, 50, yPos);
    yPos += 6;
    if (cert.finalCGPA) {
      pdf.text(`CGPA: ${cert.finalCGPA.toFixed(2)}`, 50, yPos);
      yPos += 6;
    }
    pdf.text(`Issue Date: ${this.formatDate(cert.issueDate)}`, 50, yPos);
    yPos += 6;
    if (cert.expiryDate) {
      pdf.text(`Expiry Date: ${this.formatDate(cert.expiryDate)}`, 50, yPos);
      yPos += 6;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(cert.isValid ? 76 : 244, cert.isValid ? 175 : 67, cert.isValid ? 80 : 54);
    pdf.text(`Status: ${cert.isValid ? 'VALID' : 'INVALID'}`, 50, yPos);
    pdf.setTextColor(0, 0, 0);

    // Signatures
    pdf.setFont('helvetica', 'normal');
    pdf.line(50, 180, 100, 180);
    pdf.text('Admin', 75, 185, { align: 'center' });

    pdf.line(197, 180, 247, 180);
    pdf.text('Director', 222, 185, { align: 'center' });

    // QR Code
    pdf.addImage(qrCodeDataUrl, 'PNG', 230, 130, 35, 35);
    pdf.setFontSize(8);
    pdf.setTextColor(102, 102, 102);
    pdf.text('Scan to verify', 247.5, 168, { align: 'center' });

    // Footer
    pdf.setFontSize(9);
    pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 195);

    // Save
    pdf.save(`Certificate_${cert.certificateId}_${this.student?.rollNumber}.pdf`);

    this.snackBar.open('Certificate downloaded successfully!', 'Close', { duration: 3000 });
  }

  formatDate(dateValue: any): string {
    if (!dateValue) return 'N/A';

    try {
      // Handle ISO date string
      if (typeof dateValue === 'string') {
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
        }
      }

      // Handle timestamp object (Go's time.Time)
      if (typeof dateValue === 'object' && dateValue.seconds) {
        const date = new Date(dateValue.seconds * 1000);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }

      return new Date(dateValue).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  }

  async downloadRecord(record: any): Promise<void> {
    const pdf = new jsPDF();

    // Generate QR Code for verification
    const verifyUrl = getVerificationUrl('record', record.recordId);
    const qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 60,
      margin: APP_CONFIG.qrCode.margin,
      errorCorrectionLevel: APP_CONFIG.qrCode.errorCorrectionLevel
    });

    // Title
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ACADEMIC RECORD', 105, 20, { align: 'center' });

    // Header line
    pdf.setLineWidth(0.5);
    pdf.line(20, 25, 190, 25);

    // Student Information
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    let yPos = 35;

    pdf.setFont('helvetica', 'bold');
    pdf.text('Student Information:', 20, yPos);
    yPos += 8;

    pdf.setFont('helvetica', 'normal');
    pdf.text(`Name: ${this.student?.name || 'N/A'}`, 20, yPos);
    yPos += 6;
    pdf.text(`Roll Number: ${this.student?.rollNumber || 'N/A'}`, 20, yPos);
    yPos += 6;
    pdf.text(`Department: ${record.department}`, 20, yPos);
    yPos += 6;
    pdf.text(`Record ID: ${record.recordId}`, 20, yPos);
    yPos += 10;

    // Academic Details
    pdf.setFont('helvetica', 'bold');
    pdf.text('Academic Details:', 20, yPos);
    yPos += 8;

    pdf.setFont('helvetica', 'normal');
    pdf.text(`Semester: ${record.semester}`, 20, yPos);
    yPos += 6;
    pdf.text(`Year: ${record.year || 'N/A'}`, 20, yPos);
    yPos += 6;
    pdf.text(`Status: ${record.status}`, 20, yPos);
    yPos += 6;
    pdf.text(`Submitted: ${this.formatDate(record.timestamp)}`, 20, yPos);
    yPos += 12;

    // Courses Table
    pdf.setFont('helvetica', 'bold');
    pdf.text('Courses:', 20, yPos);
    yPos += 8;

    // Table headers
    pdf.setFillColor(102, 126, 234);
    pdf.rect(20, yPos - 5, 170, 8, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Course Code', 25, yPos);
    pdf.text('Course Name', 65, yPos);
    pdf.text('Credits', 140, yPos);
    pdf.text('Grade', 165, yPos);
    yPos += 8;

    // Table rows
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');

    record.courses.forEach((course: any, index: number) => {
      if (yPos > 270) {
        pdf.addPage();
        yPos = 20;
      }

      // Alternate row colors
      if (index % 2 === 0) {
        pdf.setFillColor(248, 249, 250);
        pdf.rect(20, yPos - 5, 170, 7, 'F');
      }

      pdf.text(course.courseCode, 25, yPos);
      const courseName = course.courseName.length > 35 ? course.courseName.substring(0, 35) + '...' : course.courseName;
      pdf.text(courseName, 65, yPos);
      pdf.text(String(course.credits), 140, yPos);
      pdf.text(course.grade, 165, yPos);
      yPos += 7;
    });

    yPos += 5;
    pdf.setLineWidth(0.5);
    pdf.line(20, yPos, 190, yPos);
    yPos += 8;

    // Summary
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text(`Total Credits: ${record.totalCredits}`, 20, yPos);
    yPos += 8;
    pdf.text(`SGPA: ${record.sgpa.toFixed(2)}`, 20, yPos);
    yPos += 8;
    pdf.text(`CGPA: ${record.cgpa.toFixed(2)}`, 20, yPos);

    // Add QR Code
    pdf.addImage(qrCodeDataUrl, 'PNG', 160, 35, 30, 30);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Scan to verify', 175, 68, { align: 'center' });

    // Footer
    const pageCount = (pdf as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 285);
      pdf.text(`Page ${i} of ${pageCount}`, 170, 285);
    }

    // Save PDF
    pdf.save(`Academic_Record_${record.recordId}_Sem${record.semester}.pdf`);
  }

  shareRecord(record: any): void {
    const shareText = `Academic Record - Semester ${record.semester}\nSGPA: ${record.sgpa.toFixed(2)} | CGPA: ${record.cgpa.toFixed(2)}\nTotal Credits: ${record.totalCredits}`;

    if (navigator.share) {
      // Use Web Share API if available
      navigator.share({
        title: `Academic Record - Semester ${record.semester}`,
        text: shareText,
        url: window.location.href
      }).catch(err => console.log('Error sharing:', err));
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(`${shareText}\n${window.location.href}`).then(() => {
        alert('Record link copied to clipboard!');
      }).catch(err => {
        console.error('Failed to copy:', err);
        alert('Could not share record. Please try again.');
      });
    }
  }

  goBack(): void {
    if (this.isViewingAsAdmin) {
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.router.navigate(['/']);
    }
  }

  requestCertificate(): void {
    const dialogRef = this.dialog.open(CertificateRequestDialogComponent, {
      width: '600px',
      data: { student: this.student }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Request was submitted successfully
        this.snackBar.open('Certificate request submitted successfully!', 'Close', { duration: 3000 });
        // Optionally reload certificates
        this.loadCertificates();
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/services/auth.service';
import { BlockchainService } from '../../core/services/blockchain.service';
import { DashboardStats, AcademicRecord, Student } from '../../core/models/blockchain.model';
import { environment } from '../../../environments/environment';
import { AddStudentDialogComponent } from './add-student-dialog/add-student-dialog.component';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { NotificationBellComponent } from '../../shared/notification-bell.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTabsModule,
    MatChipsModule,
    MatBadgeModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    NotificationBellComponent
  ],
  template: `
    <div class="dashboard-container">
      <!-- Animated Background -->
      <div class="bg-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
      </div>

      <!-- Header -->
      <div class="dashboard-header">
        <div class="header-content">
          <div class="logo-wrapper">
            <mat-icon class="dashboard-icon">dashboard</mat-icon>
          </div>
          <div class="header-text">
            <h1>Admin Dashboard</h1>
            <p class="welcome-text">
              <mat-icon class="welcome-icon">waving_hand</mat-icon>
              Welcome back, <span class="user-name">{{currentUser?.name}}</span>
            </p>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:12px">
          <app-notification-bell></app-notification-bell>
          <button mat-raised-button class="logout-btn" (click)="logout()">
            <mat-icon>logout</mat-icon>
            Logout
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <mat-card class="stat-card modern-card students-card">
          <div class="stat-icon-wrapper students">
            <mat-icon class="stat-icon">school</mat-icon>
          </div>
          <div class="stat-content">
            <p class="stat-label">Total Students</p>
            <h3 class="stat-value">{{stats?.totalStudents || 0}}</h3>
            <div class="stat-badge">
              <mat-icon>trending_up</mat-icon>
              <span>All Time</span>
            </div>
          </div>
        </mat-card>

        <mat-card class="stat-card modern-card active-card">
          <div class="stat-icon-wrapper active">
            <mat-icon class="stat-icon">person</mat-icon>
          </div>
          <div class="stat-content">
            <p class="stat-label">Active Students</p>
            <h3 class="stat-value">{{stats?.activeStudents || 0}}</h3>
            <div class="stat-badge">
              <mat-icon>check_circle</mat-icon>
              <span>Currently Active</span>
            </div>
          </div>
        </mat-card>

        <mat-card class="stat-card modern-card pending-card">
          <div class="stat-icon-wrapper pending">
            <mat-icon class="stat-icon">pending_actions</mat-icon>
          </div>
          <div class="stat-content">
            <p class="stat-label">Pending Records</p>
            <h3 class="stat-value">{{stats?.pendingRecords || 0}}</h3>
            <div class="stat-badge warning">
              <mat-icon>schedule</mat-icon>
              <span>Awaiting Approval</span>
            </div>
          </div>
        </mat-card>

        <mat-card class="stat-card modern-card certificates-card">
          <div class="stat-icon-wrapper certificates">
            <mat-icon class="stat-icon">verified</mat-icon>
          </div>
          <div class="stat-content">
            <p class="stat-label">Certificates Issued</p>
            <h3 class="stat-value">{{stats?.certificatesIssued || 0}}</h3>
            <div class="stat-badge">
              <mat-icon>workspace_premium</mat-icon>
              <span>Total Issued</span>
            </div>
          </div>
        </mat-card>
      </div>

      <!-- Main Content -->
      <mat-card class="content-card">
        <mat-tab-group>
          <!-- Pending Records Tab -->
          <mat-tab label="Pending Records">
            <div class="tab-content">
              <div class="tab-header">
                <h2>Records Awaiting Approval</h2>
                <button mat-raised-button color="primary" (click)="refreshData()">
                  <mat-icon>refresh</mat-icon>
                  Refresh
                </button>
              </div>

              <div class="table-container" *ngIf="pendingRecords.length > 0; else noPending">
                <table mat-table [dataSource]="pendingRecords" class="records-table">
                  <!-- Record ID Column -->
                  <ng-container matColumnDef="recordId">
                    <th mat-header-cell *matHeaderCellDef>Record ID</th>
                    <td mat-cell *matCellDef="let record">{{record.recordId}}</td>
                  </ng-container>

                  <!-- Student Column -->
                  <ng-container matColumnDef="student">
                    <th mat-header-cell *matHeaderCellDef>Student</th>
                    <td mat-cell *matCellDef="let record">{{record.studentId}}</td>
                  </ng-container>

                  <!-- Department Column -->
                  <ng-container matColumnDef="department">
                    <th mat-header-cell *matHeaderCellDef>Department</th>
                    <td mat-cell *matCellDef="let record">
                      <mat-chip>{{record.department}}</mat-chip>
                    </td>
                  </ng-container>

                  <!-- Semester Column -->
                  <ng-container matColumnDef="semester">
                    <th mat-header-cell *matHeaderCellDef>Semester</th>
                    <td mat-cell *matCellDef="let record">{{record.semester}}</td>
                  </ng-container>

                  <!-- SGPA Column -->
                  <ng-container matColumnDef="sgpa">
                    <th mat-header-cell *matHeaderCellDef>SGPA</th>
                    <td mat-cell *matCellDef="let record">{{record.sgpa}}</td>
                  </ng-container>

                  <!-- Status Column -->
                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>Status</th>
                    <td mat-cell *matCellDef="let record">
                      <mat-chip [class.draft]="record.status === 'DRAFT'" 
                                [class.submitted]="record.status === 'SUBMITTED'">
                        {{record.status}}
                      </mat-chip>
                    </td>
                  </ng-container>

                  <!-- Actions Column -->
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef>Actions</th>
                    <td mat-cell *matCellDef="let record">
                      <button mat-button color="primary" (click)="approveRecord(record)">
                        <mat-icon>check_circle</mat-icon>
                        Approve
                      </button>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
                </table>
              </div>

              <ng-template #noPending>
                <div class="empty-state">
                  <mat-icon>check_circle_outline</mat-icon>
                  <h3>No Pending Records</h3>
                  <p>All academic records have been reviewed</p>
                </div>
              </ng-template>
            </div>
          </mat-tab>

          <!-- Student Management Tab -->
          <mat-tab label="Student Management">
            <div class="tab-content">
              <div class="tab-header">
                <h2>All Students</h2>
                <button mat-raised-button color="primary" (click)="openAddStudentDialog()">
                  <mat-icon>add</mat-icon>
                  Add Student
                </button>
              </div>

              <div *ngIf="loadingStudents" class="loading-container">
                <mat-spinner></mat-spinner>
                <p>Loading students...</p>
              </div>

              <div class="table-container" *ngIf="!loadingStudents && students.length > 0; else noStudents">
                <table mat-table [dataSource]="students" class="records-table">
                  <!-- Roll Number Column -->
                  <ng-container matColumnDef="rollNumber">
                    <th mat-header-cell *matHeaderCellDef>Roll Number</th>
                    <td mat-cell *matCellDef="let student">{{student.rollNumber}}</td>
                  </ng-container>

                  <!-- Name Column -->
                  <ng-container matColumnDef="name">
                    <th mat-header-cell *matHeaderCellDef>Name</th>
                    <td mat-cell *matCellDef="let student">{{student.name}}</td>
                  </ng-container>

                  <!-- Email Column -->
                  <ng-container matColumnDef="email">
                    <th mat-header-cell *matHeaderCellDef>Email</th>
                    <td mat-cell *matCellDef="let student">{{student.email}}</td>
                  </ng-container>

                  <!-- Department Column -->
                  <ng-container matColumnDef="departmentStudent">
                    <th mat-header-cell *matHeaderCellDef>Department</th>
                    <td mat-cell *matCellDef="let student">
                      <mat-chip>{{student.department}}</mat-chip>
                    </td>
                  </ng-container>

                  <!-- Year Column -->
                  <ng-container matColumnDef="year">
                    <th mat-header-cell *matHeaderCellDef>Year</th>
                    <td mat-cell *matCellDef="let student">{{student.enrollmentYear}}</td>
                  </ng-container>

                  <!-- Status Column -->
                  <ng-container matColumnDef="studentStatus">
                    <th mat-header-cell *matHeaderCellDef>Status</th>
                    <td mat-cell *matCellDef="let student">
                      <mat-chip [class.active-status]="student.status === 'ACTIVE'" 
                                [class.graduated-status]="student.status === 'GRADUATED'">
                        {{student.status}}
                      </mat-chip>
                    </td>
                  </ng-container>

                  <!-- Actions Column -->
                  <ng-container matColumnDef="studentActions">
                    <th mat-header-cell *matHeaderCellDef>Actions</th>
                    <td mat-cell *matCellDef="let student">
                      <button mat-icon-button color="primary" (click)="viewStudent(student)" matTooltip="View Details">
                        <mat-icon>visibility</mat-icon>
                      </button>
                      <button mat-icon-button color="accent" (click)="editStudent(student)" matTooltip="Edit">
                        <mat-icon>edit</mat-icon>
                      </button>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="studentColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: studentColumns;"></tr>
                </table>
              </div>

              <ng-template #noStudents>
                <div class="empty-state" *ngIf="!loadingStudents">
                  <mat-icon>people</mat-icon>
                  <h3>No Students Found</h3>
                  <p>Click "Add Student" to register a new student</p>
                </div>
              </ng-template>
            </div>
          </mat-tab>

          <!-- Certificates Tab -->
          <mat-tab label="Certificates">
            <div class="tab-content">
              <div class="tab-header">
                <h2>Issue Certificates</h2>
                <div class="header-actions">
                  <button mat-raised-button color="accent" (click)="syncCertificatesFromBlockchain()" [disabled]="syncingCertificates">
                    <mat-icon>sync</mat-icon>
                    <span *ngIf="!syncingCertificates">Sync from Blockchain</span>
                    <span *ngIf="syncingCertificates">Syncing...</span>
                  </button>
                  <button mat-raised-button color="primary" (click)="openIssueCertificateDialog()">
                    <mat-icon>verified</mat-icon>
                    Issue Certificate
                  </button>
                </div>
              </div>

              <!-- Success Alert -->
              <mat-card *ngIf="lastIssuedCertificate" class="success-alert">
                <div class="alert-content">
                  <mat-icon class="success-icon">check_circle</mat-icon>
                  <div class="alert-details">
                    <h3>✅ Certificate Issued Successfully!</h3>
                    <p><strong>Certificate ID:</strong> {{lastIssuedCertificate.id}}</p>
                    <p><strong>Student ID:</strong> {{lastIssuedCertificate.studentId}}</p>
                    <p><strong>Type:</strong> {{lastIssuedCertificate.type}}</p>
                    <p><strong>Issue Date:</strong> {{lastIssuedCertificate.date}}</p>
                  </div>
                  <button mat-icon-button (click)="lastIssuedCertificate = null">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
              </mat-card>

              <div class="certificate-form" *ngIf="showCertificateForm">
                <mat-card>
                  <h3>Issue New Certificate</h3>
                  <div class="form-grid">
                    <mat-form-field appearance="outline">
                      <mat-label>Student Roll Number</mat-label>
                      <input matInput [(ngModel)]="certificateData.studentId" placeholder="CS21B001">
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Certificate Type</mat-label>
                      <mat-select [(ngModel)]="certificateData.certificateType">
                        <mat-option value="DEGREE">Degree Certificate</mat-option>
                        <mat-option value="PROVISIONAL">Provisional Certificate</mat-option>
                        <mat-option value="TRANSCRIPT">Transcript</mat-option>
                        <mat-option value="BONAFIDE">Bonafide Certificate</mat-option>
                        <mat-option value="MIGRATION">Migration Certificate</mat-option>
                        <mat-option value="CHARACTER">Character Certificate</mat-option>
                        <mat-option value="STUDY_CONDUCT">Study & Conduct Certificate</mat-option>
                      </mat-select>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Issue Date</mat-label>
                      <input matInput type="date" [(ngModel)]="certificateData.issueDate">
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Valid Until (Optional)</mat-label>
                      <input matInput type="date" [(ngModel)]="certificateData.validUntil">
                    </mat-form-field>
                  </div>

                  <div class="form-actions">
                    <button mat-raised-button color="primary" (click)="issueCertificate()">
                      <mat-icon>check</mat-icon>
                      Issue Certificate
                    </button>
                    <button mat-button (click)="cancelCertificateForm()">Cancel</button>
                  </div>
                </mat-card>
              </div>

              <!-- Recently Issued Certificates -->
              <div *ngIf="recentCertificates.length > 0 && !showCertificateForm" class="certificates-section">
                <h3>Recently Issued Certificates ({{recentCertificates.length}})</h3>
                <table mat-table [dataSource]="recentCertificates" class="certificates-table">
                  <ng-container matColumnDef="certificateId">
                    <th mat-header-cell *matHeaderCellDef>Certificate ID</th>
                    <td mat-cell *matCellDef="let cert">{{cert.id}}</td>
                  </ng-container>

                  <ng-container matColumnDef="studentId">
                    <th mat-header-cell *matHeaderCellDef>Student ID</th>
                    <td mat-cell *matCellDef="let cert">{{cert.studentId}}</td>
                  </ng-container>

                  <ng-container matColumnDef="type">
                    <th mat-header-cell *matHeaderCellDef>Type</th>
                    <td mat-cell *matCellDef="let cert">
                      <mat-chip class="cert-chip">{{cert.type}}</mat-chip>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="issueDate">
                    <th mat-header-cell *matHeaderCellDef>Issue Date</th>
                    <td mat-cell *matCellDef="let cert">{{cert.date}}</td>
                  </ng-container>

                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>Status</th>
                    <td mat-cell *matCellDef="let cert">
                      <mat-chip class="active-status">Active</mat-chip>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="certificateColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: certificateColumns;"></tr>
                </table>
              </div>

              <div class="empty-state" *ngIf="!showCertificateForm && recentCertificates.length === 0 && !lastIssuedCertificate">
                <mat-icon>workspace_premium</mat-icon>
                <h3>Certificate Management</h3>
                <p>Issue degree, provisional, and transcript certificates to students</p>
                <button mat-raised-button color="primary" (click)="showCertificateForm = true">
                  <mat-icon>add</mat-icon>
                  Start Issuing
                </button>
              </div>
            </div>
          </mat-tab>

          <!-- Certificate Requests Tab -->
          <mat-tab label="Certificate Requests">
            <div class="tab-content">
              <div class="tab-header">
                <h2>Certificate Requests</h2>
                <div class="header-actions">
                  <button mat-raised-button color="accent" (click)="loadCertificateRequests()">
                    <mat-icon>refresh</mat-icon>
                    Refresh
                  </button>
                </div>
              </div>

              <!-- Pending Requests -->
              <div *ngIf="pendingRequests.length > 0" class="requests-section">
                <h3>Pending Requests ({{pendingRequests.length}})</h3>
                <table mat-table [dataSource]="pendingRequests" class="requests-table">
                  <ng-container matColumnDef="requestId">
                    <th mat-header-cell *matHeaderCellDef>Request ID</th>
                    <td mat-cell *matCellDef="let request">{{request.requestId}}</td>
                  </ng-container>

                  <ng-container matColumnDef="studentId">
                    <th mat-header-cell *matHeaderCellDef>Student ID</th>
                    <td mat-cell *matCellDef="let request">{{request.studentId}}</td>
                  </ng-container>

                  <ng-container matColumnDef="certificateType">
                    <th mat-header-cell *matHeaderCellDef>Certificate Type</th>
                    <td mat-cell *matCellDef="let request">
                      <mat-chip>{{request.certificateType}}</mat-chip>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="purpose">
                    <th mat-header-cell *matHeaderCellDef>Purpose</th>
                    <td mat-cell *matCellDef="let request">{{request.purpose}}</td>
                  </ng-container>

                  <ng-container matColumnDef="requestDate">
                    <th mat-header-cell *matHeaderCellDef>Request Date</th>
                    <td mat-cell *matCellDef="let request">{{request.requestDate | date:'short'}}</td>
                  </ng-container>

                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef>Actions</th>
                    <td mat-cell *matCellDef="let request">
                      <button mat-raised-button color="primary" (click)="approveRequest(request)" class="action-btn">
                        <mat-icon>check</mat-icon>
                        Approve
                      </button>
                      <button mat-raised-button color="warn" (click)="rejectRequest(request)" class="action-btn">
                        <mat-icon>close</mat-icon>
                        Reject
                      </button>
                      <button mat-button (click)="viewRequestDetails(request)">
                        <mat-icon>visibility</mat-icon>
                        Details
                      </button>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="requestColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: requestColumns;"></tr>
                </table>
              </div>

              <!-- Past Requests -->
              <div *ngIf="processedRequests.length > 0" class="requests-section">
                <h3>Past Requests ({{processedRequests.length}})</h3>
                <table mat-table [dataSource]="processedRequests" class="requests-table">
                  <ng-container matColumnDef="requestId">
                    <th mat-header-cell *matHeaderCellDef>Request ID</th>
                    <td mat-cell *matCellDef="let request">{{request.requestId}}</td>
                  </ng-container>

                  <ng-container matColumnDef="studentId">
                    <th mat-header-cell *matHeaderCellDef>Student ID</th>
                    <td mat-cell *matCellDef="let request">{{request.studentId}}</td>
                  </ng-container>

                  <ng-container matColumnDef="certificateType">
                    <th mat-header-cell *matHeaderCellDef>Certificate Type</th>
                    <td mat-cell *matCellDef="let request">
                      <mat-chip>{{request.certificateType}}</mat-chip>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>Status</th>
                    <td mat-cell *matCellDef="let request">
                      <mat-chip [class.approved]="request.status === 'APPROVED'" 
                                [class.rejected]="request.status === 'REJECTED'">
                        {{request.status}}
                      </mat-chip>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="requestDate">
                    <th mat-header-cell *matHeaderCellDef>Request Date</th>
                    <td mat-cell *matCellDef="let request">{{request.requestDate | date:'short'}}</td>
                  </ng-container>

                  <ng-container matColumnDef="processedDate">
                    <th mat-header-cell *matHeaderCellDef>Processed Date</th>
                    <td mat-cell *matCellDef="let request">{{request.processedDate | date:'short'}}</td>
                  </ng-container>

                  <ng-container matColumnDef="certificateId">
                    <th mat-header-cell *matHeaderCellDef>Certificate ID</th>
                    <td mat-cell *matCellDef="let request">
                      <span *ngIf="request.certificateId" class="certificate-id">{{request.certificateId}}</span>
                      <span *ngIf="!request.certificateId" class="no-cert">-</span>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="pastRequestColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: pastRequestColumns;"></tr>
                </table>
              </div>

              <div class="empty-state" *ngIf="pendingRequests.length === 0 && processedRequests.length === 0">
                <mat-icon>request_page</mat-icon>
                <h3>No Certificate Requests</h3>
                <p>Certificate requests from students will appear here</p>
              </div>
            </div>
          </mat-tab>

          <!-- Department Management Tab -->
          <mat-tab label="Department Management">
            <div class="tab-content">
              <!-- Department Stats -->
              <div class="mini-stats-row">
                <div class="mini-stat-card">
                  <mat-icon>domain</mat-icon>
                  <div>
                    <div class="mini-stat-value">{{allDepartments.length}}</div>
                    <div class="mini-stat-label">Total Departments</div>
                  </div>
                </div>
                <div class="mini-stat-card">
                  <mat-icon>group</mat-icon>
                  <div>
                    <div class="mini-stat-value">{{getDepartmentWithMostStudents()}}</div>
                    <div class="mini-stat-label">Largest Department</div>
                  </div>
                </div>
              </div>

              <!-- Create New Department Section -->
              <div class="section-header">
                <div class="section-title">
                  <mat-icon>add_circle</mat-icon>
                  <h2>Create New Department</h2>
                </div>
                <button mat-button class="toggle-btn" (click)="toggleDepartmentForm()">
                  <mat-icon>{{showDepartmentForm ? 'expand_less' : 'expand_more'}}</mat-icon>
                  {{showDepartmentForm ? 'Hide Form' : 'Show Form'}}
                </button>
              </div>

              <mat-card class="form-card" *ngIf="showDepartmentForm">
                <form class="department-form">
                  <div class="form-grid">
                    <mat-form-field appearance="outline">
                      <mat-label>Department ID</mat-label>
                      <input matInput [(ngModel)]="departmentData.departmentId" name="departmentId" 
                             placeholder="e.g., CSE, ECE, MECH" required>
                      <mat-icon matPrefix>fingerprint</mat-icon>
                      <mat-hint>Short code (3-4 characters)</mat-hint>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Department Name</mat-label>
                      <input matInput [(ngModel)]="departmentData.departmentName" name="departmentName" 
                             placeholder="e.g., Computer Science and Engineering" required>
                      <mat-icon matPrefix>domain</mat-icon>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Head of Department</mat-label>
                      <input matInput [(ngModel)]="departmentData.hod" name="hod" 
                             placeholder="e.g., Dr. Rajesh Kumar" required>
                      <mat-icon matPrefix>person</mat-icon>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Email</mat-label>
                      <input matInput type="email" [(ngModel)]="departmentData.email" name="email" 
                             placeholder="e.g., cse@nitw.ac.in" required>
                      <mat-icon matPrefix>email</mat-icon>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Phone</mat-label>
                      <input matInput [(ngModel)]="departmentData.phone" name="phone" 
                             placeholder="e.g., +91-870-2462000" required>
                      <mat-icon matPrefix>phone</mat-icon>
                    </mat-form-field>
                  </div>

                  <div class="form-actions">
                    <button mat-raised-button color="primary" (click)="createDepartment()" class="submit-btn">
                      <mat-icon>add</mat-icon>
                      Create Department
                    </button>
                    <button mat-button (click)="resetDepartmentForm()">
                      <mat-icon>clear</mat-icon>
                      Reset
                    </button>
                  </div>
                </form>
              </mat-card>

              <!-- All Departments Section -->
              <div class="section-header" style="margin-top: 30px;">
                <div class="section-title">
                  <mat-icon>list</mat-icon>
                  <h2>All Departments ({{filteredDepartments.length}})</h2>
                </div>
                <div class="section-actions">
                  <mat-form-field appearance="outline" class="search-field">
                    <mat-label>Search departments</mat-label>
                    <input matInput [(ngModel)]="departmentSearchQuery" (ngModelChange)="filterDepartments()" 
                           placeholder="Search by name, ID, HOD...">
                    <mat-icon matSuffix *ngIf="!departmentSearchQuery">search</mat-icon>
                    <button mat-icon-button matSuffix *ngIf="departmentSearchQuery" (click)="clearDepartmentSearch()">
                      <mat-icon>clear</mat-icon>
                    </button>
                  </mat-form-field>
                  <button mat-raised-button color="primary" (click)="loadDepartments()">
                    <mat-icon>refresh</mat-icon>
                    Refresh
                  </button>
                </div>
              </div>

              <div *ngIf="loadingDepartments" class="loading-container">
                <mat-spinner></mat-spinner>
                <p>Loading departments...</p>
              </div>

              <div class="departments-grid" *ngIf="!loadingDepartments && filteredDepartments.length > 0">
                <mat-card *ngFor="let dept of filteredDepartments" class="department-card enhanced-card">
                  <div class="card-icon-wrapper">
                    <mat-icon>domain</mat-icon>
                  </div>
                  <div class="card-content">
                    <div class="card-header-section">
                      <h3>{{dept.departmentName}}</h3>
                      <mat-chip class="dept-id-chip">{{dept.departmentId}}</mat-chip>
                    </div>
                    
                    <div class="info-rows">
                      <div class="info-row">
                        <mat-icon>person</mat-icon>
                        <span><strong>HOD:</strong> {{dept.hod}}</span>
                      </div>
                      <div class="info-row">
                        <mat-icon>email</mat-icon>
                        <span><strong>Email:</strong> {{dept.email}}</span>
                      </div>
                      <div class="info-row">
                        <mat-icon>phone</mat-icon>
                        <span><strong>Phone:</strong> {{dept.phone}}</span>
                      </div>
                      <div class="info-row" *ngIf="dept.createdAt">
                        <mat-icon>calendar_today</mat-icon>
                        <span><strong>Created:</strong> {{formatDate(dept.createdAt)}}</span>
                      </div>
                    </div>

                    <div class="card-actions">
                      <button mat-button color="primary" (click)="viewDepartmentDetails(dept)">
                        <mat-icon>visibility</mat-icon>
                        View Details
                      </button>
                      <button mat-button (click)="editDepartment(dept)">
                        <mat-icon>edit</mat-icon>
                        Edit
                      </button>
                    </div>
                  </div>
                </mat-card>
              </div>

              <div class="empty-state" *ngIf="!loadingDepartments && filteredDepartments.length === 0 && allDepartments.length === 0">
                <mat-icon>domain</mat-icon>
                <h3>No Departments</h3>
                <p>Create your first department to get started</p>
                <button mat-raised-button color="primary" (click)="showDepartmentForm = true">
                  <mat-icon>add</mat-icon>
                  Create Department
                </button>
              </div>

              <div class="empty-state" *ngIf="!loadingDepartments && filteredDepartments.length === 0 && allDepartments.length > 0">
                <mat-icon>search_off</mat-icon>
                <h3>No Matching Departments</h3>
                <p>Try adjusting your search criteria</p>
                <button mat-button (click)="clearDepartmentSearch()">
                  <mat-icon>clear</mat-icon>
                  Clear Search
                </button>
              </div>
            </div>
          </mat-tab>

          <!-- Course Management Tab -->
          <mat-tab label="Course Management">
            <div class="tab-content">
              <!-- Course Stats -->
              <div class="mini-stats-row">
                <div class="mini-stat-card">
                  <mat-icon>book</mat-icon>
                  <div>
                    <div class="mini-stat-value">{{getAllCoursesCount()}}</div>
                    <div class="mini-stat-label">Total Courses</div>
                  </div>
                </div>
                <div class="mini-stat-card">
                  <mat-icon>schedule</mat-icon>
                  <div>
                    <div class="mini-stat-value">{{getActiveCoursesCount()}}</div>
                    <div class="mini-stat-label">Active Courses</div>
                  </div>
                </div>
                <div class="mini-stat-card">
                  <mat-icon>domain</mat-icon>
                  <div>
                    <div class="mini-stat-value">{{allDepartments.length}}</div>
                    <div class="mini-stat-label">Departments</div>
                  </div>
                </div>
              </div>

              <!-- Create Course Offering Section -->
              <div class="section-header">
                <div class="section-title">
                  <mat-icon>add_circle</mat-icon>
                  <h2>Create Course Offering</h2>
                </div>
                <button mat-button class="toggle-btn" (click)="toggleCourseForm()">
                  <mat-icon>{{showCourseForm ? 'expand_less' : 'expand_more'}}</mat-icon>
                  {{showCourseForm ? 'Hide Form' : 'Show Form'}}
                </button>
              </div>

              <mat-card class="form-card" *ngIf="showCourseForm">
                <form class="course-form">
                  <div class="form-grid">
                    <mat-form-field appearance="outline" class="full-width-grid">
                      <mat-label>Department</mat-label>
                      <mat-select [(ngModel)]="courseData.departmentId" name="departmentId" required>
                        <mat-option *ngFor="let dept of allDepartments" [value]="dept.departmentId">
                          {{dept.departmentName}} ({{dept.departmentId}})
                        </mat-option>
                      </mat-select>
                      <mat-icon matPrefix>domain</mat-icon>
                      <mat-hint>Select the department offering this course</mat-hint>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Course Code</mat-label>
                      <input matInput [(ngModel)]="courseData.courseCode" name="courseCode" 
                             placeholder="e.g., CS101" required>
                      <mat-icon matPrefix>tag</mat-icon>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Course Name</mat-label>
                      <input matInput [(ngModel)]="courseData.courseName" name="courseName" 
                             placeholder="e.g., Data Structures" required>
                      <mat-icon matPrefix>book</mat-icon>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Credits</mat-label>
                      <input matInput type="number" [(ngModel)]="courseData.credits" name="credits" 
                             min="0.5" max="6" step="0.5" required>
                      <mat-icon matPrefix>star</mat-icon>
                      <mat-hint>0.5 to 6 credits</mat-hint>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Semester</mat-label>
                      <mat-select [(ngModel)]="courseData.semester" name="semester" required>
                        <mat-option *ngFor="let sem of [1,2,3,4,5,6,7,8]" [value]="sem">
                          Semester {{sem}}
                        </mat-option>
                      </mat-select>
                      <mat-icon matPrefix>calendar_today</mat-icon>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Academic Year</mat-label>
                      <input matInput [(ngModel)]="courseData.academicYear" name="academicYear" 
                             placeholder="e.g., 2024-25" required>
                      <mat-icon matPrefix>date_range</mat-icon>
                    </mat-form-field>
                  </div>

                  <div class="form-actions">
                    <button mat-raised-button color="primary" (click)="createCourseOffering()" class="submit-btn">
                      <mat-icon>add</mat-icon>
                      Create Course Offering
                    </button>
                    <button mat-button (click)="resetCourseForm()">
                      <mat-icon>clear</mat-icon>
                      Reset
                    </button>
                  </div>
                </form>
              </mat-card>

              <!-- All Courses Section -->
              <div class="section-header" style="margin-top: 30px;">
                <div class="section-title">
                  <mat-icon>list</mat-icon>
                  <h2>Course Offerings ({{filteredCourses.length}})</h2>
                </div>
                <div class="section-actions">
                  <mat-form-field appearance="outline" class="search-field">
                    <mat-label>Search courses</mat-label>
                    <input matInput [(ngModel)]="courseSearchQuery" (ngModelChange)="filterCourses()" 
                           placeholder="Search by name, code...">
                    <mat-icon matSuffix *ngIf="!courseSearchQuery">search</mat-icon>
                    <button mat-icon-button matSuffix *ngIf="courseSearchQuery" (click)="clearCourseSearch()">
                      <mat-icon>clear</mat-icon>
                    </button>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="filter-field">
                    <mat-label>Filter by Department</mat-label>
                    <mat-select [(ngModel)]="selectedDepartmentFilter" (ngModelChange)="filterCourses()">
                      <mat-option value="">All Departments</mat-option>
                      <mat-option *ngFor="let dept of allDepartments" [value]="dept.departmentId">
                        {{dept.departmentName}}
                      </mat-option>
                    </mat-select>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="filter-field">
                    <mat-label>Filter by Semester</mat-label>
                    <mat-select [(ngModel)]="selectedSemesterFilter" (ngModelChange)="filterCourses()">
                      <mat-option value="">All Semesters</mat-option>
                      <mat-option *ngFor="let sem of [1,2,3,4,5,6,7,8]" [value]="sem">
                        Semester {{sem}}
                      </mat-option>
                    </mat-select>
                  </mat-form-field>
                  <button mat-raised-button color="primary" (click)="loadAllCourses()">
                    <mat-icon>refresh</mat-icon>
                    Refresh
                  </button>
                </div>
              </div>

              <div *ngIf="loadingCourses" class="loading-container">
                <mat-spinner></mat-spinner>
                <p>Loading courses...</p>
              </div>

              <div class="courses-grid" *ngIf="!loadingCourses && filteredCourses.length > 0">
                <mat-card *ngFor="let course of filteredCourses" class="course-card enhanced-card">
                  <div class="card-icon-wrapper course-icon">
                    <mat-icon>book</mat-icon>
                  </div>
                  <div class="card-content">
                    <div class="card-header-section">
                      <h3>{{course.courseName}}</h3>
                      <div class="chips-row">
                        <mat-chip class="course-code-chip">{{course.courseCode}}</mat-chip>
                        <mat-chip [class]="course.isActive ? 'status-approved' : 'status-pending'">
                          <mat-icon>{{course.isActive ? 'check_circle' : 'schedule'}}</mat-icon>
                          {{course.isActive ? 'Active' : 'Inactive'}}
                        </mat-chip>
                      </div>
                    </div>
                    
                    <div class="info-rows">
                      <div class="info-row">
                        <mat-icon>domain</mat-icon>
                        <span><strong>Department:</strong> {{course.departmentId}}</span>
                      </div>
                      <div class="info-row">
                        <mat-icon>star</mat-icon>
                        <span><strong>Credits:</strong> {{course.credits}}</span>
                      </div>
                      <div class="info-row">
                        <mat-icon>calendar_today</mat-icon>
                        <span><strong>Semester:</strong> {{course.semester}}</span>
                      </div>
                      <div class="info-row">
                        <mat-icon>date_range</mat-icon>
                        <span><strong>Year:</strong> {{course.academicYear}}</span>
                      </div>
                    </div>
                  </div>
                </mat-card>
              </div>

              <div class="empty-state" *ngIf="!loadingCourses && filteredCourses.length === 0 && allCourses.length === 0">
                <mat-icon>book</mat-icon>
                <h3>No Courses</h3>
                <p>Create course offerings to get started</p>
                <button mat-raised-button color="primary" (click)="showCourseForm = true">
                  <mat-icon>add</mat-icon>
                  Create Course
                </button>
              </div>

              <div class="empty-state" *ngIf="!loadingCourses && filteredCourses.length === 0 && allCourses.length > 0">
                <mat-icon>search_off</mat-icon>
                <h3>No Matching Courses</h3>
                <p>Try adjusting your search or filter criteria</p>
                <button mat-button (click)="clearCourseFilters()">
                  <mat-icon>clear</mat-icon>
                  Clear Filters
                </button>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      </mat-card>
  `,
  styles: [`
    /* Container & Background */
    .dashboard-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 30px 20px;
      position: relative;
      overflow-x: hidden;
    }

    /* Animated Background */
    .bg-shapes {
      position: fixed;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      overflow: hidden;
      z-index: 0;
      pointer-events: none;
    }

    .shape {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.08);
      animation: float 25s infinite ease-in-out;
    }

    .shape-1 {
      width: 400px;
      height: 400px;
      top: -150px;
      left: 10%;
      animation-delay: 0s;
    }

    .shape-2 {
      width: 250px;
      height: 250px;
      bottom: -100px;
      right: 15%;
      animation-delay: 8s;
    }

    .shape-3 {
      width: 180px;
      height: 180px;
      top: 50%;
      right: 8%;
      animation-delay: 16s;
    }

    @keyframes float {
      0%, 100% { transform: translate(0, 0) rotate(0deg); }
      33% { transform: translate(40px, -40px) rotate(120deg); }
      66% { transform: translate(-30px, 30px) rotate(240deg); }
    }

    /* Header */
    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 40px;
      position: relative;
      z-index: 1;
      flex-wrap: wrap;
      gap: 20px;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .logo-wrapper {
      width: 80px;
      height: 80px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(10px);
      border: 2px solid rgba(255, 255, 255, 0.3);
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(255, 255, 255, 0.3); }
      50% { transform: scale(1.05); box-shadow: 0 0 30px rgba(255, 255, 255, 0.5); }
    }

    .dashboard-icon {
      font-size: 3rem !important;
      width: 3rem !important;
      height: 3rem !important;
      color: white;
    }

    .header-text h1 {
      margin: 0;
      font-size: 2.5rem;
      color: white;
      font-weight: 800;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
      letter-spacing: -0.5px;
    }

    .welcome-text {
      margin: 8px 0 0 0;
      color: white;
      font-size: 1.1rem;
      display: flex;
      align-items: center;
      gap: 8px;
      opacity: 0.95;
    }

    .welcome-icon {
      font-size: 1.3rem !important;
      width: 1.3rem !important;
      height: 1.3rem !important;
    }

    .user-name {
      font-weight: 600;
      color: #fff;
    }

    .logout-btn {
      background: rgba(244, 67, 54, 0.9) !important;
      color: white !important;
      border-radius: 12px !important;
      padding: 0 24px !important;
      height: 48px !important;
      font-weight: 600 !important;
      box-shadow: 0 4px 16px rgba(244, 67, 54, 0.3) !important;
      transition: all 0.3s ease !important;
    }

    .logout-btn:hover {
      background: rgba(211, 47, 47, 1) !important;
      box-shadow: 0 6px 20px rgba(244, 67, 54, 0.4) !important;
      transform: translateY(-2px);
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
      margin-bottom: 40px;
      position: relative;
      z-index: 1;
    }

    .stat-card {
      background: rgba(255, 255, 255, 0.98) !important;
      border-radius: 20px !important;
      padding: 28px !important;
      display: flex;
      align-items: flex-start;
      gap: 20px;
      transition: all 0.4s ease;
      cursor: pointer;
      border: 2px solid rgba(255, 255, 255, 0.3) !important;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15) !important;
      overflow: hidden;
      position: relative;
    }

    .stat-card::before {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 100px;
      height: 100px;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
      border-radius: 50%;
      transform: translate(30%, -30%);
    }

    .stat-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2) !important;
    }

    .stat-icon-wrapper {
      width: 70px;
      height: 70px;
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      position: relative;
      z-index: 1;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .stat-icon-wrapper.students {
      background: linear-gradient(135deg, #2196F3, #1976D2);
    }

    .stat-icon-wrapper.active {
      background: linear-gradient(135deg, #4CAF50, #388E3C);
    }

    .stat-icon-wrapper.pending {
      background: linear-gradient(135deg, #FF9800, #F57C00);
    }

    .stat-icon-wrapper.certificates {
      background: linear-gradient(135deg, #9C27B0, #7B1FA2);
    }

    .stat-icon {
      font-size: 2.2rem !important;
      width: 2.2rem !important;
      height: 2.2rem !important;
      color: white;
    }

    .stat-content {
      flex: 1;
      position: relative;
      z-index: 1;
    }

    .stat-label {
      margin: 0 0 8px 0;
      color: #666;
      font-size: 0.9rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stat-value {
      margin: 0 0 12px 0;
      font-size: 2.5rem;
      font-weight: 800;
      color: #1a1a1a;
      line-height: 1;
    }

    .stat-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: #f0f0f0;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      color: #666;
    }

    .stat-badge mat-icon {
      font-size: 1rem !important;
      width: 1rem !important;
      height: 1rem !important;
    }

    .stat-badge.warning {
      background: #fff3e0;
      color: #f57c00;
    }

    /* Content Card */
    .content-card {
      margin-bottom: 30px;
      border-radius: 24px !important;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15) !important;
      overflow: hidden;
      position: relative;
      z-index: 1;
      background: white !important;
    }

    /* Tab Styles */
    ::ng-deep .mat-mdc-tab-group {
      background: transparent !important;
    }

    ::ng-deep .mat-mdc-tab-header {
      background: linear-gradient(to bottom, #f8f9fa, white) !important;
      border-bottom: 2px solid #e0e0e0;
    }

    ::ng-deep .mat-mdc-tab .mdc-tab__text-label {
      font-weight: 600 !important;
      font-size: 1rem !important;
    }

    ::ng-deep .mat-mdc-tab.mdc-tab--active .mdc-tab__text-label {
      color: #667eea !important;
    }

    ::ng-deep .mat-mdc-tab-body-content {
      overflow-x: hidden;
    }

    .tab-content {
      padding: 32px;
    }

    .tab-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 28px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .tab-header h2 {
      margin: 0;
      font-size: 1.8rem;
      font-weight: 700;
      color: #1a1a1a;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    /* Tables */
    .table-container {
      overflow-x: auto;
      border-radius: 16px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
      background: white;
    }

    .records-table, .certificates-table, .requests-table {
      width: 100%;
    }

    ::ng-deep .mat-mdc-table {
      background: white !important;
    }

    ::ng-deep .mat-mdc-header-row {
      background: linear-gradient(to right, #f8f9fa, #f0f0f0) !important;
    }

    ::ng-deep .mat-mdc-header-cell {
      font-weight: 700 !important;
      font-size: 0.9rem !important;
      color: #1a1a1a !important;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    ::ng-deep .mat-mdc-cell {
      font-size: 0.95rem;
      color: #333;
    }

    ::ng-deep .mat-mdc-row:hover {
      background: #f8f9fa !important;
    }

    /* Chips */
    mat-chip {
      font-size: 0.8rem !important;
      font-weight: 600 !important;
      border-radius: 12px !important;
    }

    mat-chip.draft {
      background-color: #FFF3E0 !important;
      color: #FF6F00 !important;
    }

    mat-chip.submitted {
      background-color: #E3F2FD !important;
      color: #1976D2 !important;
    }

    mat-chip.active-status, mat-chip.active {
      background-color: #C8E6C9 !important;
      color: #2E7D32 !important;
    }

    mat-chip.graduated-status {
      background-color: #B3E5FC !important;
      color: #01579B !important;
    }

    mat-chip.cert-chip {
      background-color: #E1BEE7 !important;
      color: #6A1B9A !important;
    }

    mat-chip.approved {
      background-color: #4caf50 !important;
      color: white !important;
    }

    mat-chip.rejected {
      background-color: #f44336 !important;
      color: white !important;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 80px 20px;
      background: linear-gradient(135deg, #f8f9fa, #f0f0f0);
      border-radius: 16px;
    }

    .empty-state mat-icon {
      font-size: 5rem !important;
      width: 5rem !important;
      height: 5rem !important;
      color: #ccc;
      margin-bottom: 20px;
    }

    .empty-state h3 {
      margin: 0 0 12px 0;
      color: #666;
      font-size: 1.5rem;
      font-weight: 600;
    }

    .empty-state p {
      color: #999;
      font-size: 1rem;
      margin: 0 0 24px 0;
    }

    /* Forms */
    .form-card {
      padding: 32px !important;
      margin-bottom: 24px;
      border-radius: 16px !important;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08) !important;
    }

    .form-card h3 {
      margin: 0 0 24px 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: #1a1a1a;
    }

    .department-form, .course-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      margin: 24px 0;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .full-width {
      width: 100%;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 24px;
    }

    .submit-btn {
      min-width: 200px;
      height: 48px !important;
      font-weight: 600 !important;
      border-radius: 12px !important;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3) !important;
    }

    .submit-btn:hover {
      box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4) !important;
      transform: translateY(-2px);
    }

    /* Certificate Form */
    .certificate-form {
      margin-top: 24px;
    }

    .success-alert {
      margin: 24px 0;
      background: linear-gradient(135deg, #E8F5E9, #C8E6C9) !important;
      border-left: 5px solid #4CAF50 !important;
      border-radius: 12px !important;
      animation: slideIn 0.4s ease-out;
      box-shadow: 0 4px 16px rgba(76, 175, 80, 0.2) !important;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .alert-content {
      display: flex;
      align-items: flex-start;
      gap: 20px;
      padding: 24px;
    }

    .success-icon {
      color: #4CAF50 !important;
      font-size: 3rem !important;
      width: 3rem !important;
      height: 3rem !important;
      flex-shrink: 0;
    }

    .alert-details {
      flex: 1;
    }

    .alert-details h3 {
      margin: 0 0 16px 0;
      color: #2E7D32;
      font-size: 1.3rem;
      font-weight: 700;
    }

    .alert-details p {
      margin: 8px 0;
      color: #1B5E20;
      font-size: 0.95rem;
      line-height: 1.6;
    }

    .alert-details strong {
      color: #1B5E20;
      font-weight: 700;
    }

    /* Certificate Section */
    .certificates-section {
      margin-top: 24px;
      padding: 24px;
      background: #f8f9fa;
      border-radius: 16px;
    }

    .certificates-section h3 {
      margin: 0 0 20px 0;
      font-size: 1.3rem;
      color: #1a1a1a;
      font-weight: 700;
    }

    /* Request Section */
    .requests-section {
      margin-bottom: 40px;
    }

    .requests-section h3 {
      margin: 24px 0 16px 0;
      color: #1a1a1a;
      font-size: 1.3rem;
      font-weight: 700;
    }

    .action-btn {
      margin-right: 12px !important;
      border-radius: 8px !important;
      font-weight: 600 !important;
    }

    .certificate-id {
      font-family: 'Courier New', monospace;
      background-color: #e3f2fd;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 0.85rem;
      color: #1976d2;
      font-weight: 600;
    }

    .no-cert {
      color: #999;
    }

    /* Grids for Cards */
    .departments-grid, .courses-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 24px;
      margin-top: 24px;
    }

    .department-card, .course-card {
      transition: all 0.3s ease;
      border-radius: 16px !important;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08) !important;
    }

    .department-card:hover, .course-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15) !important;
    }

    .department-card mat-card-content p,
    .course-card mat-card-content p {
      margin: 12px 0;
      font-size: 0.95rem;
      color: #666;
    }

    .department-card mat-card-content strong,
    .course-card mat-card-content strong {
      color: #1a1a1a;
      font-weight: 600;
    }

    /* Enhanced Department & Course Cards */
    .enhanced-card {
      display: flex;
      flex-direction: column;
      position: relative;
      background: white;
      border-radius: 20px !important;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08) !important;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .enhanced-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 12px 32px rgba(102, 126, 234, 0.2) !important;
    }

    .enhanced-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    }

    .card-icon-wrapper {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 20px 20px 0 20px;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .card-icon-wrapper.course-icon {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      box-shadow: 0 4px 12px rgba(240, 147, 251, 0.3);
    }

    .card-icon-wrapper mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: white;
    }

    .card-content {
      flex: 1;
      padding: 20px;
    }

    .card-header-section {
      margin-bottom: 16px;
    }

    .card-header-section h3 {
      margin: 0 0 8px 0;
      font-size: 1.25rem;
      font-weight: 700;
      color: #1a1a2e;
    }

    .dept-id-chip {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1)) !important;
      color: #667eea !important;
      font-weight: 600 !important;
      border: 2px solid rgba(102, 126, 234, 0.3) !important;
    }

    .course-code-chip {
      background: linear-gradient(135deg, rgba(240, 147, 251, 0.1), rgba(245, 87, 108, 0.1)) !important;
      color: #f5576c !important;
      font-weight: 600 !important;
      border: 2px solid rgba(240, 147, 251, 0.3) !important;
    }

    .chips-row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .chips-row mat-chip {
      font-size: 0.8rem !important;
      height: 28px !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 4px !important;
    }

    .chips-row mat-chip mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .info-rows {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 16px;
    }

    .info-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      background: rgba(102, 126, 234, 0.03);
      border-radius: 8px;
      transition: background 0.2s ease;
    }

    .info-row:hover {
      background: rgba(102, 126, 234, 0.08);
    }

    .info-row mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #667eea;
    }

    .info-row span {
      font-size: 0.9rem;
      color: #1a1a2e;
    }

    .info-row strong {
      font-weight: 600;
      margin-right: 6px;
    }

    .card-actions {
      display: flex;
      gap: 8px;
      padding-top: 16px;
      border-top: 2px solid rgba(0, 0, 0, 0.05);
      flex-wrap: wrap;
    }

    .card-actions button {
      border-radius: 12px;
      font-weight: 600;
      transition: all 0.2s ease;
    }

    .card-actions button:hover:not([disabled]) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    /* Mini Stats Row */
    .mini-stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .mini-stat-card {
      background: white;
      border-radius: 16px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
      transition: all 0.3s ease;
    }

    .mini-stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(102, 126, 234, 0.15);
    }

    .mini-stat-card mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #667eea;
    }

    .mini-stat-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1a1a2e;
      line-height: 1;
    }

    .mini-stat-label {
      font-size: 0.85rem;
      color: #64748b;
      margin-top: 4px;
    }

    /* Section Headers */
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .section-title mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: #667eea;
    }

    .section-title h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: #1a1a2e;
    }

    .section-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      align-items: center;
    }

    .toggle-btn {
      color: #667eea;
      font-weight: 600;
    }

    .search-field, .filter-field {
      min-width: 250px;
    }

    /* Form Grid */
    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 20px;
    }

    .form-grid .full-width-grid {
      grid-column: 1 / -1;
    }

    .form-grid mat-form-field {
      width: 100%;
    }

    /* Form Actions */
    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-start;
      padding-top: 16px;
      border-top: 2px solid rgba(0, 0, 0, 0.05);
    }

    .form-actions button {
      border-radius: 12px;
      font-weight: 600;
      height: 44px;
      padding: 0 24px;
    }

    /* Loading */
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 20px;
    }

    .loading-container p {
      margin-top: 24px;
      color: #666;
      font-size: 1.1rem;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .dashboard-container {
        padding: 16px;
      }

      .header-text h1 {
        font-size: 1.8rem;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .tab-content {
        padding: 20px;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .form-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .form-grid .full-width-grid {
        grid-column: 1;
      }

      .section-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .section-actions {
        width: 100%;
        flex-direction: column;
      }

      .search-field, .filter-field {
        width: 100%;
        min-width: unset;
      }

      .mini-stats-row {
        grid-template-columns: 1fr;
      }

      .departments-grid, .courses-grid {
        grid-template-columns: 1fr;
      }

      .card-actions {
        flex-direction: column;
      }

      .card-actions button {
        width: 100%;
      }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  stats: DashboardStats | null = null;
  pendingRecords: AcademicRecord[] = [];
  students: Student[] = [];
  loadingStudents = false;
  showCertificateForm = false;
  syncingCertificates = false;
  lastIssuedCertificate: { id: string; studentId: string; type: string; date: string } | null = null;
  recentCertificates: Array<{ id: string; studentId: string; type: string; date: string }> = [];

  displayedColumns = ['recordId', 'student', 'department', 'semester', 'sgpa', 'status', 'actions'];
  studentColumns = ['rollNumber', 'name', 'email', 'departmentStudent', 'year', 'studentStatus', 'studentActions'];
  certificateColumns = ['certificateId', 'studentId', 'type', 'issueDate', 'status'];
  requestColumns = ['requestId', 'studentId', 'certificateType', 'purpose', 'requestDate', 'actions'];
  pastRequestColumns = ['requestId', 'studentId', 'certificateType', 'status', 'requestDate', 'processedDate', 'certificateId'];

  // Certificate Requests
  pendingRequests: any[] = [];
  processedRequests: any[] = [];
  private apiUrl = environment.apiUrl;

  currentUser = this.authService.currentUser;

  // Form data
  studentData = {
    rollNumber: '',
    name: '',
    email: '',
    department: '',
    enrollmentYear: new Date().getFullYear(),
    admissionCategory: 'GENERAL'
  };

  certificateData = {
    studentId: '',
    certificateType: 'DEGREE',
    issueDate: new Date().toISOString().split('T')[0],
    validUntil: ''
  };

  // Department and Course data
  departmentData = {
    departmentId: '',
    departmentName: '',
    hod: '',
    email: '',
    phone: ''
  };

  courseData = {
    departmentId: '',
    courseCode: '',
    courseName: '',
    credits: 4,
    semester: 1,
    academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1).toString().slice(-2)
  };

  allDepartments: any[] = [];
  filteredDepartments: any[] = [];
  departmentCourses: any[] = [];
  allCourses: any[] = [];
  filteredCourses: any[] = [];
  loadingDepartments = false;
  loadingCourses = false;
  selectedDepartmentFilter = '';
  selectedSemesterFilter: any = '';

  // Search and filter
  departmentSearchQuery = '';
  courseSearchQuery = '';

  // Form visibility toggles
  showDepartmentForm = false;
  showCourseForm = false;

  departments = ['CSE', 'ECE', 'EE', 'MECH', 'CIVIL', 'CHEM'];
  categories = ['GENERAL', 'OBC', 'SC', 'ST', 'EWS'];

  constructor(
    private authService: AuthService,
    private blockchainService: BlockchainService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.loadData();
    this.loadCertificatesFromStorage();
    this.loadCertificateRequests();
    this.loadDepartments();
  }

  loadCertificatesFromStorage(): void {
    try {
      const stored = localStorage.getItem('recentCertificates');
      console.log('Loading from localStorage, raw data:', stored);
      if (stored) {
        this.recentCertificates = JSON.parse(stored);
        console.log('✅ Loaded certificates from localStorage:', this.recentCertificates.length, this.recentCertificates);
        console.log('showCertificateForm:', this.showCertificateForm);
        console.log('Should show table?', this.recentCertificates.length > 0 && !this.showCertificateForm);
      } else {
        console.log('No certificates in localStorage');
      }
    } catch (error) {
      console.error('Error loading certificates from storage:', error);
    }
  }

  saveCertificatesToStorage(): void {
    try {
      localStorage.setItem('recentCertificates', JSON.stringify(this.recentCertificates));
      console.log('Saved certificates to localStorage:', this.recentCertificates.length);
    } catch (error) {
      console.error('Error saving certificates to storage:', error);
    }
  }

  loadData(): void {
    // Load dashboard stats
    this.blockchainService.getDashboardStats().subscribe({
      next: (stats) => this.stats = stats,
      error: (error) => console.error('Error loading stats:', error)
    });

    // Load pending records
    this.blockchainService.getPendingRecords().subscribe({
      next: (response) => {
        console.log('Pending records API response:', response);
        if (response.success && response.data) {
          // The data contains {records: [], bookmark: '', recordCount: X}
          const data: any = response.data;
          this.pendingRecords = data.records || data;
          console.log('Loaded pending records:', this.pendingRecords);
        } else {
          console.log('No pending records in response');
          this.pendingRecords = [];
        }
      },
      error: (error) => {
        console.error('Error loading pending records:', error);
        this.pendingRecords = [];
      }
    });

    // Load all students
    this.loadStudents();
  }

  loadStudents(): void {
    this.loadingStudents = true;
    this.blockchainService.getAllStudents().subscribe({
      next: (response) => {
        this.loadingStudents = false;
        if (response.success && response.data) {
          this.students = response.data;
          this.snackBar.open(`Loaded ${this.students.length} students`, 'Close', { duration: 3000 });
        }
      },
      error: (error) => {
        this.loadingStudents = false;
        console.error('Error loading students:', error);
        this.snackBar.open('Error loading students: ' + (error.error?.message || error.message), 'Close', { duration: 5000 });
      }
    });
  }

  refreshData(): void {
    this.loadData();
  }

  approveRecord(record: AcademicRecord): void {
    if (confirm(`Approve record ${record.recordId} for student ${record.studentId}?`)) {
      this.blockchainService.approveAcademicRecord(record.recordId).subscribe({
        next: (response) => {
          if (response.success) {
            // Remove the approved record from the pending list immediately
            this.pendingRecords = this.pendingRecords.filter(r => r.recordId !== record.recordId);
            this.snackBar.open('✅ Record approved successfully!', 'Close', { duration: 3000 });
            // Refresh stats
            this.blockchainService.getDashboardStats().subscribe({
              next: (stats) => this.stats = stats,
              error: (error) => console.error('Error loading stats:', error)
            });
          }
        },
        error: (error) => {
          this.snackBar.open('❌ Error approving record: ' + (error.error?.message || error.message), 'Close', { duration: 5000 });
        }
      });
    }
  }

  openAddStudentDialog(): void {
    const dialogRef = this.dialog.open(AddStudentDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      disableClose: false,
      data: {
        departments: this.departments.map((d: any) =>
          typeof d === 'string' ? d : d.name || d.departmentId
        )
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.addStudent(result);
      }
    });
  }

  addStudent(data: any): void {
    const loadingSnack = this.snackBar.open('⏳ Adding student to blockchain...', '', {
      duration: 0,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });

    this.blockchainService.createStudent(data).subscribe({
      next: (response) => {
        loadingSnack.dismiss();
        if (response.success) {
          this.snackBar.open('✅ Student added successfully to blockchain!', 'Close', {
            duration: 4000,
            panelClass: ['success-snackbar'],
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
          this.loadStudents();
        }
      },
      error: (error) => {
        loadingSnack.dismiss();
        const errorMsg = error.error?.message || error.message || 'Unknown error';
        this.snackBar.open('❌ Error adding student: ' + errorMsg, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar'],
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      }
    });
  }

  viewStudent(student: Student): void {
    this.router.navigate(['/admin/students', student.rollNumber]);
  }

  editStudent(student: Student): void {
    this.snackBar.open('Edit functionality coming soon', 'Close', { duration: 3000 });
  }

  openIssueCertificateDialog(): void {
    this.showCertificateForm = true;
  }

  issueCertificate(): void {
    if (!this.certificateData.studentId || !this.certificateData.certificateType) {
      this.snackBar.open('Please fill all required fields', 'Close', { duration: 3000 });
      return;
    }

    // Generate certificate ID
    const timestamp = Date.now();
    const certificateID = `CERT-${this.certificateData.studentId}-${timestamp}`;

    // Generate a sample PDF (in production, you would generate actual PDF content)
    const pdfContent = this.generateCertificatePDF(
      this.certificateData.studentId,
      this.certificateData.certificateType,
      this.certificateData.issueDate
    );

    const certData = {
      certificateID: certificateID,
      studentID: this.certificateData.studentId,
      certType: this.certificateData.certificateType,
      pdfBase64: pdfContent,
      ipfsHash: '' // Optional: Can be implemented later with IPFS integration
    };

    this.blockchainService.issueCertificate(certData).subscribe({
      next: (response) => {
        if (response.success) {
          const certificateInfo = {
            id: certificateID,
            studentId: this.certificateData.studentId,
            type: this.certificateData.certificateType,
            date: this.certificateData.issueDate
          };

          // Store last issued certificate for display
          this.lastIssuedCertificate = certificateInfo;

          // Add to recent certificates list (at the beginning)
          this.recentCertificates.unshift(certificateInfo);

          // Keep only last 10 certificates
          if (this.recentCertificates.length > 10) {
            this.recentCertificates = this.recentCertificates.slice(0, 10);
          }

          // Save to localStorage
          this.saveCertificatesToStorage();

          // Debug log
          console.log('Certificate added to list:', certificateInfo);
          console.log('Total certificates:', this.recentCertificates.length);
          console.log('Show form:', this.showCertificateForm);

          this.snackBar.open(
            `✅ Certificate issued successfully! Certificate ID: ${certificateID}`,
            'Close',
            {
              duration: 8000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
              panelClass: ['success-snackbar']
            }
          );
          this.cancelCertificateForm();
          this.refreshData();
        }
      },
      error: (error) => {
        console.error('Error issuing certificate:', error);
        this.snackBar.open(
          '❌ Error issuing certificate: ' + (error.error?.message || error.message),
          'Close',
          {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          }
        );
      }
    });
  }

  // Generate a simple base64-encoded PDF content
  generateCertificatePDF(studentId: string, certType: string, issueDate: string): string {
    // This is a minimal PDF structure in base64
    // In production, use a proper PDF library like pdfmake or jsPDF
    const pdfHeader = '%PDF-1.4\n';
    const pdfContent = `
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj

2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj

3 0 obj
<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj

4 0 obj
<< /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >>
endobj

5 0 obj
<< /Length 200 >>
stream
BT
/F1 24 Tf
100 700 Td
(NIT WARANGAL) Tj
0 -50 Td
/F1 18 Tf
(CERTIFICATE) Tj
0 -50 Td
/F1 12 Tf
(Student ID: ${studentId}) Tj
0 -30 Td
(Certificate Type: ${certType}) Tj
0 -30 Td
(Issue Date: ${issueDate}) Tj
ET
endstream
endobj

xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000214 00000 n
0000000309 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
560
%%EOF
`;

    const fullPdfContent = pdfHeader + pdfContent;

    // Convert to base64
    return btoa(fullPdfContent);
  }

  cancelCertificateForm(): void {
    this.showCertificateForm = false;
    console.log('Form closed, showCertificateForm:', this.showCertificateForm);
    this.certificateData = {
      studentId: '',
      certificateType: 'DEGREE',
      issueDate: new Date().toISOString().split('T')[0],
      validUntil: ''
    };
  }

  syncCertificatesFromBlockchain(): void {
    this.syncingCertificates = true;
    this.snackBar.open('Fetching certificates from blockchain...', 'Close', { duration: 2000 });

    // Get all students first
    this.blockchainService.getAllStudents().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const students = response.data;
          let totalCertificates = 0;
          let completedRequests = 0;
          const allCertificates: any[] = [];

          console.log(`Found ${students.length} students, fetching their certificates...`);

          // If no students, finish immediately
          if (students.length === 0) {
            this.syncingCertificates = false;
            this.snackBar.open('No students found in blockchain', 'Close', { duration: 3000 });
            return;
          }

          // Fetch certificates for each student
          students.forEach((student: any) => {
            this.blockchainService.getStudentCertificates(student.rollNumber).subscribe({
              next: (certResponse) => {
                completedRequests++;

                if (certResponse.success && certResponse.data && Array.isArray(certResponse.data)) {
                  const certs = certResponse.data;
                  totalCertificates += certs.length;

                  console.log(`📜 Student ${student.rollNumber} has ${certs.length} certificates:`, certs);

                  // Convert blockchain certificates to our format
                  // Note: chaincode returns camelCase: certificateId, studentId, issueDate
                  // Now also includes: degreeAwarded, finalCGPA, isValid
                  certs.forEach((cert: any) => {
                    const mappedCert = {
                      id: cert.certificateId || cert.certificateID || cert.id,
                      studentId: cert.studentId || cert.studentID || student.rollNumber,
                      type: cert.type || 'UNKNOWN',
                      date: this.formatDate(cert.issueDate) || new Date().toISOString().split('T')[0],
                      degreeAwarded: cert.degreeAwarded || '',
                      finalCGPA: cert.finalCGPA || 0,
                      isValid: cert.isValid !== undefined ? cert.isValid : !cert.revoked
                    };
                    console.log(`  ✓ Mapped cert:`, mappedCert);
                    allCertificates.push(mappedCert);
                  });
                }

                // When all requests are complete
                if (completedRequests === students.length) {
                  this.finalizeCertificateSync(allCertificates, totalCertificates);
                }
              },
              error: (error) => {
                completedRequests++;
                console.error(`Error fetching certificates for ${student.rollNumber}:`, error);

                // When all requests are complete (even with errors)
                if (completedRequests === students.length) {
                  this.finalizeCertificateSync(allCertificates, totalCertificates);
                }
              }
            });
          });
        } else {
          this.syncingCertificates = false;
          this.snackBar.open('Failed to fetch students', 'Close', { duration: 3000 });
        }
      },
      error: (error) => {
        this.syncingCertificates = false;
        console.error('Error syncing certificates:', error);
        this.snackBar.open('Error syncing certificates: ' + error.message, 'Close', { duration: 5000 });
      }
    });
  }

  finalizeCertificateSync(certificates: any[], count: number): void {
    this.syncingCertificates = false;

    if (certificates.length > 0) {
      // Create a map of blockchain certificates by ID for deduplication
      const blockchainCertMap = new Map();
      certificates.forEach(cert => {
        if (cert.id) {
          blockchainCertMap.set(cert.id, cert);
        }
      });

      // Get unique blockchain certificates (source of truth)
      const uniqueBlockchainCerts = Array.from(blockchainCertMap.values());

      // Count how many are new (not in existing list)
      const existingIds = new Set(this.recentCertificates.map(c => c.id));
      const newCerts = uniqueBlockchainCerts.filter(c => !existingIds.has(c.id));

      // Replace local storage with blockchain data (blockchain is source of truth)
      this.recentCertificates = uniqueBlockchainCerts;
      this.saveCertificatesToStorage();

      console.log(`📊 Sync Summary:
        - Total blockchain certificates: ${count}
        - Unique certificates: ${uniqueBlockchainCerts.length}
        - New certificates: ${newCerts.length}
        - Previously known: ${uniqueBlockchainCerts.length - newCerts.length}`);

      this.snackBar.open(
        `✅ Synced ${uniqueBlockchainCerts.length} certificates from blockchain! (${newCerts.length} new)`,
        'Close',
        {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        }
      );
    } else {
      // No certificates on blockchain, clear local storage
      this.recentCertificates = [];
      this.saveCertificatesToStorage();
      this.snackBar.open('No certificates found on blockchain', 'Close', { duration: 3000 });
    }
  }

  /**
   * Format date from blockchain (ISO string or timestamp) to readable format
   */
  formatDate(dateValue: any): string {
    if (!dateValue) {
      return new Date().toISOString().split('T')[0];
    }

    try {
      // Handle ISO date string
      if (typeof dateValue === 'string') {
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      }

      // Handle timestamp object (Go's time.Time)
      if (typeof dateValue === 'object' && dateValue.seconds) {
        const date = new Date(dateValue.seconds * 1000);
        return date.toISOString().split('T')[0];
      }

      return new Date(dateValue).toISOString().split('T')[0];
    } catch (error) {
      console.error('Error formatting date:', error);
      return new Date().toISOString().split('T')[0];
    }
  }

  // Certificate Request Methods
  loadCertificateRequests(): void {
    this.http.get<any>(`${this.apiUrl}/certificates/requests`).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const requests = response.data;
          this.pendingRequests = requests.filter((r: any) => r.status === 'PENDING');
          this.processedRequests = requests.filter((r: any) => r.status !== 'PENDING');
          console.log('Loaded certificate requests:', requests);
        }
      },
      error: (error) => {
        console.error('Error loading certificate requests:', error);
        this.snackBar.open('Failed to load certificate requests', 'Close', { duration: 3000 });
      }
    });
  }

  approveRequest(request: any): void {
    // Show confirmation dialog before issuing certificate
    const confirmed = confirm(
      `Approve certificate request and issue ${request.certificateType} certificate to student ${request.studentId}?`
    );

    if (!confirmed) return;

    // Generate certificate ID
    const timestamp = Date.now();
    const certificateID = `CERT-${request.studentId}-${timestamp}`;

    // Generate a sample PDF (in production, you would generate actual PDF content)
    const pdfContent = this.generateCertificatePDF(
      request.studentId,
      request.certificateType,
      new Date().toISOString().split('T')[0]
    );

    // Prepare certificate data for blockchain with correct field names
    const certData = {
      certificateID: certificateID,
      studentID: request.studentId,
      certType: request.certificateType,
      pdfBase64: pdfContent,
      ipfsHash: '' // Optional: Can be implemented later with IPFS integration
    };

    // Issue certificate to blockchain
    this.blockchainService.issueCertificate(certData).subscribe({
      next: (response) => {
        if (response.success) {
          // Certificate issued successfully, now update request status
          this.updateRequestStatus(request, 'APPROVED', certificateID);
          this.snackBar.open(`Certificate issued successfully! ID: ${certificateID}`, 'Close', { duration: 5000 });
        }
      },
      error: (error) => {
        console.error('Error issuing certificate:', error);
        this.snackBar.open(
          error.error?.message || 'Failed to issue certificate. Please try again.',
          'Close',
          { duration: 5000 }
        );
      }
    });
  }

  rejectRequest(request: any): void {
    // Update the request status to REJECTED
    this.updateRequestStatus(request, 'REJECTED');
  }

  updateRequestStatus(request: any, status: 'APPROVED' | 'REJECTED', certificateId?: string): void {
    // Read all requests, update the specific one, and save back
    this.http.get<any>(`${this.apiUrl}/certificates/requests`).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const requests = response.data;
          const requestIndex = requests.findIndex((r: any) => r.requestId === request.requestId);

          if (requestIndex !== -1) {
            requests[requestIndex].status = status;
            requests[requestIndex].processedDate = new Date().toISOString();
            requests[requestIndex].processedBy = this.currentUser?.userId;
            if (certificateId) {
              requests[requestIndex].certificateId = certificateId;
            }

            // Update in backend
            this.http.put<any>(`${this.apiUrl}/certificates/requests/${request.requestId}`, {
              status,
              processedDate: requests[requestIndex].processedDate,
              processedBy: requests[requestIndex].processedBy,
              certificateId: certificateId || null
            }).subscribe({
              next: () => {
                const message = certificateId
                  ? `Certificate issued successfully! ID: ${certificateId}`
                  : `Request ${status.toLowerCase()} successfully!`;
                this.snackBar.open(message, 'Close', { duration: 5000 });
                this.loadCertificateRequests();
              },
              error: (error) => {
                console.error('Error updating request:', error);
                // Fallback: Update locally
                this.pendingRequests = this.pendingRequests.filter(r => r.requestId !== request.requestId);
                request.status = status;
                request.processedDate = new Date().toISOString();
                if (certificateId) {
                  request.certificateId = certificateId;
                }
                this.processedRequests.unshift(request);
                this.snackBar.open(`Request ${status.toLowerCase()}!`, 'Close', { duration: 3000 });
              }
            });
          }
        }
      },
      error: (error) => {
        console.error('Error fetching requests:', error);
        // Fallback: Update locally only
        this.pendingRequests = this.pendingRequests.filter(r => r.requestId !== request.requestId);
        request.status = status;
        request.processedDate = new Date().toISOString();
        if (certificateId) {
          request.certificateId = certificateId;
        }
        this.processedRequests.unshift(request);
        this.snackBar.open(`Request ${status.toLowerCase()}!`, 'Close', { duration: 3000 });
      }
    });
  }

  viewRequestDetails(request: any): void {
    const details = `
      Request ID: ${request.requestId}
      Student ID: ${request.studentId}
      Certificate Type: ${request.certificateType}
      Purpose: ${request.purpose}
      Additional Details: ${request.additionalDetails || 'N/A'}
      Request Date: ${new Date(request.requestDate).toLocaleString()}
      Status: ${request.status}
    `;

    alert(details);
  }

  // ============ Department Management Methods ============

  loadDepartments(): void {
    this.loadingDepartments = true;
    this.http.get<any>(`${this.apiUrl}/department/all`).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.allDepartments = response.data;
          this.filteredDepartments = [...response.data];
          // Load all courses after departments are loaded
          this.loadAllCourses();
        }
        this.loadingDepartments = false;
      },
      error: (error) => {
        console.error('Error loading departments:', error);
        this.snackBar.open('Failed to load departments', 'Close', { duration: 3000 });
        this.loadingDepartments = false;
      }
    });
  }

  createDepartment(): void {
    if (!this.departmentData.departmentId || !this.departmentData.departmentName ||
      !this.departmentData.hod || !this.departmentData.email || !this.departmentData.phone) {
      this.snackBar.open('Please fill all required fields', 'Close', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '500px',
      data: {
        type: 'info',
        title: 'Create Department',
        message: 'Are you sure you want to create this department?',
        details: [
          { icon: 'badge', label: 'Department ID', value: this.departmentData.departmentId },
          { icon: 'business', label: 'Name', value: this.departmentData.departmentName },
          { icon: 'person', label: 'HOD', value: this.departmentData.hod },
          { icon: 'email', label: 'Email', value: this.departmentData.email },
          { icon: 'phone', label: 'Phone', value: this.departmentData.phone }
        ],
        confirmText: 'Create',
        confirmIcon: 'add',
        confirmColor: 'primary',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;

      this.http.post<any>(`${this.apiUrl}/department/create`, this.departmentData).subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('✅ Department created successfully!', 'Close', { duration: 3000 });
            this.resetDepartmentForm();
            this.loadDepartments();
            this.showDepartmentForm = false;
          }
        },
        error: (error) => {
          console.error('Error creating department:', error);
          this.snackBar.open(
            '❌ ' + (error.error?.message || 'Failed to create department'),
            'Close',
            { duration: 5000 }
          );
        }
      });
    });
  }

  resetDepartmentForm(): void {
    this.departmentData = {
      departmentId: '',
      departmentName: '',
      hod: '',
      email: '',
      phone: ''
    };
  }

  toggleDepartmentForm(): void {
    this.showDepartmentForm = !this.showDepartmentForm;
  }

  filterDepartments(): void {
    if (!this.departmentSearchQuery.trim()) {
      this.filteredDepartments = [...this.allDepartments];
      return;
    }

    const query = this.departmentSearchQuery.toLowerCase();
    this.filteredDepartments = this.allDepartments.filter(dept =>
      dept.departmentName?.toLowerCase().includes(query) ||
      dept.departmentId?.toLowerCase().includes(query) ||
      dept.hod?.toLowerCase().includes(query) ||
      dept.email?.toLowerCase().includes(query)
    );
  }

  clearDepartmentSearch(): void {
    this.departmentSearchQuery = '';
    this.filterDepartments();
  }

  getDepartmentWithMostStudents(): string {
    // This is a placeholder - implement based on your data structure
    return this.allDepartments.length > 0 ? this.allDepartments[0].departmentId : 'N/A';
  }

  viewDepartmentDetails(dept: any): void {
    this.snackBar.open(`Viewing details for ${dept.departmentName}`, 'Close', { duration: 2000 });
    // Implement detailed view modal or navigate to details page
  }

  editDepartment(dept: any): void {
    this.departmentData = { ...dept };
    this.showDepartmentForm = true;
    this.snackBar.open('Edit mode - update details and save', 'Close', { duration: 2000 });
  }

  // ============ Course Management Methods ============

  loadCoursesByDepartment(departmentId: string): void {
    if (!departmentId) {
      this.departmentCourses = [];
      this.filterCourses();
      return;
    }

    this.loadingCourses = true;
    this.http.get<any>(`${this.apiUrl}/department/${departmentId}/courses`).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.departmentCourses = response.data;
          // Merge with existing courses
          const existingCourseIds = new Set(this.allCourses.map(c => c.courseCode));
          const newCourses = response.data.filter((c: any) => !existingCourseIds.has(c.courseCode));
          this.allCourses = [...this.allCourses, ...newCourses];
          this.filterCourses();
        }
        this.loadingCourses = false;
      },
      error: (error) => {
        console.error('Error loading courses:', error);
        this.snackBar.open('Failed to load courses', 'Close', { duration: 3000 });
        this.loadingCourses = false;
      }
    });
  }

  loadAllCourses(): void {
    // Load courses from all departments
    this.loadingCourses = true;
    this.allCourses = [];
    let departmentsProcessed = 0;

    if (this.allDepartments.length === 0) {
      this.loadingCourses = false;
      this.filterCourses();
      return;
    }

    this.allDepartments.forEach(dept => {
      this.http.get<any>(`${this.apiUrl}/department/${dept.departmentId}/courses`).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.allCourses = [...this.allCourses, ...response.data];
          }
          departmentsProcessed++;
          if (departmentsProcessed === this.allDepartments.length) {
            this.loadingCourses = false;
            this.filterCourses();
          }
        },
        error: (error) => {
          console.error(`Error loading courses for ${dept.departmentId}:`, error);
          departmentsProcessed++;
          if (departmentsProcessed === this.allDepartments.length) {
            this.loadingCourses = false;
            this.filterCourses();
          }
        }
      });
    });
  }

  createCourseOffering(): void {
    if (!this.courseData.departmentId || !this.courseData.courseCode ||
      !this.courseData.courseName || !this.courseData.credits ||
      !this.courseData.semester || !this.courseData.academicYear) {
      this.snackBar.open('Please fill all required fields', 'Close', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '500px',
      data: {
        type: 'info',
        title: 'Create Course Offering',
        message: 'Are you sure you want to create this course offering?',
        details: [
          { icon: 'school', label: 'Department', value: this.courseData.departmentId },
          { icon: 'code', label: 'Course Code', value: this.courseData.courseCode },
          { icon: 'book', label: 'Course Name', value: this.courseData.courseName },
          { icon: 'grade', label: 'Credits', value: this.courseData.credits },
          { icon: 'calendar_today', label: 'Semester', value: this.courseData.semester },
          { icon: 'event', label: 'Academic Year', value: this.courseData.academicYear }
        ],
        confirmText: 'Create',
        confirmIcon: 'add',
        confirmColor: 'primary',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;

      this.http.post<any>(`${this.apiUrl}/department/courses/create`, this.courseData).subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('✅ Course offering created successfully!', 'Close', { duration: 3000 });
            this.resetCourseForm();
            this.loadAllCourses();
            this.showCourseForm = false;
          }
        },
        error: (error) => {
          console.error('Error creating course offering:', error);
          this.snackBar.open(
            '❌ ' + (error.error?.message || 'Failed to create course offering'),
            'Close',
            { duration: 5000 }
          );
        }
      });
    });
  }

  resetCourseForm(): void {
    this.courseData = {
      departmentId: '',
      courseCode: '',
      courseName: '',
      credits: 4,
      semester: 1,
      academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1).toString().slice(-2)
    };
  }

  toggleCourseForm(): void {
    this.showCourseForm = !this.showCourseForm;
  }

  filterCourses(): void {
    let filtered = [...this.allCourses];

    // Apply search filter
    if (this.courseSearchQuery.trim()) {
      const query = this.courseSearchQuery.toLowerCase();
      filtered = filtered.filter(course =>
        course.courseName?.toLowerCase().includes(query) ||
        course.courseCode?.toLowerCase().includes(query) ||
        course.departmentId?.toLowerCase().includes(query)
      );
    }

    // Apply department filter
    if (this.selectedDepartmentFilter) {
      filtered = filtered.filter(course =>
        course.departmentId === this.selectedDepartmentFilter
      );
    }

    // Apply semester filter
    if (this.selectedSemesterFilter !== '') {
      filtered = filtered.filter(course =>
        course.semester === this.selectedSemesterFilter
      );
    }

    this.filteredCourses = filtered;
  }

  clearCourseSearch(): void {
    this.courseSearchQuery = '';
    this.filterCourses();
  }

  clearCourseFilters(): void {
    this.courseSearchQuery = '';
    this.selectedDepartmentFilter = '';
    this.selectedSemesterFilter = '';
    this.filterCourses();
  }

  getAllCoursesCount(): number {
    return this.allCourses.length;
  }

  getActiveCoursesCount(): number {
    return this.allCourses.filter(c => c.isActive).length;
  }

  viewCourseDetails(course: any): void {
    this.snackBar.open(`Viewing details for ${course.courseName}`, 'Close', { duration: 2000 });
    // Implement detailed view modal or navigate to details page
  }

  editCourse(course: any): void {
    this.courseData = { ...course };
    this.showCourseForm = true;
    this.snackBar.open('Edit mode - update details and save', 'Close', { duration: 2000 });
  }

  toggleCourseStatus(course: any): void {
    const action = course.isActive ? 'deactivate' : 'activate';
    const confirmed = confirm(`Are you sure you want to ${action} ${course.courseName}?`);
    if (!confirmed) return;

    // Implement course status toggle API call
    this.snackBar.open(`Course ${action}d successfully`, 'Close', { duration: 2000 });
    course.isActive = !course.isActive;
  }

  logout(): void {
    this.authService.logout();
  }
}

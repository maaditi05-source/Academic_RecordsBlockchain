import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { BlockchainService } from '../../core/services/blockchain.service';
import { CertificateRequestDialogComponent } from './certificate-request-dialog.component';
import { APP_CONFIG } from '../../core/config/app.config';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [
    CommonModule, MatTabsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatTableModule, MatChipsModule, MatProgressSpinnerModule, MatSnackBarModule,
    MatDialogModule, MatTooltipModule, MatSelectModule, MatDividerModule,
    MatBadgeModule, HttpClientModule
  ],
  template: `
    <!-- Dashboard Header -->
    <div class="dashboard-container">
      <header class="dash-header">
        <div class="header-content">
          <div class="header-left">
            <div class="avatar-ring">
              <div class="avatar">{{ getInitials() }}</div>
            </div>
            <div class="header-info">
              <h1>{{ student?.name || currentUser?.name || 'Student' }}</h1>
              <p class="subtitle">
                <span class="roll-badge">{{ rollNumber || '—' }}</span>
                <span class="dept-badge">{{ student?.department || 'CSE' }}</span>
                <span class="year-badge" *ngIf="student?.enrollmentYear">Batch {{ student?.enrollmentYear }}</span>
              </p>
            </div>
          </div>
          <div class="header-right">
            <div class="header-stat" *ngIf="cgpaData">
              <span class="stat-number">{{ cgpaData.cgpa }}</span>
              <span class="stat-text">CGPA</span>
            </div>
            <div class="header-stat" *ngIf="cgpaData">
              <span class="stat-number">{{ cgpaData.totalCredits }}</span>
              <span class="stat-text">Credits</span>
            </div>
            <button mat-raised-button color="warn" (click)="logout()" class="logout-btn">
              <mat-icon>logout</mat-icon> Logout
            </button>
          </div>
        </div>
      </header>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-state">
        <mat-spinner diameter="48"></mat-spinner>
        <p>Loading your academic data...</p>
      </div>

      <!-- Main Content Tabs -->
      <mat-tab-group *ngIf="!loading" animationDuration="300ms" class="main-tabs">
        <!-- ═══ TAB 1: MY INFO ═══ -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">person</mat-icon>
            <span>My Info</span>
          </ng-template>
          <div class="tab-content">
            <div class="info-grid">
              <div class="info-card glass-card" *ngFor="let item of profileFields">
                <div class="info-icon" [style.background]="item.color">
                  <mat-icon>{{ item.icon }}</mat-icon>
                </div>
                <div class="info-text">
                  <span class="label">{{ item.label }}</span>
                  <span class="value">{{ item.value || 'N/A' }}</span>
                </div>
              </div>
            </div>

            <div class="section-title mt-4">
              <mat-icon>shield</mat-icon>
              <h3>Account Status</h3>
            </div>
            <div class="status-row">
              <span class="status-badge" [class]="student?.status?.toLowerCase() || 'active'">
                {{ student?.status || 'ACTIVE' }}
              </span>
              <span class="text-muted ml-2">Since {{ student?.createdAt | date:'mediumDate' }}</span>
            </div>
          </div>
        </mat-tab>

        <!-- ═══ TAB 2: COURSES & MARKS ═══ -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">school</mat-icon>
            <span>Courses & Marks</span>
          </ng-template>
          <div class="tab-content">
            <!-- Enrolled Courses -->
            <div class="section-title" style="margin-bottom: 16px;">
              <mat-icon>class</mat-icon>
              <h3>Enrolled Courses</h3>
            </div>
            <div class="course-grid" *ngIf="enrolledCourses.length > 0">
              <div class="course-enroll-card glass-card" *ngFor="let c of enrolledCourses">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                  <span class="course-code">{{ c.code }}</span>
                  <span class="course-type-tag" [class.elective]="c.type === 'elective'">{{ c.type }}</span>
                </div>
                <h4 style="color: #e2e8f0; font-size: 14px; margin: 0 0 8px;">{{ c.name }}</h4>
                <div style="display:flex;gap:16px;font-size:12px;color:#94a3b8;">
                  <span><mat-icon style="font-size:14px;width:14px;height:14px;vertical-align:middle;">event</mat-icon> Sem {{ c.semester }}</span>
                  <span><mat-icon style="font-size:14px;width:14px;height:14px;vertical-align:middle;">star</mat-icon> {{ c.credits }} Cr</span>
                </div>
                <p style="margin:6px 0 0;font-size:12px;color:#64748b;">Faculty: {{ c.facultyName || c.faculty }}</p>
              </div>
            </div>
            <div *ngIf="enrolledCourses.length === 0" class="empty-state" style="padding:24px;">
              <mat-icon>school</mat-icon>
              <p>No courses found for your department</p>
            </div>

            <mat-divider style="margin: 24px 0;"></mat-divider>

            <!-- Semester Selector -->
            <div class="section-title" style="margin-bottom: 16px;">
              <mat-icon>grading</mat-icon>
              <h3>Marks & Grades</h3>
            </div>
            <div class="semester-bar">
              <button mat-stroked-button *ngFor="let sem of semesters"
                [class.active-sem]="selectedSemester === sem"
                (click)="selectSemester(sem)">
                Sem {{ sem }}
              </button>
              <button mat-stroked-button [class.active-sem]="selectedSemester === 0"
                (click)="selectSemester(0)">
                All
              </button>
            </div>

            <!-- Marks Table -->
            <div class="marks-table-wrapper" *ngIf="filteredMarks.length > 0">
              <table class="modern-table">
                <thead>
                  <tr>
                    <th>Course Code</th>
                    <th>Course Name</th>
                    <th>Semester</th>
                    <th>Credits</th>
                    <th>Marks</th>
                    <th>Grade</th>
                    <th>GP</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let m of filteredMarks" class="fade-in">
                    <td><span class="course-code">{{ m.courseCode }}</span></td>
                    <td>{{ m.courseName }}</td>
                    <td>{{ m.semester }}</td>
                    <td>{{ m.credits }}</td>
                    <td><strong>{{ m.marksObtained }}</strong>/{{ m.maxMarks }}</td>
                    <td><span class="grade-chip" [attr.data-grade]="m.grade">{{ m.grade }}</span></td>
                    <td>{{ m.gradePoint }}</td>
                    <td><span class="status-badge" [class]="m.status">{{ m.status }}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- SGPA Summary -->
            <div class="sgpa-bar" *ngIf="selectedSemester > 0 && semesterData">
              <div class="sgpa-item">
                <span class="sgpa-label">SGPA</span>
                <span class="sgpa-value">{{ semesterData.sgpa }}</span>
              </div>
              <div class="sgpa-item">
                <span class="sgpa-label">Credits</span>
                <span class="sgpa-value">{{ semesterData.totalCredits }}</span>
              </div>
            </div>

            <div *ngIf="filteredMarks.length === 0" class="empty-state">
              <mat-icon>menu_book</mat-icon>
              <p>No marks recorded yet for this selection</p>
            </div>
          </div>
        </mat-tab>

        <!-- ═══ TAB 3: GRADE SHEETS ═══ -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">description</mat-icon>
            <span>Grade Sheets</span>
          </ng-template>
          <div class="tab-content">
            <div class="gradesheet-grid">
              <!-- Semester-wise downloads -->
              <div class="gs-card glass-card" *ngFor="let sem of semesters">
                <div class="gs-header">
                  <mat-icon>assignment</mat-icon>
                  <h4>Semester {{ sem }}</h4>
                </div>
                <p class="gs-info text-muted">{{ getMarkCountForSem(sem) }} courses</p>
                <button mat-raised-button class="gs-download" (click)="downloadGradeSheet(sem)">
                  <mat-icon>download</mat-icon> Download Grade Sheet
                </button>
              </div>

              <!-- Consolidated Marksheet -->
              <div class="gs-card glass-card consolidated" *ngIf="semesters.length > 0">
                <div class="gs-header">
                  <mat-icon>library_books</mat-icon>
                  <h4>Consolidated Marksheet</h4>
                </div>
                <p class="gs-info text-muted">All {{ semesters.length }} semesters combined</p>
                <button mat-raised-button color="primary" class="gs-download" (click)="downloadConsolidated()">
                  <mat-icon>download</mat-icon> Download Consolidated
                </button>
              </div>
            </div>
          </div>
        </mat-tab>

        <!-- ═══ TAB 4: CERTIFICATES ═══ -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">verified</mat-icon>
            <span>Certificates</span>
            <span class="cert-count" *ngIf="certificates.length > 0">{{ certificates.length }}</span>
          </ng-template>
          <div class="tab-content">
            <div class="cert-actions">
              <button mat-raised-button color="primary" (click)="requestCertificate()">
                <mat-icon>add_circle</mat-icon> Request New Certificate
              </button>
            </div>

            <div class="cert-grid" *ngIf="certificates.length > 0">
              <div class="cert-card glass-card" *ngFor="let cert of certificates">
                <div class="cert-top">
                  <mat-icon class="cert-icon" [style.color]="cert.status === 'APPROVED' || cert.status === 'ISSUED' ? '#4ade80' : cert.status === 'REJECTED' ? '#f87171' : '#fbbf24'">
                    {{ cert.status === 'APPROVED' || cert.status === 'ISSUED' ? 'verified' : cert.status === 'REJECTED' ? 'cancel' : 'pending_actions' }}
                  </mat-icon>
                  <span class="cert-type">{{ cert.certificateType || 'Academic' }}</span>
                </div>
                <h4 style="color: #e2e8f0; font-size: 14px; word-break: break-all;">{{ cert.certificateId || cert.id }}</h4>
                <p style="color: #94a3b8; margin: 4px 0;" *ngIf="cert.purpose">Purpose: {{ cert.purpose }}</p>
                <p style="color: #94a3b8; margin: 4px 0;">{{ cert.isRequest ? 'Requested' : 'Issued' }}: {{ (cert.requestDate || cert.issueDate || cert.createdAt) | date:'mediumDate' }}</p>
                <p style="color: #64748b; font-size: 12px; margin: 4px 0;" *ngIf="cert.processedBy">Approved by: {{ cert.processedBy }}</p>
                <p style="color: #64748b; font-size: 12px; margin: 4px 0;" *ngIf="cert.processedDate">Approved: {{ cert.processedDate | date:'mediumDate' }}</p>

                <div class="cert-status" style="margin: 8px 0;">
                  <span class="status-badge" [class]="cert.status?.toLowerCase() || 'pending'">
                    {{ cert.status || 'PENDING' }}
                  </span>
                </div>

                <button mat-raised-button color="primary"
                  *ngIf="cert.status === 'ISSUED' || cert.status === 'APPROVED'"
                  (click)="downloadCertificate(cert)" class="cert-dl-btn" style="margin-top: 8px; width: 100%;">
                  <mat-icon>download</mat-icon> Download Certificate PDF
                </button>
              </div>
            </div>

            <div *ngIf="certificates.length === 0" class="empty-state">
              <mat-icon>card_membership</mat-icon>
              <p>No certificates yet. Request one to get started!</p>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .dashboard-container {
      max-width: 1200px; margin: 0 auto; padding: 24px;
      min-height: 100vh;
    }

    /* ── Header ────────────────────────────────────────────── */
    .dash-header {
      background: linear-gradient(135deg, #0f766e 0%, #0891b2 50%, #6366f1 100%);
      border-radius: 20px; padding: 32px; margin-bottom: 24px;
      position: relative; overflow: hidden;
      &::before {
        content: ''; position: absolute; inset: 0;
        background: radial-gradient(circle at 90% 20%, rgba(255,255,255,0.1) 0%, transparent 50%);
      }
    }
    .header-content {
      display: flex; justify-content: space-between; align-items: center;
      position: relative; z-index: 1; flex-wrap: wrap; gap: 16px;
    }
    .header-left { display: flex; align-items: center; gap: 20px; }
    .avatar-ring {
      width: 72px; height: 72px; border-radius: 50%;
      background: linear-gradient(135deg, #2dd4bf, #22d3ee);
      padding: 3px; flex-shrink: 0;
    }
    .avatar {
      width: 100%; height: 100%; border-radius: 50%;
      background: rgba(0,0,0,0.4); display: flex;
      align-items: center; justify-content: center;
      font-size: 1.5rem; font-weight: 700; color: #fff;
    }
    .header-info h1 { color: #fff; font-size: 1.75rem; font-weight: 700; margin: 0; }
    .subtitle { display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap; }
    .roll-badge, .dept-badge, .year-badge {
      padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;
    }
    .roll-badge { background: rgba(255,255,255,0.2); color: #fff; }
    .dept-badge { background: rgba(45,212,191,0.3); color: #2dd4bf; }
    .year-badge { background: rgba(167,139,250,0.3); color: #a78bfa; }

    .header-right { display: flex; align-items: center; gap: 24px; }
    .header-stat {
      text-align: center;
      .stat-number {
        display: block; font-size: 1.75rem; font-weight: 700; color: #fff;
      }
      .stat-text { font-size: 0.75rem; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 1px; }
    }
    .logout-btn { border-radius: 12px !important; }

    /* ── Loading ───────────────────────────────────────────── */
    .loading-state {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; min-height: 300px; gap: 16px;
      p { color: var(--text-secondary); }
    }

    /* ── Main Tabs ─────────────────────────────────────────── */
    .main-tabs {
      ::ng-deep .mat-mdc-tab-header {
        background: rgba(15,23,42,0.7) !important; border-radius: 16px 16px 0 0;
        border: 1px solid rgba(148,163,184,0.1); border-bottom: none;
      }
    }
    .tab-icon { margin-right: 8px; font-size: 20px; }
    .tab-content { padding: 24px; animation: fadeIn 0.4s ease-out; }

    /* ── Info Grid ──────────────────────────────────────────── */
    .info-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;
    }
    .info-card {
      display: flex; align-items: center; gap: 16px;
      padding: 20px; border-radius: 14px;
      background: rgba(15,23,42,0.6); border: 1px solid rgba(148,163,184,0.08);
      transition: all 0.3s ease;
      &:hover { border-color: rgba(56,189,248,0.2); transform: translateY(-2px); }
    }
    .info-icon {
      width: 48px; height: 48px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      mat-icon { color: #fff; }
    }
    .info-text {
      display: flex; flex-direction: column;
      .label { font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
      .value { font-size: 16px; font-weight: 600; color: var(--text-primary); margin-top: 2px; }
    }

    .section-title {
      display: flex; align-items: center; gap: 8px;
      h3 { font-size: 1.1rem; font-weight: 600; }
      mat-icon { color: var(--accent-teal); }
    }
    .status-row { margin-top: 12px; display: flex; align-items: center; }

    /* ── Semester Bar ───────────────────────────────────────── */
    .semester-bar {
      display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap;
      button {
        border-radius: 20px !important; border-color: rgba(148,163,184,0.2) !important;
        color: var(--text-secondary) !important; font-weight: 500 !important;
        &.active-sem {
          background: linear-gradient(135deg, #0f766e, #0891b2) !important;
          color: #fff !important; border-color: transparent !important;
        }
      }
    }

    /* ── Modern Table ──────────────────────────────────────── */
    .marks-table-wrapper { overflow-x: auto; border-radius: 12px; }
    .modern-table {
      width: 100%; border-collapse: collapse;
      background: rgba(15,23,42,0.5); border-radius: 12px; overflow: hidden;
      thead tr {
        background: linear-gradient(135deg, rgba(15,118,110,0.5), rgba(8,145,178,0.5));
        th {
          padding: 14px 16px; color: #e2e8f0; font-weight: 600; font-size: 13px;
          text-transform: uppercase; letter-spacing: 0.5px; text-align: left;
        }
      }
      tbody tr {
        border-bottom: 1px solid rgba(148,163,184,0.06);
        transition: background 0.2s;
        &:hover { background: rgba(56,189,248,0.04); }
        &:nth-child(even) { background: rgba(17,24,39,0.3); }
        td {
          padding: 12px 16px; color: var(--text-primary); font-size: 14px;
        }
      }
    }
    .course-code {
      font-family: 'JetBrains Mono', monospace; font-weight: 600;
      color: var(--accent-cyan); font-size: 13px;
    }
    .grade-chip {
      display: inline-block; padding: 3px 10px; border-radius: 12px;
      font-weight: 700; font-size: 13px;
      background: rgba(45,212,191,0.15); color: var(--accent-teal);
      &[data-grade="A+"] { color: #34d399; background: rgba(52,211,153,0.15); }
      &[data-grade="A"] { color: #2dd4bf; background: rgba(45,212,191,0.15); }
      &[data-grade="B+"] { color: #38bdf8; background: rgba(56,189,248,0.15); }
      &[data-grade="B"] { color: #60a5fa; background: rgba(96,165,250,0.15); }
      &[data-grade="C"] { color: #fbbf24; background: rgba(251,191,36,0.15); }
      &[data-grade="D"] { color: #fb923c; background: rgba(251,146,60,0.15); }
      &[data-grade="F"] { color: #fb7185; background: rgba(251,113,133,0.15); }
    }

    .sgpa-bar {
      display: flex; gap: 24px; margin-top: 20px; padding: 16px 24px;
      background: rgba(15,118,110,0.1); border: 1px solid rgba(45,212,191,0.2);
      border-radius: 12px;
    }
    .sgpa-item {
      display: flex; flex-direction: column;
      .sgpa-label { font-size: 12px; color: var(--text-muted); text-transform: uppercase; }
      .sgpa-value { font-size: 1.5rem; font-weight: 700; color: var(--accent-teal); }
    }

    /* ── Empty State ───────────────────────────────────────── */
    .empty-state {
      text-align: center; padding: 48px; color: var(--text-muted);
      mat-icon { font-size: 48px; width: 48px; height: 48px; opacity: 0.4; margin-bottom: 12px; }
      p { font-size: 16px; }
    }

    /* ── Grade Sheet Grid ──────────────────────────────────── */
    .gradesheet-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px;
    }
    .gs-card {
      padding: 24px; border-radius: 14px;
      background: rgba(15,23,42,0.6); border: 1px solid rgba(148,163,184,0.08);
      transition: all 0.3s ease;
      &:hover { border-color: rgba(56,189,248,0.2); transform: translateY(-2px); }
      &.consolidated {
        border-color: rgba(45,212,191,0.3);
        background: linear-gradient(135deg, rgba(15,118,110,0.1), rgba(8,145,178,0.1));
      }
    }
    .gs-header {
      display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
      mat-icon { color: var(--accent-teal); }
      h4 { font-weight: 600; margin: 0; }
    }
    .gs-info { margin-bottom: 16px; }
    .gs-download { width: 100%; border-radius: 10px !important; }

    /* ── Certificates ──────────────────────────────────────── */
    .cert-actions { margin-bottom: 20px; }
    .cert-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;
    }
    .cert-card {
      padding: 24px; border-radius: 14px;
      background: rgba(15,23,42,0.6); border: 1px solid rgba(148,163,184,0.08);
      transition: all 0.3s ease;
      &:hover { border-color: rgba(56,189,248,0.2); }
    }
    .cert-top {
      display: flex; align-items: center; gap: 8px; margin-bottom: 12px;
    }
    .cert-icon { color: var(--accent-amber); font-size: 28px; width: 28px; height: 28px; }
    .cert-type {
      font-size: 12px; text-transform: uppercase; letter-spacing: 1px;
      color: var(--text-muted); font-weight: 600;
    }
    .cert-status { margin: 12px 0; }
    .cert-dl-btn { width: 100%; margin-top: 8px; border-radius: 10px !important; }

    /* ── Approval Pipeline ─────────────────────────────────── */
    .approval-pipeline {
      display: flex; gap: 4px; margin: 12px 0; flex-wrap: wrap;
    }
    .pipeline-step {
      display: flex; align-items: center; gap: 4px;
      padding: 4px 10px; border-radius: 16px; font-size: 11px;
      background: rgba(148,163,184,0.08); color: var(--text-muted);
      &.done { background: rgba(52,211,153,0.15); color: var(--success); mat-icon { font-size: 14px; width: 14px; height: 14px; } }
      &.pending { background: rgba(251,191,36,0.15); color: var(--warning); mat-icon { font-size: 14px; width: 14px; height: 14px; } }
      &.rejected { background: rgba(251,113,133,0.15); color: var(--danger); mat-icon { font-size: 14px; width: 14px; height: 14px; } }
    }

    .cert-count {
      background: var(--accent-teal); color: #0a0e1a;
      border-radius: 10px; padding: 2px 8px; font-size: 11px;
      font-weight: 700; margin-left: 6px;
    }

    @media (max-width: 768px) {
      .header-content { flex-direction: column; text-align: center; }
      .header-left { flex-direction: column; }
      .header-right { justify-content: center; }
      .info-grid { grid-template-columns: 1fr; }
    }
    .course-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px;
    }
    .course-enroll-card {
      padding: 16px; border-radius: 12px;
      background: rgba(15,23,42,0.6); border: 1px solid rgba(148,163,184,0.08);
      transition: all 0.3s ease;
      &:hover { border-color: rgba(56,189,248,0.2); transform: translateY(-2px); }
    }
    .course-type-tag {
      font-size: 10px; text-transform: uppercase; padding: 2px 8px; border-radius: 8px;
      background: rgba(45,212,191,0.15); color: #2dd4bf; font-weight: 600;
      &.elective { background: rgba(251,191,36,0.15); color: #fbbf24; }
    }
  `]
})
export class StudentProfileComponent implements OnInit {
  currentUser = this.authService.currentUser;
  rollNumber: string | null = null;
  loading = true;
  student: any = null;
  marks: any[] = [];
  filteredMarks: any[] = [];
  certificates: any[] = [];
  enrolledCourses: any[] = [];
  semesters: number[] = [];
  selectedSemester = 0;
  cgpaData: any = null;
  semesterData: any = null;
  profileFields: any[] = [];
  isViewingAsAdmin = false;
  private apiUrl = APP_CONFIG.api.baseUrl;

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
    this.route.params.subscribe(params => {
      this.rollNumber = params['rollNumber'];
      this.isViewingAsAdmin = !!this.rollNumber && this.currentUser?.role === 'admin';
      if (!this.rollNumber) {
        this.rollNumber = this.currentUser?.userId || null;
      }
      if (this.rollNumber) {
        this.loadAllData();
      } else {
        this.snackBar.open('Unable to identify student', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  async loadAllData() {
    this.loading = true;
    try {
      await Promise.all([
        this.loadStudent(),
        this.loadMarks(),
        this.loadCertificates(),
        this.loadCGPA(),
        this.loadEnrolledCourses()
      ]);
    } finally {
      this.loading = false;
    }
  }

  private loadStudent(): Promise<void> {
    return new Promise(resolve => {
      this.blockchainService.getStudent(this.rollNumber!).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.student = res.data;
            this.buildProfileFields();
          }
          resolve();
        },
        error: () => resolve()
      });
    });
  }

  private loadMarks(): Promise<void> {
    return new Promise(resolve => {
      this.http.get<any>(`${this.apiUrl}/marks/${this.rollNumber}`).subscribe({
        next: (res) => {
          if (res.success) {
            this.marks = res.data || [];
            this.filteredMarks = this.marks;
            // Extract unique semesters
            const semSet = new Set(this.marks.map((m: any) => m.semester));
            this.semesters = Array.from(semSet).sort((a, b) => a - b);
          }
          resolve();
        },
        error: () => resolve()
      });
    });
  }

  private loadCertificates(): Promise<void> {
    return new Promise(resolve => {
      const token = localStorage.getItem('access_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      // Load blockchain certificates
      this.blockchainService.getStudentCertificates(this.rollNumber!).subscribe({
        next: (res) => {
          const blockchainCerts = res.success && Array.isArray(res.data) ? res.data : [];

          // Also load certificate requests to show pending/approved status
          this.http.get<any>(`${this.apiUrl}/certificates/requests`, { headers }).subscribe({
            next: (reqRes) => {
              const requests = reqRes.success && Array.isArray(reqRes.data) ? reqRes.data : [];
              // Filter only this student's requests
              const myRequests = requests.filter((r: any) => r.studentId === this.rollNumber);
              // Convert requests to cert-like objects for display
              const requestCerts = myRequests.map((r: any) => ({
                certificateId: r.requestId,
                certificateType: r.certificateType,
                status: r.status,
                requestDate: r.requestDate,
                purpose: r.purpose,
                processedBy: r.processedBy,
                processedDate: r.processedDate,
                isRequest: true
              }));

              // Merge: blockchain certs first, then requests not already on blockchain
              this.certificates = [...blockchainCerts, ...requestCerts];
              resolve();
            },
            error: () => { this.certificates = blockchainCerts; resolve(); }
          });
        },
        error: () => resolve()
      });
    });
  }

  private loadCGPA(): Promise<void> {
    return new Promise(resolve => {
      this.http.get<any>(`${this.apiUrl}/marks/${this.rollNumber}/cgpa`).subscribe({
        next: (res) => {
          if (res.success) this.cgpaData = res.data;
          resolve();
        },
        error: () => resolve()
      });
    });
  }

  private loadEnrolledCourses(): Promise<void> {
    return new Promise(resolve => {
      const dept = this.student?.department || 'CSE';
      const token = localStorage.getItem('access_token');
      const headers = { 'Authorization': `Bearer ${token}` };
      this.http.get<any>(`${this.apiUrl}/courses?department=${dept}`, { headers }).subscribe({
        next: (res) => {
          this.enrolledCourses = res.success ? res.data : [];
          resolve();
        },
        error: () => { this.enrolledCourses = []; resolve(); }
      });
    });
  }

  buildProfileFields() {
    const s = this.student;
    this.profileFields = [
      { icon: 'badge', label: 'Roll Number', value: s?.rollNumber || s?.studentId || this.rollNumber, color: 'linear-gradient(135deg,#0f766e,#0891b2)' },
      { icon: 'person', label: 'Full Name', value: s?.name, color: 'linear-gradient(135deg,#6366f1,#8b5cf6)' },
      { icon: 'business', label: 'Department', value: s?.department, color: 'linear-gradient(135deg,#059669,#34d399)' },
      { icon: 'email', label: 'Email', value: s?.email || this.currentUser?.email, color: 'linear-gradient(135deg,#0284c7,#38bdf8)' },
      { icon: 'calendar_today', label: 'Enrollment Year', value: s?.enrollmentYear, color: 'linear-gradient(135deg,#d97706,#fbbf24)' },
      { icon: 'category', label: 'Admission Category', value: s?.admissionCategory || 'GENERAL', color: 'linear-gradient(135deg,#e11d48,#fb7185)' },
    ];
  }

  selectSemester(sem: number) {
    this.selectedSemester = sem;
    if (sem === 0) {
      this.filteredMarks = this.marks;
      this.semesterData = null;
    } else {
      this.filteredMarks = this.marks.filter(m => m.semester === sem);
      // Calculate SGPA for selected semester
      let totalCredits = 0, weighted = 0;
      for (const m of this.filteredMarks) {
        if (m.status === 'verified') {
          totalCredits += m.credits;
          weighted += m.gradePoint * m.credits;
        }
      }
      this.semesterData = {
        sgpa: totalCredits > 0 ? (weighted / totalCredits).toFixed(2) : '0.00',
        totalCredits
      };
    }
  }

  getMarkCountForSem(sem: number): number {
    return this.marks.filter(m => m.semester === sem).length;
  }

  getInitials(): string {
    const name = this.student?.name || this.currentUser?.name || '';
    return name.split(' ').map((w: string) => w[0] || '').join('').substring(0, 2).toUpperCase();
  }

  // ── PDF Downloads ─────────────────────────────────────────────
  downloadGradeSheet(semester: number) {
    const semMarks = this.marks.filter(m => m.semester === semester && m.status === 'verified');
    if (!semMarks.length) {
      this.snackBar.open('No verified marks for this semester', 'Close', { duration: 3000 });
      return;
    }

    const pdf = new jsPDF();
    const name = this.student?.name || 'Student';
    const roll = this.rollNumber || '';

    // Header
    pdf.setFillColor(15, 118, 110);
    pdf.rect(0, 0, 210, 40, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.text('NIT Warangal — Grade Sheet', 105, 18, { align: 'center' });
    pdf.setFontSize(12);
    pdf.text(`Semester ${semester}`, 105, 30, { align: 'center' });

    // Student Info
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(11);
    pdf.text(`Name: ${name}`, 20, 52);
    pdf.text(`Roll Number: ${roll}`, 20, 60);
    pdf.text(`Department: ${this.student?.department || 'CSE'}`, 120, 52);
    pdf.text(`Enrollment Year: ${this.student?.enrollmentYear || '—'}`, 120, 60);

    // Table Header
    let y = 75;
    pdf.setFillColor(240, 240, 240);
    pdf.rect(15, y - 5, 180, 10, 'F');
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    const cols = ['Course Code', 'Course Name', 'Credits', 'Marks', 'Grade', 'GP'];
    const colX = [20, 50, 105, 125, 150, 170];
    cols.forEach((c, i) => pdf.text(c, colX[i], y + 2));

    // Table Rows
    pdf.setFont('helvetica', 'normal');
    let totalCredits = 0, weighted = 0;
    for (const m of semMarks) {
      y += 10;
      pdf.text(m.courseCode, 20, y);
      pdf.text((m.courseName || '').substring(0, 30), 50, y);
      pdf.text(String(m.credits), 110, y);
      pdf.text(`${m.marksObtained}/${m.maxMarks}`, 125, y);
      pdf.text(m.grade, 155, y);
      pdf.text(String(m.gradePoint), 175, y);
      totalCredits += m.credits;
      weighted += m.gradePoint * m.credits;
    }

    // SGPA
    y += 15;
    pdf.setFont('helvetica', 'bold');
    const sgpa = (weighted / totalCredits).toFixed(2);
    pdf.text(`SGPA: ${sgpa}`, 20, y);
    pdf.text(`Total Credits: ${totalCredits}`, 120, y);

    // Footer
    y += 15;
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(8);
    pdf.text('This is a system-generated document. Verified on blockchain.', 105, y, { align: 'center' });

    pdf.save(`GradeSheet_Sem${semester}_${roll}.pdf`);
    this.snackBar.open(`Semester ${semester} grade sheet downloaded`, 'Close', { duration: 2000 });
  }

  downloadConsolidated() {
    const verified = this.marks.filter(m => m.status === 'verified');
    if (!verified.length) {
      this.snackBar.open('No verified marks available', 'Close', { duration: 3000 });
      return;
    }

    const pdf = new jsPDF();
    const name = this.student?.name || 'Student';
    const roll = this.rollNumber || '';

    // Header
    pdf.setFillColor(15, 118, 110);
    pdf.rect(0, 0, 210, 40, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.text('NIT Warangal — Consolidated Marksheet', 105, 18, { align: 'center' });
    pdf.setFontSize(11);
    pdf.text('All Semesters', 105, 30, { align: 'center' });

    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(11);
    pdf.text(`Name: ${name}`, 20, 52);
    pdf.text(`Roll Number: ${roll}`, 20, 60);
    pdf.text(`Department: ${this.student?.department || 'CSE'}`, 120, 52);

    let y = 75;
    for (const sem of this.semesters) {
      const semMarks = verified.filter(m => m.semester === sem);
      if (!semMarks.length) continue;

      if (y > 250) { pdf.addPage(); y = 20; }

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setFillColor(8, 145, 178);
      pdf.setTextColor(255, 255, 255);
      pdf.rect(15, y - 5, 180, 10, 'F');
      pdf.text(`Semester ${sem}`, 20, y + 2);
      pdf.setTextColor(0, 0, 0);

      y += 10;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Code', 20, y); pdf.text('Course', 45, y);
      pdf.text('Cr', 115, y); pdf.text('Marks', 130, y);
      pdf.text('Grade', 155, y); pdf.text('GP', 175, y);

      pdf.setFont('helvetica', 'normal');
      let sc = 0, sw = 0;
      for (const m of semMarks) {
        y += 7;
        pdf.text(m.courseCode, 20, y);
        pdf.text((m.courseName || '').substring(0, 35), 45, y);
        pdf.text(String(m.credits), 118, y);
        pdf.text(`${m.marksObtained}`, 133, y);
        pdf.text(m.grade, 158, y);
        pdf.text(String(m.gradePoint), 178, y);
        sc += m.credits; sw += m.gradePoint * m.credits;
      }
      y += 8;
      pdf.setFont('helvetica', 'bold');
      pdf.text(`SGPA: ${(sw / sc).toFixed(2)} | Credits: ${sc}`, 20, y);
      y += 12;
    }

    // CGPA
    if (this.cgpaData) {
      y += 5;
      pdf.setFontSize(14);
      pdf.text(`CGPA: ${this.cgpaData.cgpa} | Total Credits: ${this.cgpaData.totalCredits}`, 20, y);
    }

    pdf.save(`Consolidated_${roll}.pdf`);
    this.snackBar.open('Consolidated marksheet downloaded', 'Close', { duration: 2000 });
  }

  downloadCertificate(cert: any) {
    const pdf = new jsPDF();
    const w = 210;

    // Dark header
    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, w, 55, 'F');
    pdf.setFillColor(56, 189, 248);
    pdf.rect(0, 55, w, 3, 'F');
    pdf.setTextColor(255, 215, 0);
    pdf.setFontSize(26);
    pdf.setFont('helvetica', 'bold');
    pdf.text('NIT Warangal', w / 2, 22, { align: 'center' });
    pdf.setTextColor(226, 232, 240);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text('National Institute of Technology, Warangal', w / 2, 32, { align: 'center' });
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(56, 189, 248);
    pdf.text('ACADEMIC CERTIFICATE', w / 2, 46, { align: 'center' });

    // Certificate details
    const y0 = 70;
    pdf.setTextColor(30, 41, 59);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Certificate ID:', 20, y0);
    pdf.setFont('helvetica', 'normal');
    pdf.text(String(cert.certificateId || cert.id), 65, y0);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Type:', 20, y0 + 10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(String(cert.certificateType || 'Academic'), 65, y0 + 10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Status:', 20, y0 + 20);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(34, 197, 94);
    pdf.text(String(cert.status || 'APPROVED'), 65, y0 + 20);

    // Divider
    pdf.setDrawColor(56, 189, 248);
    pdf.setLineWidth(0.5);
    pdf.line(20, y0 + 28, 190, y0 + 28);

    // Student info
    const y1 = y0 + 40;
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('This is to certify that', w / 2, y1, { align: 'center' });
    pdf.setFontSize(20);
    pdf.setTextColor(56, 189, 248);
    pdf.text(String(this.student?.name || 'Student'), w / 2, y1 + 14, { align: 'center' });
    pdf.setFontSize(12);
    pdf.setTextColor(71, 85, 105);
    pdf.text('Roll Number: ' + this.rollNumber, w / 2, y1 + 26, { align: 'center' });
    pdf.text('Department: ' + (this.student?.department || 'CSE'), w / 2, y1 + 36, { align: 'center' });
    let nextY = y1 + 46;
    if (cert.purpose) {
      pdf.text('Purpose: ' + cert.purpose, w / 2, nextY, { align: 'center' });
      nextY += 10;
    }
    pdf.setFontSize(10);
    pdf.setTextColor(100, 116, 139);
    const dateStr = cert.requestDate || cert.issueDate || cert.createdAt || new Date().toISOString();
    pdf.text('Date: ' + new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }), w / 2, nextY + 5, { align: 'center' });
    if (cert.processedBy) {
      pdf.text('Approved by: ' + cert.processedBy, w / 2, nextY + 13, { align: 'center' });
    }

    // Blockchain verification box
    pdf.setFillColor(241, 245, 249);
    pdf.roundedRect(20, 220, 170, 25, 3, 3, 'F');
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(15, 23, 42);
    pdf.text('Blockchain Verification', 25, 228);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(71, 85, 105);
    pdf.text('This certificate is secured on Hyperledger Fabric blockchain.', 25, 236);

    // Footer
    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 280, w, 17, 'F');
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184);
    pdf.text('NIT Warangal Academic Records | Blockchain Verified | Tamper-Proof', w / 2, 290, { align: 'center' });

    // Open PDF in new tab for viewing and saving
    const pdfDataUri = pdf.output('datauristring');
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(
        '<html><head><title>Certificate - ' + this.rollNumber + '</title></head>' +
        '<body style="margin:0;padding:0;">' +
        '<embed width="100%" height="100%" src="' + pdfDataUri + '" type="application/pdf" />' +
        '</body></html>'
      );
      newWindow.document.close();
    } else {
      // Fallback: direct download via link
      const blob = pdf.output('blob');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Certificate_' + (cert.certificateType || 'Academic') + '_' + this.rollNumber + '.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
    this.snackBar.open('Certificate opened in new tab!', 'Close', { duration: 3000 });
  }

  requestCertificate() {
    const dialogRef = this.dialog.open(CertificateRequestDialogComponent, {
      width: '500px',
      data: { student: this.student, rollNumber: this.rollNumber }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadCertificates();
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

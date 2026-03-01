import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { BlockchainService } from '../../core/services/blockchain.service';
import { APP_CONFIG } from '../../core/config/app.config';

@Component({
  selector: 'app-faculty-dashboard',
  standalone: true,
  imports: [
    CommonModule, MatTabsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatTableModule, MatChipsModule, MatProgressSpinnerModule, MatSnackBarModule,
    MatTooltipModule, MatBadgeModule, MatDividerModule, HttpClientModule, FormsModule
  ],
  template: `
    <div class="dashboard-container">
      <!-- Header -->
      <header class="dash-header">
        <div class="header-content">
          <div class="header-left">
            <div class="avatar-ring">
              <div class="avatar"><mat-icon>school</mat-icon></div>
            </div>
            <div class="header-info">
              <h1>{{ getDashboardTitle() }}</h1>
              <p class="subtitle">
                <span class="dept-badge">{{ currentUser?.department || 'System' }}</span>
                <span class="role-badge">{{ formatRole(currentUser?.role) }}</span>
              </p>
            </div>
          </div>
          <div class="header-right">
            <div class="header-stat">
              <span class="stat-number">{{ myCourses.length }}</span>
              <span class="stat-text">Courses</span>
            </div>
            <div class="header-stat">
              <span class="stat-number">{{ pendingMarks.length }}</span>
              <span class="stat-text">Pending Verif.</span>
            </div>
            <button mat-raised-button color="warn" (click)="logout()">
              <mat-icon>logout</mat-icon> Logout
            </button>
          </div>
        </div>
      </header>

      <div *ngIf="loading" class="loading-state">
        <mat-spinner diameter="48"></mat-spinner>
        <p>Loading faculty data...</p>
      </div>

      <mat-tab-group *ngIf="!loading" animationDuration="300ms" class="main-tabs">
        <!-- TAB 1: MY COURSES -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">menu_book</mat-icon>
            <span>My Courses</span>
          </ng-template>
          <div class="tab-content">
            <div class="course-grid">
              <div class="course-card glass-card" *ngFor="let course of myCourses"
                (click)="selectCourse(course)" [class.selected]="selectedCourse?.code === course.code">
                <div class="course-header">
                  <span class="course-code-badge">{{ course.code }}</span>
                  <span class="course-type" [class.elective]="course.type === 'elective'">{{ course.type }}</span>
                </div>
                <h4>{{ course.name }}</h4>
                <div class="course-meta">
                  <span><mat-icon>event</mat-icon> Sem {{ course.semester }}</span>
                  <span><mat-icon>star</mat-icon> {{ course.credits }} Credits</span>
                </div>
              </div>
            </div>

            <!-- Selected Course Students -->
            <div *ngIf="selectedCourse" class="course-detail mt-3">
              <div class="section-title">
                <mat-icon>people</mat-icon>
                <h3>Students in {{ selectedCourse.code }}: {{ selectedCourse.name }}</h3>
              </div>
              <div class="marks-table-wrapper" *ngIf="courseStudentMarks.length > 0">
                <table class="modern-table">
                  <thead>
                    <tr>
                      <th>Roll Number</th>
                      <th>Student Name</th>
                      <th>Marks</th>
                      <th>Grade</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let m of courseStudentMarks">
                      <td><span class="course-code">{{ m.studentId }}</span></td>
                      <td>{{ m.studentName || m.studentId }}</td>
                      <td><strong>{{ m.marksObtained }}</strong>/{{ m.maxMarks }}</td>
                      <td><span class="grade-chip" [attr.data-grade]="m.grade">{{ m.grade }}</span></td>
                      <td><span class="status-badge" [class]="m.status">{{ m.status }}</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div *ngIf="courseStudentMarks.length === 0" class="empty-state">
                <mat-icon>people_outline</mat-icon>
                <p>No student marks recorded for this course yet</p>
              </div>
            </div>
          </div>
        </mat-tab>

        <!-- TAB 2: VERIFY MARKS -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">fact_check</mat-icon>
            <span>Verify Marks</span>
            <span class="pending-count" *ngIf="pendingMarks.length > 0">{{ pendingMarks.length }}</span>
          </ng-template>
          <div class="tab-content">
            <div *ngIf="pendingMarks.length > 0">
              <table class="modern-table">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Course</th>
                    <th>Semester</th>
                    <th>Marks</th>
                    <th>Grade</th>
                    <th>Uploaded By</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let m of pendingMarks">
                    <td class="course-code">{{ m.studentId }}</td>
                    <td>{{ m.courseName || m.courseCode }}</td>
                    <td>{{ m.semester }}</td>
                    <td><strong>{{ m.marksObtained }}</strong>/{{ m.maxMarks }}</td>
                    <td><span class="grade-chip" [attr.data-grade]="m.grade">{{ m.grade }}</span></td>
                    <td>{{ m.uploadedBy }}</td>
                    <td>
                      <button mat-raised-button color="primary" (click)="verifyMark(m)"
                        [disabled]="m.verifying" class="verify-btn">
                        <mat-icon>check</mat-icon> Verify
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div *ngIf="pendingMarks.length === 0" class="empty-state">
              <mat-icon>check_circle</mat-icon>
              <p>All marks are verified! No pending items.</p>
            </div>
          </div>
        </mat-tab>

        <!-- TAB 3: CERTIFICATE REQUESTS -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">approval</mat-icon>
            <span>Cert Requests</span>
            <span class="pending-count" *ngIf="pendingApprovals.length > 0">{{ pendingApprovals.length }}</span>
          </ng-template>
          <div class="tab-content">
            <div *ngIf="pendingApprovals.length > 0" class="approval-grid">
              <div class="approval-card glass-card" *ngFor="let r of pendingApprovals">
                <div class="approval-header">
                  <mat-icon>description</mat-icon>
                  <h4>{{ r.requestId }}</h4>
                </div>
                <p class="text-muted">Student: <strong>{{ r.studentId }}</strong></p>
                <p class="text-muted">Type: {{ r.certificateType }}</p>
                <p class="text-muted">Purpose: {{ r.purpose }}</p>
                <p class="text-muted">Requested: {{ r.requestDate | date:'medium' }}</p>
                <span class="status-badge pending">{{ r.status }}</span>
                <div class="approval-actions mt-2">
                  <button mat-raised-button color="primary" (click)="approveRecord(r)" [disabled]="r.processing">
                    <mat-icon>check</mat-icon> Approve
                  </button>
                  <button mat-stroked-button color="warn" (click)="rejectRecord(r)" [disabled]="r.processing">
                    <mat-icon>close</mat-icon> Reject
                  </button>
                </div>
              </div>
            </div>
            <div *ngIf="pendingApprovals.length === 0" class="empty-state">
              <mat-icon>thumb_up</mat-icon>
              <p>No pending certificate requests</p>
            </div>
          </div>
        </mat-tab>

        <!-- TAB 4: UPLOAD MARKS (exam_section / admin only) -->
        <mat-tab *ngIf="canUploadMarks">
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">upload_file</mat-icon>
            <span>Upload Marks</span>
          </ng-template>
          <div class="tab-content">
            <div class="section-title">
              <mat-icon>upload_file</mat-icon>
              <h3>Upload Student Marks</h3>
            </div>
            <p style="color:#94a3b8;font-size:13px;margin-bottom:20px;">Upload marks for a student. The marks will need to be verified by faculty before they become official.</p>

            <div class="upload-form glass-card" style="padding:24px;border-radius:14px;max-width:600px;">
              <div class="form-row">
                <label>Student ID (Roll Number)</label>
                <input type="text" [(ngModel)]="uploadForm.studentId" placeholder="e.g. 25CSM2R26" class="form-input" />
              </div>
              <div class="form-row">
                <label>Course Code</label>
                <select [(ngModel)]="uploadForm.courseCode" class="form-input">
                  <option value="" disabled>Select a course</option>
                  <option *ngFor="let c of allCourses" [value]="c.code">{{ c.code }} — {{ c.name }}</option>
                </select>
              </div>
              <div class="form-row-inline">
                <div class="form-row">
                  <label>Semester</label>
                  <input type="number" [(ngModel)]="uploadForm.semester" min="1" max="8" class="form-input" />
                </div>
                <div class="form-row">
                  <label>Marks Obtained</label>
                  <input type="number" [(ngModel)]="uploadForm.marksObtained" min="0" max="100" class="form-input" />
                </div>
                <div class="form-row">
                  <label>Max Marks</label>
                  <input type="number" [(ngModel)]="uploadForm.maxMarks" min="1" class="form-input" />
                </div>
              </div>
              <button mat-raised-button color="primary" (click)="submitMarks()" [disabled]="uploadingMarks"
                style="width:100%;border-radius:10px!important;margin-top:16px;">
                <mat-icon>cloud_upload</mat-icon>
                {{ uploadingMarks ? 'Uploading...' : 'Upload Marks' }}
              </button>
            </div>

            <!-- Recent uploads -->
            <div *ngIf="recentUploads.length > 0" style="margin-top:24px;">
              <div class="section-title">
                <mat-icon>history</mat-icon>
                <h3>Recent Uploads</h3>
              </div>
              <table class="modern-table">
                <thead>
                  <tr>
                    <th>Student</th><th>Course</th><th>Sem</th><th>Marks</th><th>Grade</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let u of recentUploads">
                    <td class="course-code">{{ u.studentId }}</td>
                    <td>{{ u.courseCode }}</td>
                    <td>{{ u.semester }}</td>
                    <td><strong>{{ u.marksObtained }}</strong>/{{ u.maxMarks }}</td>
                    <td><span class="grade-chip" [attr.data-grade]="u.grade">{{ u.grade }}</span></td>
                    <td><span class="status-badge" [class]="u.status">{{ u.status }}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .dashboard-container { max-width: 1200px; margin: 0 auto; padding: 24px; min-height: 100vh; }

    .dash-header {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
      border-radius: 20px; padding: 32px; margin-bottom: 24px; position: relative; overflow: hidden;
      &::before { content:''; position:absolute; inset:0; background:radial-gradient(circle at 90% 20%,rgba(255,255,255,0.1) 0%,transparent 50%); }
    }
    .header-content { display:flex; justify-content:space-between; align-items:center; position:relative; z-index:1; flex-wrap:wrap; gap:16px; }
    .header-left { display:flex; align-items:center; gap:20px; }
    .avatar-ring { width:64px; height:64px; border-radius:50%; background:linear-gradient(135deg,#a78bfa,#c084fc); padding:3px; }
    .avatar { width:100%; height:100%; border-radius:50%; background:rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center; mat-icon{color:#fff;font-size:28px;width:28px;height:28px;} }
    .header-info h1 { color:#fff; font-size:1.5rem; font-weight:700; margin:0; }
    .subtitle { display:flex; gap:8px; margin-top:8px; }
    .dept-badge { padding:4px 12px; border-radius:20px; font-size:12px; font-weight:600; background:rgba(255,255,255,0.2); color:#fff; }
    .role-badge { padding:4px 12px; border-radius:20px; font-size:12px; font-weight:600; background:rgba(167,139,250,0.3); color:#a78bfa; }
    .header-right { display:flex; align-items:center; gap:24px; }
    .header-stat { text-align:center; .stat-number{display:block;font-size:1.5rem;font-weight:700;color:#fff;} .stat-text{font-size:0.7rem;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:1px;} }

    .loading-state { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:300px; gap:16px; p{color:var(--text-secondary);} }
    .main-tabs ::ng-deep .mat-mdc-tab-header { background:rgba(15,23,42,0.7)!important; border-radius:16px 16px 0 0; border:1px solid rgba(148,163,184,0.1); border-bottom:none; }
    .tab-icon { margin-right:8px; font-size:20px; }
    .tab-content { padding:24px; animation:fadeIn 0.4s ease-out; }

    .course-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:16px; }
    .course-card {
      padding:20px; border-radius:14px; cursor:pointer;
      background:rgba(15,23,42,0.6); border:1px solid rgba(148,163,184,0.08);
      transition:all 0.3s ease;
      &:hover { border-color:rgba(167,139,250,0.3); transform:translateY(-2px); }
      &.selected { border-color:rgba(167,139,250,0.5); background:rgba(99,102,241,0.08); }
    }
    .course-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
    .course-code-badge { font-family:'JetBrains Mono',monospace; font-weight:700; color:var(--accent-violet); font-size:14px; }
    .course-type { font-size:11px; text-transform:uppercase; padding:2px 8px; border-radius:8px; background:rgba(45,212,191,0.15); color:var(--accent-teal); &.elective{background:rgba(251,191,36,0.15);color:var(--accent-amber);} }
    .course-card h4 { font-size:15px; font-weight:600; margin:0 0 8px; color:var(--text-primary); }
    .course-meta { display:flex; gap:16px; font-size:13px; color:var(--text-secondary); span{display:flex;align-items:center;gap:4px;} mat-icon{font-size:14px;width:14px;height:14px;} }

    .section-title { display:flex; align-items:center; gap:8px; margin-bottom:16px; h3{font-size:1rem;font-weight:600;} mat-icon{color:var(--accent-violet);} }

    .marks-table-wrapper { overflow-x:auto; border-radius:12px; }
    .modern-table {
      width:100%; border-collapse:collapse; background:rgba(15,23,42,0.5); border-radius:12px; overflow:hidden;
      thead tr { background:linear-gradient(135deg,rgba(99,102,241,0.4),rgba(139,92,246,0.4)); th{padding:14px 16px;color:#e2e8f0;font-weight:600;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;text-align:left;} }
      tbody tr { border-bottom:1px solid rgba(148,163,184,0.06); transition:background 0.2s; &:hover{background:rgba(167,139,250,0.04);} &:nth-child(even){background:rgba(17,24,39,0.3);} td{padding:12px 16px;color:var(--text-primary);font-size:14px;} }
    }
    .course-code { font-family:'JetBrains Mono',monospace; font-weight:600; color:var(--accent-cyan); font-size:13px; }
    .grade-chip { display:inline-block; padding:3px 10px; border-radius:12px; font-weight:700; font-size:13px; background:rgba(45,212,191,0.15); color:var(--accent-teal);
      &[data-grade="A+"]{color:#34d399;background:rgba(52,211,153,0.15);} &[data-grade="A"]{color:#2dd4bf;background:rgba(45,212,191,0.15);} &[data-grade="B+"]{color:#38bdf8;background:rgba(56,189,248,0.15);}
      &[data-grade="B"]{color:#60a5fa;background:rgba(96,165,250,0.15);} &[data-grade="F"]{color:#fb7185;background:rgba(251,113,133,0.15);}
    }
    .verify-btn { border-radius:10px!important; }
    .pending-count { background:var(--accent-rose); color:#fff; border-radius:10px; padding:2px 8px; font-size:11px; font-weight:700; margin-left:6px; }

    .empty-state { text-align:center; padding:48px; color:var(--text-muted); mat-icon{font-size:48px;width:48px;height:48px;opacity:0.4;margin-bottom:12px;} p{font-size:16px;} }

    .approval-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:16px; }
    .approval-card { padding:20px; border-radius:14px; background:rgba(15,23,42,0.6); border:1px solid rgba(148,163,184,0.08); }
    .approval-header { display:flex; align-items:center; gap:8px; margin-bottom:8px; mat-icon{color:var(--accent-amber);} h4{margin:0;font-weight:600;} }
    .approval-actions { display:flex; gap:8px; button{border-radius:10px!important;} }

    .upload-form {
      background: rgba(15,23,42,0.6); border: 1px solid rgba(148,163,184,0.1);
    }
    .form-row { margin-bottom:16px; label{display:block;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;margin-bottom:6px;font-weight:600;} }
    .form-input {
      width:100%; padding:10px 14px; border-radius:10px; border:1px solid rgba(148,163,184,0.15);
      background:rgba(15,23,42,0.8); color:#e2e8f0; font-size:14px; box-sizing:border-box;
      &:focus { outline:none; border-color:rgba(167,139,250,0.5); }
    }
    select.form-input { appearance:auto; }
    .form-row-inline { display:flex; gap:16px; }
    .form-row-inline .form-row { flex:1; }

    @media(max-width:768px) { .header-content{flex-direction:column;text-align:center;} .header-left{flex-direction:column;} .header-right{justify-content:center;} .form-row-inline{flex-direction:column;} }
  `]
})
export class FacultyDashboardComponent implements OnInit {
  currentUser: any;
  loading = true;
  myCourses: any[] = [];
  selectedCourse: any = null;
  courseStudentMarks: any[] = [];
  pendingMarks: any[] = [];
  pendingApprovals: any[] = [];
  allCourses: any[] = [];
  canUploadMarks = false;
  uploadingMarks = false;
  recentUploads: any[] = [];
  uploadForm = { studentId: '', courseCode: '', semester: 3, marksObtained: 0, maxMarks: 100 };
  private apiUrl = APP_CONFIG.api.baseUrl;

  constructor(
    private authService: AuthService,
    private blockchainService: BlockchainService,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    const stored = localStorage.getItem('user');
    this.currentUser = stored ? JSON.parse(stored) : this.authService.currentUser;
    this.canUploadMarks = this.currentUser?.role === 'exam_section' || this.currentUser?.role === 'admin';
  }

  ngOnInit() { this.loadAll(); }

  getDashboardTitle(): string {
    const role = this.currentUser?.role || 'faculty';
    if (role === 'hod') return 'HOD Dashboard';
    if (role === 'dac_member') return 'DAC Dashboard';
    if (role === 'exam_section') return 'Exam Section Dashboard';
    if (role === 'dean_academic') return 'Dean Academic Dashboard';
    return 'Faculty Dashboard';
  }

  formatRole(role?: string): string {
    if (!role) return 'Faculty';
    if (role === 'hod') return 'HOD';
    return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  async loadAll() {
    this.loading = true;
    try {
      await Promise.all([this.loadCourses(), this.loadPendingMarks(), this.loadApprovals(), this.loadAllCourses()]);
    } finally { this.loading = false; }
  }

  private loadCourses(): Promise<void> {
    return new Promise(resolve => {
      const username = this.currentUser?.username || this.currentUser?.userId;
      const token = localStorage.getItem('access_token');
      const headers = { 'Authorization': `Bearer ${token}` };
      this.http.get<any>(`${this.apiUrl}/courses?faculty=${username}`, { headers }).subscribe({
        next: (res) => { this.myCourses = res.success ? res.data : []; resolve(); },
        error: () => resolve()
      });
    });
  }

  private loadAllCourses(): Promise<void> {
    return new Promise(resolve => {
      const token = localStorage.getItem('access_token');
      const headers = { 'Authorization': `Bearer ${token}` };
      this.http.get<any>(`${this.apiUrl}/courses`, { headers }).subscribe({
        next: (res) => { this.allCourses = res.success ? res.data : []; resolve(); },
        error: () => resolve()
      });
    });
  }

  private loadPendingMarks(): Promise<void> {
    return new Promise(resolve => {
      const token = localStorage.getItem('access_token');
      const headers = { 'Authorization': `Bearer ${token}` };
      this.http.get<any>(`${this.apiUrl}/marks/pending`, { headers }).subscribe({
        next: (res) => { this.pendingMarks = res.success ? res.data : []; resolve(); },
        error: () => resolve()
      });
    });
  }

  private loadApprovals(): Promise<void> {
    return new Promise(resolve => {
      const token = localStorage.getItem('access_token');
      const headers = { 'Authorization': `Bearer ${token}` };
      this.http.get<any>(`${this.apiUrl}/certificates/requests`, { headers }).subscribe({
        next: (res) => {
          const all = res.success ? (Array.isArray(res.data) ? res.data : []) : [];
          this.pendingApprovals = all.filter((r: any) => r.status === 'PENDING');
          resolve();
        },
        error: () => { this.pendingApprovals = []; resolve(); }
      });
    });
  }

  selectCourse(course: any) {
    this.selectedCourse = course;
    const token = localStorage.getItem('access_token');
    const headers = { 'Authorization': `Bearer ${token}` };
    this.http.get<any>(`${this.apiUrl}/marks/course/${course.code}`, { headers }).subscribe({
      next: (res) => { this.courseStudentMarks = res.success ? res.data : []; },
      error: () => { this.courseStudentMarks = []; }
    });
  }

  verifyMark(mark: any) {
    mark.verifying = true;
    const token = localStorage.getItem('access_token');
    const headers = { 'Authorization': `Bearer ${token}` };
    this.http.patch<any>(`${this.apiUrl}/marks/${mark.id}/verify`, {}, { headers }).subscribe({
      next: (res) => {
        if (res.success) {
          this.snackBar.open(`Marks for ${mark.studentId} verified!`, 'Close', { duration: 2000 });
          this.pendingMarks = this.pendingMarks.filter(m => m.id !== mark.id);
        }
        mark.verifying = false;
      },
      error: () => { mark.verifying = false; this.snackBar.open('Verification failed', 'Close', { duration: 2000 }); }
    });
  }

  approveRecord(record: any) {
    record.processing = true;
    const token = localStorage.getItem('access_token');
    const headers = { 'Authorization': `Bearer ${token}` };
    this.http.put<any>(`${this.apiUrl}/certificates/requests/${record.requestId}`, { status: 'APPROVED' }, { headers }).subscribe({
      next: (res) => {
        record.processing = false;
        if (res.success) {
          this.snackBar.open('Certificate request approved!', 'Close', { duration: 2000 });
          this.pendingApprovals = this.pendingApprovals.filter(r => r !== record);
        } else {
          this.snackBar.open(res.message || 'Approval failed', 'Close', { duration: 3000 });
        }
      },
      error: (err: any) => {
        record.processing = false;
        this.snackBar.open(`Approval failed: ${err.error?.message || err.message}`, 'Close', { duration: 3000 });
      }
    });
  }

  rejectRecord(record: any) {
    record.processing = true;
    const token = localStorage.getItem('access_token');
    const headers = { 'Authorization': `Bearer ${token}` };
    this.http.put<any>(`${this.apiUrl}/certificates/requests/${record.requestId}`, { status: 'REJECTED' }, { headers }).subscribe({
      next: (res) => {
        record.processing = false;
        if (res.success) {
          this.snackBar.open('Certificate request rejected', 'Close', { duration: 2000 });
          this.pendingApprovals = this.pendingApprovals.filter(r => r !== record);
        }
      },
      error: (err: any) => {
        record.processing = false;
        this.snackBar.open(`Rejection failed: ${err.error?.message || err.message}`, 'Close', { duration: 3000 });
      }
    });
  }

  logout() { this.authService.logout(); this.router.navigate(['/login']); }

  submitMarks() {
    const f = this.uploadForm;
    if (!f.studentId || !f.courseCode || !f.marksObtained) {
      this.snackBar.open('Please fill all required fields', 'Close', { duration: 3000 });
      return;
    }
    this.uploadingMarks = true;
    const token = localStorage.getItem('access_token');
    const headers = { 'Authorization': `Bearer ${token}` };
    this.http.post<any>(`${this.apiUrl}/marks/upload`, f, { headers }).subscribe({
      next: (res) => {
        this.uploadingMarks = false;
        if (res.success) {
          this.snackBar.open(`Marks uploaded successfully!`, 'Close', { duration: 2000 });
          this.recentUploads = [...(res.data || []), ...this.recentUploads].slice(0, 10);
          this.uploadForm = { studentId: '', courseCode: '', semester: 3, marksObtained: 0, maxMarks: 100 };
        } else {
          this.snackBar.open(res.message || 'Upload failed', 'Close', { duration: 3000 });
        }
      },
      error: (err: any) => {
        this.uploadingMarks = false;
        this.snackBar.open(`Upload failed: ${err.error?.message || err.message}`, 'Close', { duration: 3000 });
      }
    });
  }
}

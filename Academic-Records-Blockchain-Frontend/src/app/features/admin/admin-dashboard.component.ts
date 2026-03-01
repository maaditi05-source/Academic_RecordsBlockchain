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
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { BlockchainService } from '../../core/services/blockchain.service';
import { APP_CONFIG } from '../../core/config/app.config';
import { AddStudentDialogComponent } from './add-student-dialog/add-student-dialog.component';
import { AddDepartmentDialogComponent } from './add-department-dialog/add-department-dialog.component';
import { AddCourseDialogComponent } from './add-course-dialog/add-course-dialog.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTabsModule, MatCardModule, MatButtonModule,
    MatIconModule, MatTableModule, MatChipsModule, MatProgressSpinnerModule,
    MatSnackBarModule, MatDialogModule, MatTooltipModule, MatBadgeModule,
    MatInputModule, MatFormFieldModule, MatSelectModule, HttpClientModule
  ],
  template: `
    <div class="dashboard-container">
      <header class="dash-header">
        <div class="header-content">
          <div class="header-left">
            <div class="avatar-ring">
              <div class="avatar"><mat-icon>admin_panel_settings</mat-icon></div>
            </div>
            <div class="header-info">
              <h1>Admin Dashboard</h1>
              <p class="subtitle">
                <span class="role-badge">System Administrator</span>
              </p>
            </div>
          </div>
          <div class="header-right">
            <div class="header-stat">
              <span class="stat-number">{{ allStudents.length }}</span>
              <span class="stat-text">Students</span>
            </div>
            <div class="header-stat">
              <span class="stat-number">{{ pendingCerts.length }}</span>
              <span class="stat-text">Pending Certs</span>
            </div>
            <button mat-raised-button color="warn" (click)="logout()">
              <mat-icon>logout</mat-icon> Logout
            </button>
          </div>
        </div>
      </header>

      <div *ngIf="loading" class="loading-state">
        <mat-spinner diameter="48"></mat-spinner>
        <p>Loading system data...</p>
      </div>

      <mat-tab-group *ngIf="!loading" animationDuration="300ms" class="main-tabs">
        <!-- TAB 1: OVERVIEW -->
        <mat-tab>
          <ng-template mat-tab-label><mat-icon class="tab-icon">dashboard</mat-icon><span>Overview</span></ng-template>
          <div class="tab-content">
            <div class="stats-grid">
              <div class="stat-card">
                <mat-icon class="stat-icon" style="color:var(--accent-teal)">people</mat-icon>
                <div class="stat-value">{{ allStudents.length }}</div>
                <div class="stat-label">Total Students</div>
              </div>
              <div class="stat-card">
                <mat-icon class="stat-icon" style="color:var(--accent-violet)">verified</mat-icon>
                <div class="stat-value">{{ allCerts.length }}</div>
                <div class="stat-label">Certificates</div>
              </div>
              <div class="stat-card">
                <mat-icon class="stat-icon" style="color:var(--accent-amber)">pending</mat-icon>
                <div class="stat-value">{{ pendingCerts.length }}</div>
                <div class="stat-label">Pending Approvals</div>
              </div>
              <div class="stat-card">
                <mat-icon class="stat-icon" style="color:var(--accent-cyan)">menu_book</mat-icon>
                <div class="stat-value">{{ allCourses.length }}</div>
                <div class="stat-label">Courses</div>
              </div>
            </div>
          </div>
        </mat-tab>

        <!-- TAB 2: STUDENTS -->
        <mat-tab>
          <ng-template mat-tab-label><mat-icon class="tab-icon">people</mat-icon><span>Students</span></ng-template>
          <div class="tab-content">
            <div class="toolbar-row">
              <button mat-raised-button color="primary" (click)="openAddStudentDialog()">
                <mat-icon>person_add</mat-icon> Add Student
              </button>
            </div>
            <div class="marks-table-wrapper" *ngIf="allStudents.length > 0">
              <table class="modern-table">
                <thead><tr><th>Roll Number</th><th>Name</th><th>Department</th><th>Enrollment</th><th>Status</th><th>View</th></tr></thead>
                <tbody>
                  <tr *ngFor="let s of allStudents">
                    <td><span class="course-code">{{ s.rollNumber || s.studentId }}</span></td>
                    <td>{{ s.name }}</td>
                    <td>{{ s.department }}</td>
                    <td>{{ s.enrollmentYear }}</td>
                    <td><span class="status-badge" [class]="(s.status || 'active').toLowerCase()">{{ s.status || 'ACTIVE' }}</span></td>
                    <td><button mat-stroked-button (click)="viewStudent(s)" class="view-btn"><mat-icon>visibility</mat-icon></button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </mat-tab>

        <!-- TAB 3: CERTIFICATE APPROVALS -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">approval</mat-icon><span>Cert Approvals</span>
            <span class="pending-count" *ngIf="pendingCerts.length > 0">{{ pendingCerts.length }}</span>
          </ng-template>
          <div class="tab-content">
            <p class="info-note"><mat-icon>info</mat-icon> Certificate requests can be approved here. Academic records follow: Faculty → HOD → Exam Section → Dean → DAC.</p>
            <div *ngIf="pendingCerts.length > 0" class="approval-grid">
              <div class="approval-card glass-card" *ngFor="let c of pendingCerts">
                <div class="approval-header">
                  <mat-icon>workspace_premium</mat-icon>
                  <h4>{{ c.requestId }}</h4>
                </div>
                <p style="color: #e2e8f0; margin: 4px 0;">Student: <strong style="color: #38bdf8;">{{ c.studentId }}</strong></p>
                <p style="color: #94a3b8; margin: 4px 0;">Type: {{ c.certificateType }}</p>
                <p style="color: #94a3b8; margin: 4px 0;">Purpose: {{ c.purpose }}</p>
                <p style="color: #64748b; margin: 4px 0; font-size: 12px;">Requested: {{ c.requestDate | date:'medium' }}</p>
                <span class="status-badge pending">{{ c.status }}</span>
                <div class="approval-actions mt-2">
                  <button mat-raised-button color="primary" (click)="approveCert(c)"><mat-icon>check</mat-icon> Final Approve</button>
                  <button mat-stroked-button color="warn" (click)="rejectCert(c)"><mat-icon>close</mat-icon> Reject</button>
                </div>
              </div>
            </div>
            <div *ngIf="pendingCerts.length === 0" class="empty-state">
              <mat-icon>verified</mat-icon><p>No pending certificate approvals</p>
            </div>
          </div>
        </mat-tab>

        <!-- TAB 4: DEPARTMENTS -->
        <mat-tab>
          <ng-template mat-tab-label><mat-icon class="tab-icon">domain</mat-icon><span>Departments</span></ng-template>
          <div class="tab-content">
            <div class="toolbar-row">
              <button mat-raised-button color="primary" (click)="openAddDepartmentDialog()">
                <mat-icon>add_business</mat-icon> Add Department
              </button>
            </div>
            <div class="marks-table-wrapper" *ngIf="allDepartments.length > 0">
              <table class="modern-table">
                <thead><tr><th>Dept ID</th><th>Name</th><th>HOD Name</th><th>HOD Email</th></tr></thead>
                <tbody>
                  <tr *ngFor="let d of allDepartments">
                    <td><span class="course-code">{{ d.departmentId }}</span></td>
                    <td>{{ d.name }}</td>
                    <td>{{ d.hodName || '—' }}</td>
                    <td>{{ d.hodEmail || '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </mat-tab>

        <!-- TAB 5: COURSES -->
        <mat-tab>
          <ng-template mat-tab-label><mat-icon class="tab-icon">menu_book</mat-icon><span>Courses</span></ng-template>
          <div class="tab-content">
            <div class="toolbar-row">
              <button mat-raised-button color="primary" (click)="openAddCourseDialog()">
                <mat-icon>library_add</mat-icon> Add Course
              </button>
            </div>
            <div class="marks-table-wrapper" *ngIf="allCourses.length > 0">
              <table class="modern-table">
                <thead><tr><th>Course Code</th><th>Course Name</th><th>Credits</th><th>Department</th><th>Type</th></tr></thead>
                <tbody>
                  <tr *ngFor="let c of allCourses">
                    <td><span class="course-code">{{ c.courseCode }}</span></td>
                    <td>{{ c.courseName }}</td>
                    <td>{{ c.credits }}</td>
                    <td>{{ c.department }}</td>
                    <td>{{ c.courseType || 'Core' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </mat-tab>

        <!-- TAB 6: USERS -->
        <mat-tab>
          <ng-template mat-tab-label><mat-icon class="tab-icon">manage_accounts</mat-icon><span>Users</span></ng-template>
          <div class="tab-content">
            <div class="marks-table-wrapper" *ngIf="allUsers.length > 0">
              <table class="modern-table">
                <thead><tr><th>Username</th><th>Name</th><th>Email</th><th>Role</th><th>Dept</th><th>Status</th></tr></thead>
                <tbody>
                  <tr *ngFor="let u of allUsers">
                    <td><span class="course-code">{{ u.username }}</span></td>
                    <td>{{ u.name }}</td>
                    <td>{{ u.email }}</td>
                    <td><span class="role-chip" [attr.data-role]="u.role">{{ u.role }}</span></td>
                    <td>{{ u.department || '—' }}</td>
                    <td><span class="status-badge" [class]="u.isActive ? 'active' : 'inactive'">{{ u.isActive ? 'Active' : 'Inactive' }}</span></td>
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
    .dashboard-container { max-width:1200px;margin:0 auto;padding:24px;min-height:100vh; }
    .dash-header {
      background:linear-gradient(135deg,#dc2626 0%,#ef4444 30%,#f97316 100%);
      border-radius:20px;padding:32px;margin-bottom:24px;position:relative;overflow:hidden;
      &::before { content:'';position:absolute;inset:0;background:radial-gradient(circle at 85% 25%,rgba(255,255,255,0.12) 0%,transparent 50%); }
    }
    .header-content { display:flex;justify-content:space-between;align-items:center;position:relative;z-index:1;flex-wrap:wrap;gap:16px; }
    .header-left { display:flex;align-items:center;gap:20px; }
    .avatar-ring { width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#fbbf24,#fb923c);padding:3px; }
    .avatar { width:100%;height:100%;border-radius:50%;background:rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center; mat-icon{color:#fff;font-size:28px;width:28px;height:28px;} }
    .header-info h1 { color:#fff;font-size:1.5rem;font-weight:700;margin:0; }
    .subtitle { display:flex;gap:8px;margin-top:8px; }
    .role-badge { padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;background:rgba(255,255,255,0.2);color:#fff; }
    .header-right { display:flex;align-items:center;gap:24px; }
    .header-stat { text-align:center; .stat-number{display:block;font-size:1.5rem;font-weight:700;color:#fff;} .stat-text{font-size:0.7rem;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:1px;} }
    .loading-state { display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:300px;gap:16px; p{color:var(--text-secondary);} }
    .main-tabs ::ng-deep .mat-mdc-tab-header { background:rgba(15,23,42,0.7)!important;border-radius:16px 16px 0 0;border:1px solid rgba(148,163,184,0.1);border-bottom:none; }
    .tab-icon { margin-right:8px;font-size:20px; }
    .tab-content { padding:24px;animation:fadeIn 0.4s ease-out; }
    .stats-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px; }
    .toolbar-row { margin-bottom:16px; }

    .marks-table-wrapper { overflow-x:auto;border-radius:12px; }
    .modern-table {
      width:100%;border-collapse:collapse;background:rgba(15,23,42,0.5);border-radius:12px;overflow:hidden;
      thead tr { background:linear-gradient(135deg,rgba(220,38,38,0.4),rgba(249,115,22,0.4)); th{padding:14px 16px;color:#e2e8f0;font-weight:600;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;text-align:left;} }
      tbody tr { border-bottom:1px solid rgba(148,163,184,0.06);transition:background 0.2s; &:hover{background:rgba(251,191,36,0.04);} &:nth-child(even){background:rgba(17,24,39,0.3);} td{padding:12px 16px;color:var(--text-primary);font-size:14px;} }
    }
    .course-code { font-family:'JetBrains Mono',monospace;font-weight:600;color:var(--accent-cyan);font-size:13px; }
    .view-btn { border-radius:10px!important;min-width:40px!important;padding:6px!important; }
    .pending-count { background:var(--accent-rose);color:#fff;border-radius:10px;padding:2px 8px;font-size:11px;font-weight:700;margin-left:6px; }
    .role-chip {
      display:inline-block;padding:3px 10px;border-radius:12px;font-weight:600;font-size:12px;text-transform:capitalize;
      background:rgba(148,163,184,0.1);color:var(--text-secondary);
      &[data-role="admin"]{background:rgba(251,113,133,0.15);color:var(--accent-rose);}
      &[data-role="faculty"]{background:rgba(167,139,250,0.15);color:var(--accent-violet);}
      &[data-role="student"]{background:rgba(45,212,191,0.15);color:var(--accent-teal);}
      &[data-role="hod"]{background:rgba(52,211,153,0.15);color:var(--accent-emerald);}
      &[data-role="dac_member"]{background:rgba(251,191,36,0.15);color:var(--accent-amber);}
      &[data-role="exam_section"]{background:rgba(56,189,248,0.15);color:var(--accent-cyan);}
    }
    .info-note { display:flex;align-items:center;gap:8px;padding:12px 16px;background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.2);border-radius:12px;color:var(--info);font-size:14px;margin-bottom:20px; mat-icon{font-size:18px;width:18px;height:18px;} }
    .empty-state { text-align:center;padding:48px;color:var(--text-muted); mat-icon{font-size:48px;width:48px;height:48px;opacity:0.4;margin-bottom:12px;} p{font-size:16px;} }
    .approval-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px; }
    .approval-card { padding:24px;border-radius:14px;background:rgba(15,23,42,0.6);border:1px solid rgba(148,163,184,0.08); }
    .approval-header { display:flex;align-items:center;gap:8px;margin-bottom:8px; mat-icon{color:var(--accent-amber);} h4{margin:0;font-weight:600;} }
    .approval-actions { display:flex;gap:8px; button{border-radius:10px!important;} }
    .approval-pipeline { display:flex;gap:4px;margin:12px 0;flex-wrap:wrap; }
    .pipeline-step {
      display:flex;align-items:center;gap:4px;padding:4px 10px;border-radius:16px;font-size:11px;background:rgba(148,163,184,0.08);color:var(--text-muted);
      &.done{background:rgba(52,211,153,0.15);color:var(--success);} &.pending{background:rgba(251,191,36,0.15);color:var(--warning);}
      mat-icon{font-size:14px;width:14px;height:14px;}
    }
    @media(max-width:768px) { .header-content{flex-direction:column;text-align:center;} .header-left{flex-direction:column;} .header-right{justify-content:center;} }
  `]
})
export class AdminDashboardComponent implements OnInit {
  currentUser: any;
  loading = true;
  allStudents: any[] = [];
  allCerts: any[] = [];
  pendingCerts: any[] = [];
  allDepartments: any[] = [];
  allCourses: any[] = [];
  allUsers: any[] = [];
  private apiUrl = APP_CONFIG.api.baseUrl;

  constructor(
    private authService: AuthService,
    private blockchainService: BlockchainService,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private router: Router,
    private dialog: MatDialog
  ) {
    const stored = localStorage.getItem('user');
    this.currentUser = stored ? JSON.parse(stored) : this.authService.currentUser;
  }

  private get authHeaders() {
    const token = localStorage.getItem('access_token');
    return { headers: { 'Authorization': `Bearer ${token}` } };
  }

  ngOnInit() { this.loadAll(); }

  async loadAll() {
    this.loading = true;
    await Promise.all([this.loadStudents(), this.loadDepartments(), this.loadCourses(), this.loadUsers(), this.loadPendingCerts()]);
    this.loading = false;
  }

  private loadStudents(): Promise<void> {
    return new Promise(resolve => {
      this.blockchainService.getAllStudents().subscribe({
        next: (res) => { this.allStudents = res.success && Array.isArray(res.data) ? res.data : []; resolve(); },
        error: () => resolve()
      });
    });
  }

  private loadDepartments(): Promise<void> {
    return new Promise(resolve => {
      this.http.get<any>(`${this.apiUrl}/department/all`, this.authHeaders).subscribe({
        next: (res) => { this.allDepartments = res.success ? res.data : []; resolve(); },
        error: () => resolve()
      });
    });
  }

  private loadCourses(): Promise<void> {
    return new Promise(resolve => {
      this.http.get<any>(`${this.apiUrl}/courses/all`, this.authHeaders).subscribe({
        next: (res) => { this.allCourses = res.success ? res.data : []; resolve(); },
        error: () => resolve()
      });
    });
  }

  private loadUsers(): Promise<void> {
    return new Promise(resolve => {
      this.http.get<any>(`${this.apiUrl}/auth/users`, this.authHeaders).subscribe({
        next: (res) => { this.allUsers = res.success ? (res.data || []) : []; resolve(); },
        error: () => resolve()
      });
    });
  }

  private loadPendingCerts(): Promise<void> {
    return new Promise(resolve => {
      this.http.get<any>(`${this.apiUrl}/certificates/requests`, this.authHeaders).subscribe({
        next: (res) => {
          const all = res.success ? (Array.isArray(res.data) ? res.data : []) : [];
          this.pendingCerts = all.filter((r: any) => r.status === 'PENDING');
          resolve();
        },
        error: () => resolve()
      });
    });
  }

  openAddStudentDialog() {
    const dialogRef = this.dialog.open(AddStudentDialogComponent, { width: '500px' });
    dialogRef.afterClosed().subscribe(result => { if (result) this.loadAll(); });
  }

  viewStudent(student: any) {
    const roll = student.rollNumber || student.studentId;
    this.router.navigate(['/student', roll]);
  }

  approveCert(cert: any) {
    cert.processing = true;
    this.http.put<any>(`${this.apiUrl}/certificates/requests/${cert.requestId}`, { status: 'APPROVED' }, this.authHeaders).subscribe({
      next: (res) => {
        cert.processing = false;
        if (res.success) {
          this.snackBar.open('Certificate approved!', 'Close', { duration: 2000 });
          this.pendingCerts = this.pendingCerts.filter(c => c !== cert);
        } else {
          this.snackBar.open(res.message || 'Approval failed', 'Close', { duration: 3000 });
        }
      },
      error: (err: any) => {
        cert.processing = false;
        this.snackBar.open(`Approval failed: ${err.error?.message || err.message}`, 'Close', { duration: 3000 });
      }
    });
  }

  rejectCert(cert: any) {
    cert.processing = true;
    this.http.put<any>(`${this.apiUrl}/certificates/requests/${cert.requestId}`, { status: 'REJECTED' }, this.authHeaders).subscribe({
      next: (res) => {
        cert.processing = false;
        if (res.success) {
          this.snackBar.open('Certificate rejected', 'Close', { duration: 2000 });
          this.pendingCerts = this.pendingCerts.filter(c => c !== cert);
        }
      },
      error: (err: any) => {
        cert.processing = false;
        this.snackBar.open(`Rejection failed: ${err.error?.message || err.message}`, 'Close', { duration: 3000 });
      }
    });
  }

  openAddDepartmentDialog() {
    const dialogRef = this.dialog.open(AddDepartmentDialogComponent, { width: '500px' });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadAll();
    });
  }

  openAddCourseDialog() {
    const dialogRef = this.dialog.open(AddCourseDialogComponent, { width: '500px' });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadAll();
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}

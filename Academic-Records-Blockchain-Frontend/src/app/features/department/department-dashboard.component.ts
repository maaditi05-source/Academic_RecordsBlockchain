import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { BlockchainService } from '../../core/services/blockchain.service';
import { APP_CONFIG } from '../../core/config/app.config';

@Component({
  selector: 'app-department-dashboard',
  standalone: true,
  imports: [
    CommonModule, MatTabsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatTableModule, MatChipsModule, MatProgressSpinnerModule, MatSnackBarModule,
    MatTooltipModule, MatBadgeModule, MatDialogModule, HttpClientModule
  ],
  template: `
    <div class="dashboard-container">
      <header class="dash-header">
        <div class="header-content">
          <div class="header-left">
            <div class="avatar-ring">
              <div class="avatar"><mat-icon>domain</mat-icon></div>
            </div>
            <div class="header-info">
              <h1>{{ currentUser?.name || 'HOD Dashboard' }}</h1>
              <p class="subtitle">
                <span class="dept-badge">{{ dept }}</span>
                <span class="role-badge">Head of Department</span>
              </p>
            </div>
          </div>
          <div class="header-right">
            <div class="header-stat">
              <span class="stat-number">{{ faculty.length }}</span>
              <span class="stat-text">Faculty</span>
            </div>
            <div class="header-stat">
              <span class="stat-number">{{ students.length }}</span>
              <span class="stat-text">Students</span>
            </div>
            <button mat-raised-button color="warn" (click)="logout()">
              <mat-icon>logout</mat-icon> Logout
            </button>
          </div>
        </div>
      </header>

      <div *ngIf="loading" class="loading-state">
        <mat-spinner diameter="48"></mat-spinner>
        <p>Loading department data...</p>
      </div>

      <mat-tab-group *ngIf="!loading" animationDuration="300ms" class="main-tabs">
        <!-- TAB 1: OVERVIEW -->
        <mat-tab>
          <ng-template mat-tab-label><mat-icon class="tab-icon">dashboard</mat-icon><span>Overview</span></ng-template>
          <div class="tab-content">
            <div class="stats-grid">
              <div class="stat-card">
                <mat-icon class="stat-icon" style="color:var(--accent-teal)">people</mat-icon>
                <div class="stat-value">{{ students.length }}</div>
                <div class="stat-label">Total Students</div>
              </div>
              <div class="stat-card">
                <mat-icon class="stat-icon" style="color:var(--accent-violet)">school</mat-icon>
                <div class="stat-value">{{ faculty.length }}</div>
                <div class="stat-label">Faculty Members</div>
              </div>
              <div class="stat-card">
                <mat-icon class="stat-icon" style="color:var(--accent-cyan)">menu_book</mat-icon>
                <div class="stat-value">{{ courses.length }}</div>
                <div class="stat-label">Courses</div>
              </div>
              <div class="stat-card">
                <mat-icon class="stat-icon" style="color:var(--accent-amber)">pending_actions</mat-icon>
                <div class="stat-value">{{ pendingApprovals.length }}</div>
                <div class="stat-label">Pending Approvals</div>
              </div>
            </div>
          </div>
        </mat-tab>

        <!-- TAB 2: FACULTY -->
        <mat-tab>
          <ng-template mat-tab-label><mat-icon class="tab-icon">school</mat-icon><span>Faculty</span></ng-template>
          <div class="tab-content">
            <div class="faculty-grid">
              <div class="faculty-card glass-card" *ngFor="let f of faculty">
                <div class="fc-avatar">{{ getInitials(f.name) }}</div>
                <h4>{{ f.name }}</h4>
                <p class="text-muted">{{ f.designation || 'Faculty' }}</p>
                <p class="text-muted"><mat-icon style="font-size:14px;width:14px;height:14px">email</mat-icon> {{ f.email }}</p>
                <div class="fc-courses" *ngIf="f.courses?.length">
                  <span class="course-tag" *ngFor="let c of f.courses">{{ c }}</span>
                </div>
              </div>
            </div>
            <div *ngIf="faculty.length === 0" class="empty-state">
              <mat-icon>person_off</mat-icon><p>No faculty registered in {{ dept }}</p>
            </div>
          </div>
        </mat-tab>

        <!-- TAB 3: STUDENTS -->
        <mat-tab>
          <ng-template mat-tab-label><mat-icon class="tab-icon">people</mat-icon><span>Students</span></ng-template>
          <div class="tab-content">
            <div class="marks-table-wrapper" *ngIf="students.length > 0">
              <table class="modern-table">
                <thead><tr><th>Roll Number</th><th>Name</th><th>Email</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  <tr *ngFor="let s of students">
                    <td><span class="course-code">{{ s.rollNumber || s.studentId || s.username }}</span></td>
                    <td>{{ s.name }}</td>
                    <td>{{ s.email }}</td>
                    <td><span class="status-badge" [class]="(s.status || 'active').toLowerCase()">{{ s.status || 'ACTIVE' }}</span></td>
                    <td><button mat-stroked-button (click)="viewStudent(s)" class="view-btn"><mat-icon>visibility</mat-icon></button></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div *ngIf="students.length === 0" class="empty-state">
              <mat-icon>people_outline</mat-icon><p>No students in {{ dept }}</p>
            </div>
          </div>
        </mat-tab>

        <!-- TAB 4: APPROVALS -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">approval</mat-icon><span>Approvals</span>
            <span class="pending-count" *ngIf="pendingApprovals.length > 0">{{ pendingApprovals.length }}</span>
          </ng-template>
          <div class="tab-content">
            <div *ngIf="pendingApprovals.length > 0" class="approval-grid">
              <div class="approval-card glass-card" *ngFor="let r of pendingApprovals">
                <div class="approval-header"><mat-icon>description</mat-icon><h4>{{ r.recordId || r.id }}</h4></div>
                <p class="text-muted">Student: {{ r.studentId }}</p>
                <span class="status-badge pending">{{ r.status }}</span>
                <div class="approval-actions mt-2">
                  <button mat-raised-button color="primary" (click)="approveRecord(r)"><mat-icon>check</mat-icon> Approve</button>
                  <button mat-stroked-button color="warn" (click)="rejectRecord(r)"><mat-icon>close</mat-icon> Reject</button>
                </div>
              </div>
            </div>
            <div *ngIf="pendingApprovals.length === 0" class="empty-state">
              <mat-icon>thumb_up</mat-icon><p>No pending approvals</p>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .dashboard-container { max-width:1200px; margin:0 auto; padding:24px; min-height:100vh; }
    .dash-header {
      background:linear-gradient(135deg,#059669 0%,#0d9488 50%,#0891b2 100%);
      border-radius:20px; padding:32px; margin-bottom:24px; position:relative; overflow:hidden;
      &::before { content:''; position:absolute; inset:0; background:radial-gradient(circle at 85% 25%,rgba(255,255,255,0.1) 0%,transparent 50%); }
    }
    .header-content { display:flex; justify-content:space-between; align-items:center; position:relative; z-index:1; flex-wrap:wrap; gap:16px; }
    .header-left { display:flex; align-items:center; gap:20px; }
    .avatar-ring { width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#34d399,#2dd4bf);padding:3px; }
    .avatar { width:100%;height:100%;border-radius:50%;background:rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center; mat-icon{color:#fff;font-size:28px;width:28px;height:28px;} }
    .header-info h1 { color:#fff;font-size:1.5rem;font-weight:700;margin:0; }
    .subtitle { display:flex;gap:8px;margin-top:8px; }
    .dept-badge { padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;background:rgba(255,255,255,0.2);color:#fff; }
    .role-badge { padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;background:rgba(52,211,153,0.3);color:#34d399; }
    .header-right { display:flex;align-items:center;gap:24px; }
    .header-stat { text-align:center; .stat-number{display:block;font-size:1.5rem;font-weight:700;color:#fff;} .stat-text{font-size:0.7rem;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:1px;} }
    .loading-state { display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:300px;gap:16px; p{color:var(--text-secondary);} }
    .main-tabs ::ng-deep .mat-mdc-tab-header { background:rgba(15,23,42,0.7)!important; border-radius:16px 16px 0 0; border:1px solid rgba(148,163,184,0.1); border-bottom:none; }
    .tab-icon { margin-right:8px;font-size:20px; }
    .tab-content { padding:24px;animation:fadeIn 0.4s ease-out; }

    .stats-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px; }

    .faculty-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px; }
    .faculty-card { padding:24px;border-radius:14px;background:rgba(15,23,42,0.6);border:1px solid rgba(148,163,184,0.08);text-align:center;transition:all 0.3s ease; &:hover{border-color:rgba(52,211,153,0.3);transform:translateY(-2px);} }
    .fc-avatar { width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#059669,#0d9488);display:flex;align-items:center;justify-content:center;margin:0 auto 12px;font-weight:700;font-size:1.2rem;color:#fff; }
    .faculty-card h4 { margin:0 0 4px;font-weight:600; }
    .fc-courses { margin-top:12px;display:flex;gap:6px;justify-content:center;flex-wrap:wrap; }
    .course-tag { font-size:11px;padding:3px 8px;border-radius:8px;background:rgba(45,212,191,0.15);color:var(--accent-teal);font-weight:600; }

    .marks-table-wrapper { overflow-x:auto;border-radius:12px; }
    .modern-table {
      width:100%;border-collapse:collapse;background:rgba(15,23,42,0.5);border-radius:12px;overflow:hidden;
      thead tr { background:linear-gradient(135deg,rgba(5,150,105,0.4),rgba(8,145,178,0.4)); th{padding:14px 16px;color:#e2e8f0;font-weight:600;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;text-align:left;} }
      tbody tr { border-bottom:1px solid rgba(148,163,184,0.06);transition:background 0.2s; &:hover{background:rgba(52,211,153,0.04);} &:nth-child(even){background:rgba(17,24,39,0.3);} td{padding:12px 16px;color:var(--text-primary);font-size:14px;} }
    }
    .course-code { font-family:'JetBrains Mono',monospace;font-weight:600;color:var(--accent-cyan);font-size:13px; }
    .view-btn { border-radius:10px!important;min-width:40px!important;padding:6px!important; }
    .pending-count { background:var(--accent-rose);color:#fff;border-radius:10px;padding:2px 8px;font-size:11px;font-weight:700;margin-left:6px; }
    .empty-state { text-align:center;padding:48px;color:var(--text-muted); mat-icon{font-size:48px;width:48px;height:48px;opacity:0.4;margin-bottom:12px;} p{font-size:16px;} }
    .approval-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px; }
    .approval-card { padding:20px;border-radius:14px;background:rgba(15,23,42,0.6);border:1px solid rgba(148,163,184,0.08); }
    .approval-header { display:flex;align-items:center;gap:8px;margin-bottom:8px; mat-icon{color:var(--accent-amber);} h4{margin:0;font-weight:600;} }
    .approval-actions { display:flex;gap:8px; button{border-radius:10px!important;} }
    @media(max-width:768px) { .header-content{flex-direction:column;text-align:center;} .header-left{flex-direction:column;} }
  `]
})
export class DepartmentDashboardComponent implements OnInit {
  currentUser: any;
  loading = true;
  dept = 'CSE';
  students: any[] = [];
  faculty: any[] = [];
  courses: any[] = [];
  pendingApprovals: any[] = [];
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
    this.dept = this.currentUser?.department || 'CSE';
  }

  ngOnInit() { this.loadAll(); }

  async loadAll() {
    this.loading = true;
    await Promise.all([this.loadStudents(), this.loadFaculty(), this.loadCourses(), this.loadApprovals()]);
    this.loading = false;
  }

  private loadStudents(): Promise<void> {
    return new Promise(resolve => {
      this.blockchainService.getStudentsByDepartment(this.dept).subscribe({
        next: (res) => { this.students = res.success && Array.isArray(res.data) ? res.data : []; resolve(); },
        error: () => resolve()
      });
    });
  }

  private loadFaculty(): Promise<void> {
    return new Promise(resolve => {
      // Load faculty from users.json via a simple endpoint (or from local data)
      this.http.get<any>(`${this.apiUrl}/auth/users?role=faculty&department=${this.dept}`).subscribe({
        next: (res) => { this.faculty = res.success ? (res.data || []) : []; resolve(); },
        error: () => {
          // Fallback: try loading from the stored users list
          this.faculty = [];
          resolve();
        }
      });
    });
  }

  private loadCourses(): Promise<void> {
    return new Promise(resolve => {
      this.http.get<any>(`${this.apiUrl}/courses?department=${this.dept}`).subscribe({
        next: (res) => { this.courses = res.success ? res.data : []; resolve(); },
        error: () => resolve()
      });
    });
  }

  private loadApprovals(): Promise<void> {
    return new Promise(resolve => {
      this.blockchainService.getPendingRecords().subscribe({
        next: (res) => { this.pendingApprovals = res.success && Array.isArray(res.data) ? res.data : []; resolve(); },
        error: () => resolve()
      });
    });
  }

  getInitials(name: string): string {
    return (name || '').split(' ').map(w => w[0] || '').join('').substring(0, 2).toUpperCase();
  }

  viewStudent(student: any) {
    const roll = student.rollNumber || student.studentId || student.username;
    this.router.navigate(['/student', roll]);
  }

  approveRecord(record: any) {
    this.blockchainService.approveAcademicRecord(record.recordId || record.id).subscribe({
      next: () => { this.snackBar.open('Approved', 'Close', { duration: 2000 }); this.pendingApprovals = this.pendingApprovals.filter(r => r !== record); },
      error: (err: any) => this.snackBar.open(`Failed: ${err.message}`, 'Close', { duration: 3000 })
    });
  }

  rejectRecord(record: any) {
    this.snackBar.open('Rejected', 'Close', { duration: 2000 });
    this.pendingApprovals = this.pendingApprovals.filter(r => r !== record);
  }

  logout() { this.authService.logout(); this.router.navigate(['/login']); }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { BlockchainService } from '../../core/services/blockchain.service';
import { HttpClient } from '@angular/common/http';
import { APP_CONFIG } from '../../core/config/app.config';

type Tab = 'overview' | 'courses' | 'marks' | 'students' | 'certificates' | 'bonafide';

@Component({
  selector: 'app-hod-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="min-h-screen" style="background:#f8fafc;">
  <div *ngIf="toast.show" [class.bg-green-600]="toast.type==='success'" [class.bg-red-600]="toast.type==='error'"
       class="fixed top-4 right-4 z-50 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg">{{ toast.msg }}</div>

  <header style="background:#fff;border-bottom:1px solid #e5e7eb;padding:16px 24px;display:flex;justify-content:space-between;align-items:center;">
    <div>
      <h1 style="font-size:16px;font-weight:600;color:#111827;">HOD Dashboard — {{ department }}</h1>
      <p style="font-size:12px;color:#6b7280;margin-top:2px;">{{ user?.name || user?.username }}</p>
    </div>
    <button (click)="logout()" style="font-size:12px;color:#ef4444;cursor:pointer;background:none;border:none;">Logout</button>
  </header>

  <nav style="background:#fff;border-bottom:1px solid #e5e7eb;padding:0 24px;display:flex;gap:4px;overflow-x:auto;">
    <button *ngFor="let t of tabs"
      (click)="setTab(t.id)" [class.border-b-2]="activeTab===t.id" [class.border-blue-700]="activeTab===t.id"
      [style.color]="activeTab===t.id ? '#1d4ed8' : '#374151'"
      style="padding:12px;font-size:14px;font-weight:500;background:none;border:none;cursor:pointer;white-space:nowrap;">{{ t.label }}</button>
  </nav>

  <main style="max-width:72rem;margin:0 auto;padding:24px;">

    <!-- Overview -->
    <div *ngIf="activeTab==='overview'" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;">
      <div style="background:#fff;border-radius:12px;border:1px solid #e5e7eb;padding:16px;">
        <p style="font-size:12px;color:#6b7280;margin-bottom:4px;">Students</p><p style="font-size:24px;font-weight:700;color:#111827;">{{ stats.totalStudents }}</p>
      </div>
      <div style="background:#fff;border-radius:12px;border:1px solid #e5e7eb;padding:16px;">
        <p style="font-size:12px;color:#6b7280;margin-bottom:4px;">Pending Marks</p><p style="font-size:24px;font-weight:700;color:#d97706;">{{ stats.pendingMarks }}</p>
      </div>
      <div style="background:#fff;border-radius:12px;border:1px solid #e5e7eb;padding:16px;">
        <p style="font-size:12px;color:#6b7280;margin-bottom:4px;">Pending Certs</p><p style="font-size:24px;font-weight:700;color:#2563eb;">{{ stats.pendingCerts }}</p>
      </div>
      <div style="background:#fff;border-radius:12px;border:1px solid #e5e7eb;padding:16px;">
        <p style="font-size:12px;color:#6b7280;margin-bottom:4px;">Courses</p><p style="font-size:24px;font-weight:700;color:#111827;">{{ courses.length }}</p>
      </div>
    </div>

    <!-- Courses -->
    <div *ngIf="activeTab==='courses'">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h2 style="font-size:14px;font-weight:500;color:#374151;">Department Courses</h2>
        <button (click)="showAddCourse=!showAddCourse" style="font-size:12px;background:#1d4ed8;color:#fff;padding:6px 12px;border-radius:8px;border:none;cursor:pointer;">
          {{ showAddCourse ? 'Cancel' : '+ Add Course' }}
        </button>
      </div>

      <div *ngIf="showAddCourse" style="background:#fff;border-radius:12px;border:1px solid #e5e7eb;padding:16px;margin-bottom:16px;display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <input [(ngModel)]="newCourse.code" placeholder="Code (e.g. CS301)" style="border:1px solid #d1d5db;border-radius:8px;padding:8px 12px;font-size:14px;color:#111827;" />
        <input [(ngModel)]="newCourse.name" placeholder="Course Name" style="border:1px solid #d1d5db;border-radius:8px;padding:8px 12px;font-size:14px;color:#111827;" />
        <select [(ngModel)]="newCourse.semester" style="border:1px solid #d1d5db;border-radius:8px;padding:8px 12px;font-size:14px;color:#111827;">
          <option *ngFor="let s of semesters" [value]="s">Sem {{ s }}</option>
        </select>
        <input [(ngModel)]="newCourse.credits" type="number" placeholder="Credits" style="border:1px solid #d1d5db;border-radius:8px;padding:8px 12px;font-size:14px;color:#111827;" />
        <button (click)="addCourse()" style="grid-column:span 2;background:#16a34a;color:#fff;font-size:14px;padding:8px;border-radius:8px;font-weight:500;border:none;cursor:pointer;">Create Course</button>
      </div>

      <div style="background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
        <div *ngIf="loading" style="padding:24px;text-align:center;font-size:14px;color:#6b7280;">Loading…</div>
        <table *ngIf="!loading && courses.length" style="width:100%;font-size:14px;border-collapse:collapse;">
          <thead style="background:#f9fafb;">
            <tr><th style="padding:12px 16px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600;">Code</th><th style="padding:12px 16px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600;">Name</th>
                <th style="padding:12px 16px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600;">Sem</th><th style="padding:12px 16px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600;">Faculty</th>
                <th style="padding:12px 16px;"></th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of courses" style="border-top:1px solid #f3f4f6;">
              <td style="padding:12px 16px;font-weight:600;color:#111827;">{{ c.code }}</td>
              <td style="padding:12px 16px;color:#374151;">{{ c.name }}</td>
              <td style="padding:12px 16px;color:#374151;">{{ c.semester }}</td>
              <td style="padding:12px 16px;color:#374151;">{{ c.facultyName || c.faculty || 'Unassigned' }}</td>
              <td style="padding:12px 16px;text-align:right;">
                <button (click)="openAssign(c)" style="font-size:12px;color:#2563eb;cursor:pointer;background:none;border:none;margin-right:8px;">Assign</button>
                <button (click)="deleteCourse(c.id||c.code)" style="font-size:12px;color:#ef4444;cursor:pointer;background:none;border:none;">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p *ngIf="!loading && !courses.length" style="padding:24px;font-size:14px;color:#6b7280;text-align:center;">No courses.</p>
      </div>

      <!-- Assign Modal -->
      <div *ngIf="assigningCourse" class="fixed inset-0 bg-black/30 z-40 flex items-center justify-center" (click)="assigningCourse=null">
        <div class="bg-white rounded-xl p-5 w-80 space-y-3" (click)="$event.stopPropagation()">
          <h3 class="text-sm font-medium">Assign Faculty to {{ assigningCourse.code }}</h3>
          <input [(ngModel)]="assignFacultyUsername" placeholder="Faculty username" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          <button (click)="saveAssign()" class="w-full bg-blue-700 text-white text-sm py-2 rounded-lg">Save</button>
        </div>
      </div>
    </div>

    <!-- Marks Approval -->
    <div *ngIf="activeTab==='marks'">
      <h2 style="font-size:14px;font-weight:500;color:#374151;margin-bottom:16px;">Marks Pending HOD Approval</h2>
      <div style="background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
        <div *ngIf="loading" style="padding:24px;text-align:center;font-size:14px;color:#6b7280;">Loading…</div>
        <table *ngIf="!loading && pendingMarksList.length" style="width:100%;font-size:14px;border-collapse:collapse;">
          <thead style="background:#f9fafb;">
            <tr><th style="padding:12px 16px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600;">Student</th><th style="padding:12px 16px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600;">Course</th>
                <th style="padding:12px 16px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600;">Sem</th><th style="padding:12px 16px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600;">Total</th>
                <th style="padding:12px 16px;"></th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let m of pendingMarksList" style="border-top:1px solid #f3f4f6;">
              <td style="padding:12px 16px;font-weight:600;color:#111827;">{{ m.studentId }}</td>
              <td style="padding:12px 16px;color:#374151;font-weight:500;">{{ m.courseCode }}</td>
              <td style="padding:12px 16px;color:#374151;">{{ m.semester }}</td>
              <td style="padding:12px 16px;font-weight:600;color:#111827;">{{ m.marksData?.total || m.marksObtained }}</td>
              <td style="padding:12px 16px;text-align:right;">
                <button (click)="approveMarks(m.id)" style="font-size:12px;color:#16a34a;font-weight:500;cursor:pointer;background:none;border:none;margin-right:8px;">Approve</button>
                <button (click)="rejectMarks(m.id)" style="font-size:12px;color:#ef4444;cursor:pointer;background:none;border:none;">Reject</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p *ngIf="!loading && !pendingMarksList.length" style="padding:24px;font-size:14px;color:#6b7280;text-align:center;">No pending marks.</p>
      </div>
    </div>

    <!-- Students -->
    <div *ngIf="activeTab==='students'">
      <h2 style="font-size:14px;font-weight:500;color:#374151;margin-bottom:16px;">Department Students</h2>
      <div style="background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
        <div *ngIf="loading" style="padding:24px;text-align:center;font-size:14px;color:#6b7280;">Loading…</div>
        <table *ngIf="!loading && studentList.length" style="width:100%;font-size:14px;border-collapse:collapse;">
          <thead style="background:#f9fafb;">
            <tr><th style="padding:12px 16px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600;">Roll No</th><th style="padding:12px 16px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600;">Name</th>
                <th style="padding:12px 16px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600;">Status</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let s of studentList" style="border-top:1px solid #f3f4f6;">
              <td style="padding:12px 16px;font-weight:600;color:#111827;">{{ s.rollNumber || s.studentId || s.id }}</td>
              <td style="padding:12px 16px;color:#374151;">{{ s.name }}</td>
              <td style="padding:12px 16px;">
                <span [style.background]="s.status==='active' ? '#dcfce7' : '#f3f4f6'"
                      [style.color]="s.status==='active' ? '#15803d' : '#374151'"
                      style="font-size:12px;padding:2px 8px;border-radius:12px;font-weight:500;">{{ s.status }}</span>
              </td>
            </tr>
          </tbody>
        </table>
        <p *ngIf="!loading && !studentList.length" style="padding:24px;font-size:14px;color:#6b7280;text-align:center;">No students found.</p>
      </div>
    </div>

    <!-- Certificate Approvals -->
    <div *ngIf="activeTab==='certificates'">
      <h2 style="font-size:14px;font-weight:500;color:#374151;margin-bottom:16px;">Document & Certificate Requests</h2>
      <div style="background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
        <div *ngIf="loading" style="padding:24px;text-align:center;font-size:14px;color:#6b7280;">Loading…</div>
        <table *ngIf="!loading && pendingCertRequests.length" style="width:100%;font-size:14px;border-collapse:collapse;">
          <thead style="background:#f9fafb;">
            <tr><th style="padding:12px 16px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600;">Student</th><th style="padding:12px 16px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600;">Type</th>
                <th style="padding:12px 16px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600;">Reason</th><th style="padding:12px 16px;"></th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of pendingCertRequests" style="border-top:1px solid #f3f4f6;">
              <td style="padding:12px 16px;font-weight:600;color:#111827;">{{ r.studentId }}</td>
              <td style="padding:12px 16px;color:#374151;font-size:13px;">{{ r.type }}</td>
              <td style="padding:12px 16px;color:#374151;font-size:13px;">{{ r.reason || '—' }}</td>
              <td style="padding:12px 16px;text-align:right;">
                <button (click)="approveCertRequest(r.id)" style="font-size:12px;color:#16a34a;font-weight:500;cursor:pointer;background:none;border:none;margin-right:8px;">Approve</button>
                <button (click)="rejectCertRequest(r.id)" style="font-size:12px;color:#ef4444;cursor:pointer;background:none;border:none;">Reject</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p *ngIf="!loading && !pendingCertRequests.length" style="padding:24px;font-size:14px;color:#6b7280;text-align:center;">No pending requests.</p>
      </div>
    </div>

    <!-- Bonafide Issuance -->
    <div *ngIf="activeTab==='bonafide'" style="max-width:28rem;">
      <h2 style="font-size:14px;font-weight:500;color:#374151;margin-bottom:16px;">Issue Bonafide Certificate</h2>
      <div style="background:#fff;border-radius:12px;border:1px solid #e5e7eb;padding:20px;">
        <div style="margin-bottom:12px;">
          <label style="display:block;font-size:12px;color:#6b7280;margin-bottom:4px;">Student ID</label>
          <input [(ngModel)]="bonafideForm.studentId" placeholder="Roll number" style="width:100%;border:1px solid #d1d5db;border-radius:8px;padding:8px 12px;font-size:14px;color:#111827;box-sizing:border-box;" />
        </div>
        <div style="margin-bottom:12px;">
          <label style="display:block;font-size:12px;color:#6b7280;margin-bottom:4px;">Purpose</label>
          <textarea [(ngModel)]="bonafideForm.purpose" rows="2" style="width:100%;border:1px solid #d1d5db;border-radius:8px;padding:8px 12px;font-size:14px;color:#111827;resize:none;box-sizing:border-box;" placeholder="Purpose of certificate"></textarea>
        </div>
        <button (click)="issueBonafide()" style="width:100%;background:#1d4ed8;color:#fff;font-size:14px;padding:10px;border-radius:8px;font-weight:500;border:none;cursor:pointer;">
          Issue Bonafide Certificate
        </button>
      </div>
    </div>

  </main>
</div>`,
})
export class HodDashboardComponent implements OnInit {
  user: any;
  department = '';
  activeTab: Tab = 'overview';

  tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'courses', label: 'Courses' },
    { id: 'marks', label: 'Marks Approval' },
    { id: 'students', label: 'Students' },
    { id: 'certificates', label: 'Document Approvals' },
    { id: 'bonafide', label: 'Issue Bonafide' },
  ];

  stats = { totalStudents: 0, totalFaculty: 0, pendingMarks: 0, pendingCerts: 0 };
  courses: any[] = [];
  showAddCourse = false;
  newCourse = { code: '', name: '', semester: 1, credits: 3 };
  assigningCourse: any = null;
  assignFacultyUsername = '';
  pendingMarksList: any[] = [];
  studentList: any[] = [];
  pendingCertRequests: any[] = [];
  bonafideForm = { studentId: '', purpose: '' };
  loading = false;
  toast = { show: false, msg: '', type: 'success' as 'success' | 'error' };
  private apiUrl = APP_CONFIG.api.baseUrl;

  constructor(
    private authService: AuthService,
    private blockchain: BlockchainService,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.user = this.authService.currentUser;
    this.department = this.user?.department ?? '';
    this.loadOverview();
    this.loadCourses();
  }

  setTab(tab: string): void {
    this.activeTab = tab as Tab;
    if (tab === 'overview') this.loadOverview();
    if (tab === 'courses') this.loadCourses();
    if (tab === 'marks') this.loadPendingMarks();
    if (tab === 'students') this.loadStudents();
    if (tab === 'certificates') this.loadCertificates();
  }

  loadOverview(): void {
    this.blockchain.getStudentsByDepartment(this.department).subscribe({
      next: (r: any) => { const d = r?.data || r; this.stats.totalStudents = Array.isArray(d) ? d.length : 0; },
      error: () => { },
    });
    this.blockchain.getMarks({ status: 'submitted', department: this.department }).subscribe({
      next: (m: any) => { const d = Array.isArray(m) ? m : (m?.data || []); this.stats.pendingMarks = d.length; },
      error: () => { },
    });
    this.blockchain.getDocumentRequests({ status: 'pending' }).subscribe({
      next: (d: any) => { const arr = Array.isArray(d) ? d : (d?.data || []); this.stats.pendingCerts = arr.length; },
      error: () => { },
    });
  }

  loadCourses(): void {
    this.loading = true;
    this.blockchain.getCoursesByDepartment(this.department).subscribe({
      next: (c: any) => { this.courses = c?.data || c || []; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  addCourse(): void {
    if (!this.newCourse.code || !this.newCourse.name) return;
    this.blockchain.createCourse({ ...this.newCourse, department: this.department }).subscribe({
      next: (c: any) => {
        this.courses.push(c?.data || c);
        this.showAddCourse = false;
        this.newCourse = { code: '', name: '', semester: 1, credits: 3 };
        this.showToast('Course created');
      },
      error: (e: any) => this.showToast(e?.error?.message ?? 'Failed', 'error'),
    });
  }

  deleteCourse(id: string): void {
    if (!confirm('Delete this course?')) return;
    this.blockchain.deleteCourse(id).subscribe({
      next: () => { this.courses = this.courses.filter(c => (c.id || c.code) !== id); this.showToast('Deleted'); },
      error: (e: any) => this.showToast(e?.error?.message ?? 'Failed', 'error'),
    });
  }

  openAssign(course: any): void {
    this.assigningCourse = course;
    this.assignFacultyUsername = course.faculty ?? '';
  }

  saveAssign(): void {
    if (!this.assigningCourse || !this.assignFacultyUsername) return;
    this.blockchain.assignFacultyToCourse(this.assigningCourse.id || this.assigningCourse.code, this.assignFacultyUsername).subscribe({
      next: (c: any) => {
        const data = c?.data || c;
        const idx = this.courses.findIndex(x => (x.id || x.code) === (data.id || data.code));
        if (idx !== -1) this.courses[idx] = data;
        this.assigningCourse = null;
        this.showToast('Faculty assigned');
      },
      error: (e: any) => this.showToast(e?.error?.message ?? 'Failed', 'error'),
    });
  }

  loadPendingMarks(): void {
    this.loading = true;
    this.blockchain.getMarks({ status: 'submitted', department: this.department }).subscribe({
      next: (m: any) => { this.pendingMarksList = Array.isArray(m) ? m : (m?.data || []); this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  approveMarks(id: string): void {
    this.blockchain.hodApproveMarks(id).subscribe({
      next: () => { this.pendingMarksList = this.pendingMarksList.filter(m => m.id !== id); this.showToast('Approved → Exam Section'); },
      error: (e: any) => this.showToast(e?.error?.message ?? 'Failed', 'error'),
    });
  }

  rejectMarks(id: string): void {
    const reason = prompt('Rejection reason:'); if (!reason) return;
    this.blockchain.rejectMarks(id, reason).subscribe({
      next: () => { this.pendingMarksList = this.pendingMarksList.filter(m => m.id !== id); this.showToast('Rejected'); },
      error: (e: any) => this.showToast(e?.error?.message ?? 'Failed', 'error'),
    });
  }

  loadStudents(): void {
    this.loading = true;
    this.blockchain.getStudentsByDepartment(this.department).subscribe({
      next: (s: any) => { this.studentList = s?.data || s || []; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  loadCertificates(): void {
    this.loading = true;
    const headers = { headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` } };

    Promise.all([
      new Promise<any[]>((resolve) => {
        this.blockchain.getDocumentRequests({ status: 'pending' }).subscribe({
          next: (d: any) => resolve(Array.isArray(d) ? d : (d?.data || [])),
          error: () => resolve([])
        });
      }),
      new Promise<any[]>((resolve) => {
        this.http.get<any>(`${this.apiUrl}/certificates/requests`, headers).subscribe({
          next: (d: any) => resolve((d?.data || d || []).filter((r: any) => r.status === 'PENDING' || r.status === 'pending')),
          error: () => resolve([])
        });
      })
    ]).then(([docs, certs]) => {
      // Merge, normalize ID and type properties
      const all = [
        ...docs,
        ...certs.map(c => ({ ...c, id: c.requestId || c.id, type: c.certificateType || c.type }))
      ];
      this.pendingCertRequests = all;
      this.loading = false;
    });
  }

  approveCertRequest(id: string): void {
    const headers = { headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` } };
    const isLegacy = id.startsWith('REQ-');
    const req$ = isLegacy ?
      this.http.put<any>(`${this.apiUrl}/certificates/requests/${id}`, { status: 'APPROVED' }, headers) :
      this.blockchain.approveDocumentRequest(id);

    req$.subscribe({
      next: () => { this.pendingCertRequests = this.pendingCertRequests.filter(r => r.id !== id); this.showToast('Approved'); },
      error: (e: any) => this.showToast(e?.error?.message ?? 'Failed', 'error'),
    });
  }

  rejectCertRequest(id: string): void {
    const reason = prompt('Reason:'); if (!reason) return;
    const headers = { headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` } };
    const isLegacy = id.startsWith('REQ-');
    const req$ = isLegacy ?
      this.http.put<any>(`${this.apiUrl}/certificates/requests/${id}`, { status: 'REJECTED' }, headers) :
      this.blockchain.rejectDocumentRequest(id, reason);

    req$.subscribe({
      next: () => { this.pendingCertRequests = this.pendingCertRequests.filter(r => r.id !== id); this.showToast('Rejected'); },
      error: (e: any) => this.showToast(e?.error?.message ?? 'Failed', 'error'),
    });
  }

  issueBonafide(): void {
    if (!this.bonafideForm.studentId || !this.bonafideForm.purpose) {
      this.showToast('Student ID and purpose required', 'error'); return;
    }
    this.blockchain.requestDocument({
      type: 'BONAFIDE_CERTIFICATE', studentId: this.bonafideForm.studentId, reason: this.bonafideForm.purpose,
    }).subscribe({
      next: () => { this.bonafideForm = { studentId: '', purpose: '' }; this.showToast('Bonafide issued → Dean'); },
      error: (e: any) => this.showToast(e?.error?.message ?? 'Failed', 'error'),
    });
  }

  logout(): void { this.authService.logout(); }
  showToast(msg: string, type: 'success' | 'error' = 'success'): void {
    this.toast = { show: true, msg, type };
    setTimeout(() => (this.toast.show = false), 3500);
  }
  get semesters(): number[] { return [1, 2, 3, 4, 5, 6, 7, 8]; }
}

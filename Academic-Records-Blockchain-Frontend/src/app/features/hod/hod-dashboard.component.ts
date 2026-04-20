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
<div class="min-h-screen bg-gray-50">
  <div *ngIf="toast.show" [class.bg-green-600]="toast.type==='success'" [class.bg-red-600]="toast.type==='error'"
       class="fixed top-4 right-4 z-50 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg">{{ toast.msg }}</div>

  <header class="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
    <div>
      <h1 class="text-base font-semibold text-gray-900">HOD Dashboard — {{ department }}</h1>
      <p class="text-xs text-gray-400 mt-0.5">{{ user?.name || user?.username }}</p>
    </div>
    <button (click)="logout()" class="text-xs text-red-500 hover:underline">Logout</button>
  </header>

  <nav class="bg-white border-b border-gray-100 px-6 flex gap-1 overflow-x-auto">
    <button *ngFor="let t of tabs"
      (click)="setTab(t.id)" [class.border-b-2]="activeTab===t.id" [class.border-blue-700]="activeTab===t.id"
      [class.text-blue-700]="activeTab===t.id" [class.text-gray-500]="activeTab!==t.id"
      class="px-3 py-3 text-sm font-medium transition-colors whitespace-nowrap">{{ t.label }}</button>
  </nav>

  <main class="max-w-6xl mx-auto p-6">

    <!-- Overview -->
    <div *ngIf="activeTab==='overview'" class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl border border-gray-100 p-4">
        <p class="text-xs text-gray-400">Students</p><p class="text-2xl font-bold text-gray-900">{{ stats.totalStudents }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 p-4">
        <p class="text-xs text-gray-400">Pending Marks</p><p class="text-2xl font-bold text-amber-600">{{ stats.pendingMarks }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 p-4">
        <p class="text-xs text-gray-400">Pending Certs</p><p class="text-2xl font-bold text-blue-600">{{ stats.pendingCerts }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 p-4">
        <p class="text-xs text-gray-400">Courses</p><p class="text-2xl font-bold text-gray-900">{{ courses.length }}</p>
      </div>
    </div>

    <!-- Courses -->
    <div *ngIf="activeTab==='courses'">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-sm font-medium text-gray-700">Department Courses</h2>
        <button (click)="showAddCourse=!showAddCourse" class="text-xs bg-blue-700 text-white px-3 py-1.5 rounded-lg">
          {{ showAddCourse ? 'Cancel' : '+ Add Course' }}
        </button>
      </div>

      <div *ngIf="showAddCourse" class="bg-white rounded-xl border border-gray-100 p-4 mb-4 grid grid-cols-2 gap-3">
        <input [(ngModel)]="newCourse.code" placeholder="Code (e.g. CS301)" class="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        <input [(ngModel)]="newCourse.name" placeholder="Course Name" class="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        <select [(ngModel)]="newCourse.semester" class="border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option *ngFor="let s of semesters" [value]="s">Sem {{ s }}</option>
        </select>
        <input [(ngModel)]="newCourse.credits" type="number" placeholder="Credits" class="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        <button (click)="addCourse()" class="col-span-2 bg-green-600 text-white text-sm py-2 rounded-lg font-medium">Create Course</button>
      </div>

      <div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div *ngIf="loading" class="p-6 text-center text-sm text-gray-400">Loading…</div>
        <table *ngIf="!loading && courses.length" class="w-full text-sm">
          <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr><th class="px-4 py-3 text-left">Code</th><th class="px-4 py-3 text-left">Name</th>
                <th class="px-4 py-3 text-left">Sem</th><th class="px-4 py-3 text-left">Faculty</th>
                <th class="px-4 py-3"></th></tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr *ngFor="let c of courses" class="hover:bg-gray-50">
              <td class="px-4 py-3 font-medium">{{ c.code }}</td>
              <td class="px-4 py-3 text-gray-600">{{ c.name }}</td>
              <td class="px-4 py-3 text-gray-500">{{ c.semester }}</td>
              <td class="px-4 py-3 text-gray-500">{{ c.facultyName || c.faculty || 'Unassigned' }}</td>
              <td class="px-4 py-3 text-right space-x-2">
                <button (click)="openAssign(c)" class="text-xs text-blue-600 hover:underline">Assign</button>
                <button (click)="deleteCourse(c.id||c.code)" class="text-xs text-red-500 hover:underline">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p *ngIf="!loading && !courses.length" class="p-6 text-sm text-gray-400 text-center">No courses.</p>
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
      <h2 class="text-sm font-medium text-gray-700 mb-4">Marks Pending HOD Approval</h2>
      <div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div *ngIf="loading" class="p-6 text-center text-sm text-gray-400">Loading…</div>
        <table *ngIf="!loading && pendingMarksList.length" class="w-full text-sm">
          <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr><th class="px-4 py-3 text-left">Student</th><th class="px-4 py-3 text-left">Course</th>
                <th class="px-4 py-3 text-left">Sem</th><th class="px-4 py-3 text-left">Total</th>
                <th class="px-4 py-3"></th></tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr *ngFor="let m of pendingMarksList" class="hover:bg-gray-50">
              <td class="px-4 py-3 font-medium">{{ m.studentId }}</td>
              <td class="px-4 py-3 text-gray-600">{{ m.courseCode }}</td>
              <td class="px-4 py-3 text-gray-500">{{ m.semester }}</td>
              <td class="px-4 py-3 font-medium">{{ m.marksData?.total || m.marksObtained }}</td>
              <td class="px-4 py-3 text-right space-x-2">
                <button (click)="approveMarks(m.id)" class="text-xs text-green-600 font-medium hover:underline">Approve</button>
                <button (click)="rejectMarks(m.id)" class="text-xs text-red-500 hover:underline">Reject</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p *ngIf="!loading && !pendingMarksList.length" class="p-6 text-sm text-gray-400 text-center">No pending marks.</p>
      </div>
    </div>

    <!-- Students -->
    <div *ngIf="activeTab==='students'">
      <h2 class="text-sm font-medium text-gray-700 mb-4">Department Students</h2>
      <div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div *ngIf="loading" class="p-6 text-center text-sm text-gray-400">Loading…</div>
        <table *ngIf="!loading && studentList.length" class="w-full text-sm">
          <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr><th class="px-4 py-3 text-left">Roll No</th><th class="px-4 py-3 text-left">Name</th>
                <th class="px-4 py-3 text-left">Status</th></tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr *ngFor="let s of studentList" class="hover:bg-gray-50">
              <td class="px-4 py-3 font-medium">{{ s.rollNumber || s.studentId || s.id }}</td>
              <td class="px-4 py-3 text-gray-600">{{ s.name }}</td>
              <td class="px-4 py-3">
                <span class="text-xs px-2 py-0.5 rounded-full font-medium"
                      [class.bg-green-100]="s.status==='active'" [class.text-green-700]="s.status==='active'"
                      [class.bg-gray-100]="s.status!=='active'" [class.text-gray-600]="s.status!=='active'">{{ s.status }}</span>
              </td>
            </tr>
          </tbody>
        </table>
        <p *ngIf="!loading && !studentList.length" class="p-6 text-sm text-gray-400 text-center">No students found.</p>
      </div>
    </div>

    <!-- Certificate Approvals -->
    <div *ngIf="activeTab==='certificates'">
      <h2 class="text-sm font-medium text-gray-700 mb-4">Document & Certificate Requests</h2>
      <div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div *ngIf="loading" class="p-6 text-center text-sm text-gray-400">Loading…</div>
        <table *ngIf="!loading && pendingCertRequests.length" class="w-full text-sm">
          <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr><th class="px-4 py-3 text-left">Student</th><th class="px-4 py-3 text-left">Type</th>
                <th class="px-4 py-3 text-left">Reason</th><th class="px-4 py-3"></th></tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr *ngFor="let r of pendingCertRequests" class="hover:bg-gray-50">
              <td class="px-4 py-3 font-medium">{{ r.studentId }}</td>
              <td class="px-4 py-3 text-gray-600 text-xs">{{ r.type }}</td>
              <td class="px-4 py-3 text-gray-500 text-xs">{{ r.reason || '—' }}</td>
              <td class="px-4 py-3 text-right space-x-2">
                <button (click)="approveCertRequest(r.id)" class="text-xs text-green-600 font-medium hover:underline">Approve</button>
                <button (click)="rejectCertRequest(r.id)" class="text-xs text-red-500 hover:underline">Reject</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p *ngIf="!loading && !pendingCertRequests.length" class="p-6 text-sm text-gray-400 text-center">No pending requests.</p>
      </div>
    </div>

    <!-- Bonafide Issuance -->
    <div *ngIf="activeTab==='bonafide'" class="max-w-md">
      <h2 class="text-sm font-medium text-gray-700 mb-4">Issue Bonafide Certificate</h2>
      <div class="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
        <div>
          <label class="block text-xs text-gray-500 mb-1">Student ID</label>
          <input [(ngModel)]="bonafideForm.studentId" placeholder="Roll number" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Purpose</label>
          <textarea [(ngModel)]="bonafideForm.purpose" rows="2" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" placeholder="Purpose of certificate"></textarea>
        </div>
        <button (click)="issueBonafide()" class="w-full bg-blue-700 text-white text-sm py-2.5 rounded-lg font-medium">
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

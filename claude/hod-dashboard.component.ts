// ============================================================
// hod-dashboard.component.ts  — NEW FILE
// Req #4  — certificate approval section for HOD
// Req #5  — HOD does NOT see "My Courses" (that's faculty only)
// Req #6  — HOD adds courses, assigns faculty
// Req #11 — review marks, validate grades, first approval checkpoint
//           view all dept students and faculty, issue bonafide cert
// ============================================================
import { Component, OnInit } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { FormsModule }       from '@angular/forms';
import { AuthService }       from '../../core/services/auth.service';
import { BlockchainService } from '../../core/services/blockchain.service';

type Tab = 'overview' | 'courses' | 'marks' | 'students' | 'certificates' | 'bonafide';

@Component({
  selector: 'app-hod-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hod-dashboard.component.html',
})
export class HodDashboardComponent implements OnInit {
  user: any;
  department = '';
  activeTab: Tab = 'overview';

  // ── Stats ─────────────────────────────────────────────────────
  stats = { totalStudents: 0, totalFaculty: 0, pendingMarks: 0, pendingCerts: 0 };

  // ── Courses ───────────────────────────────────────────────────
  courses: any[] = [];
  facultyList: any[] = [];
  showAddCourse = false;
  newCourse = { code: '', name: '', semester: 1, credits: 3 };
  assigningCourse: any = null;
  assignFacultyUsername = '';

  // ── Marks ─────────────────────────────────────────────────────
  pendingMarksList: any[] = [];
  selectedSemesterFilter: number | null = null;

  // ── Students ──────────────────────────────────────────────────
  studentList: any[] = [];

  // ── Certificates (Req #4 — bonafide issued by HOD) ────────────
  pendingCertRequests: any[] = [];

  // ── Bonafide cert form ────────────────────────────────────────
  bonafideForm = { studentId: '', purpose: '', validityDays: 30 };

  // ── UI state ──────────────────────────────────────────────────
  loading = false;
  toast = { show: false, msg: '', type: 'success' as 'success' | 'error' };

  constructor(
    private authService: AuthService,
    private blockchain: BlockchainService,
  ) {}

  ngOnInit(): void {
    this.user       = this.authService.getCurrentUser();
    this.department = this.user?.department ?? '';
    this.loadOverview();
  }

  setTab(tab: Tab): void {
    this.activeTab = tab;
    if (tab === 'courses')      this.loadCourses();
    if (tab === 'marks')        this.loadPendingMarks();
    if (tab === 'students')     this.loadStudents();
    if (tab === 'certificates') this.loadCertificates();
  }

  // ── Overview ─────────────────────────────────────────────────
  loadOverview(): void {
    this.blockchain.getStudentsByDepartment(this.department).subscribe({
      next: (s: any[]) => (this.stats.totalStudents = s.length),
      error: () => {},
    });
    this.blockchain.getMarks({ status: 'submitted' }).subscribe({
      next: (m: any[]) => (this.stats.pendingMarks = m.length),
      error: () => {},
    });
    this.blockchain.getDocumentRequests({ status: 'pending' }).subscribe({
      next: (d: any[]) => (this.stats.pendingCerts = d.length),
      error: () => {},
    });
  }

  // ── Courses (Req #6) ─────────────────────────────────────────
  loadCourses(): void {
    this.loading = true;
    this.blockchain.getCoursesByDepartment(this.department).subscribe({
      next: (c: any[]) => { this.courses = c; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  addCourse(): void {
    if (!this.newCourse.code || !this.newCourse.name) return;
    this.blockchain.createCourse({
      ...this.newCourse,
      department: this.department,
    }).subscribe({
      next: (c: any) => {
        this.courses.push(c);
        this.showAddCourse = false;
        this.newCourse = { code: '', name: '', semester: 1, credits: 3 };
        this.showToast('Course created successfully');
      },
      error: (e: any) => this.showToast(e?.error?.error ?? 'Failed to create course', 'error'),
    });
  }

  deleteCourse(id: string): void {
    if (!confirm('Delete this course?')) return;
    this.blockchain.deleteCourse(id).subscribe({
      next: () => {
        this.courses = this.courses.filter(c => c.id !== id);
        this.showToast('Course deleted');
      },
      error: (e: any) => this.showToast(e?.error?.error ?? 'Delete failed', 'error'),
    });
  }

  openAssign(course: any): void {
    this.assigningCourse   = course;
    this.assignFacultyUsername = course.assignedFaculty ?? '';
  }

  saveAssign(): void {
    if (!this.assigningCourse || !this.assignFacultyUsername) return;
    this.blockchain.assignFacultyToCourse(this.assigningCourse.id, this.assignFacultyUsername).subscribe({
      next: (c: any) => {
        const idx = this.courses.findIndex(x => x.id === c.id);
        if (idx !== -1) this.courses[idx] = c;
        this.assigningCourse = null;
        this.showToast(`Faculty assigned to ${c.code}`);
      },
      error: (e: any) => this.showToast(e?.error?.error ?? 'Assign failed', 'error'),
    });
  }

  // ── Marks approval (Req #11) ─────────────────────────────────
  loadPendingMarks(): void {
    this.loading = true;
    const filters: any = { status: 'submitted' };
    if (this.selectedSemesterFilter) filters.semester = this.selectedSemesterFilter;
    this.blockchain.getMarks(filters).subscribe({
      next: (m: any[]) => {
        this.pendingMarksList = m.filter(x => x.department === this.department);
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  approveMarks(id: string): void {
    this.blockchain.hodApproveMarks(id).subscribe({
      next: () => {
        this.pendingMarksList = this.pendingMarksList.filter(m => m.id !== id);
        this.showToast('Marks approved and forwarded to Exam Section');
      },
      error: (e: any) => this.showToast(e?.error?.error ?? 'Approval failed', 'error'),
    });
  }

  rejectMarks(id: string): void {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    this.blockchain.rejectMarks(id, reason).subscribe({
      next: () => {
        this.pendingMarksList = this.pendingMarksList.filter(m => m.id !== id);
        this.showToast('Marks rejected, sent back to faculty');
      },
      error: (e: any) => this.showToast(e?.error?.error ?? 'Rejection failed', 'error'),
    });
  }

  // ── Students ─────────────────────────────────────────────────
  loadStudents(): void {
    this.loading = true;
    this.blockchain.getStudentsByDepartment(this.department).subscribe({
      next: (s: any[]) => { this.studentList = s; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  // ── Certificate requests (Req #4) ────────────────────────────
  loadCertificates(): void {
    this.loading = true;
    // HOD approves BONAFIDE_CERTIFICATE requests
    this.blockchain.getDocumentRequests({ type: 'BONAFIDE_CERTIFICATE', status: 'pending' }).subscribe({
      next: (d: any[]) => { this.pendingCertRequests = d; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  approveCertRequest(id: string): void {
    this.blockchain.approveDocumentRequest(id).subscribe({
      next: () => {
        this.pendingCertRequests = this.pendingCertRequests.filter(r => r.id !== id);
        this.showToast('Certificate request approved');
      },
      error: (e: any) => this.showToast(e?.error?.error ?? 'Approval failed', 'error'),
    });
  }

  rejectCertRequest(id: string): void {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    this.blockchain.rejectDocumentRequest(id, reason).subscribe({
      next: () => {
        this.pendingCertRequests = this.pendingCertRequests.filter(r => r.id !== id);
        this.showToast('Certificate request rejected');
      },
      error: (e: any) => this.showToast(e?.error?.error ?? 'Rejection failed', 'error'),
    });
  }

  // ── Bonafide certificate issuance (Req #11) ──────────────────
  issueBonafide(): void {
    if (!this.bonafideForm.studentId || !this.bonafideForm.purpose) {
      this.showToast('Student ID and purpose are required', 'error');
      return;
    }
    this.blockchain.requestDocument({
      type: 'BONAFIDE_CERTIFICATE',
      studentId: this.bonafideForm.studentId,
      reason: this.bonafideForm.purpose,
    }).subscribe({
      next: () => {
        this.bonafideForm = { studentId: '', purpose: '', validityDays: 30 };
        this.showToast('Bonafide certificate issued and sent for Dean approval');
      },
      error: (e: any) => this.showToast(e?.error?.error ?? 'Issuance failed', 'error'),
    });
  }

  // ── Toast ─────────────────────────────────────────────────────
  showToast(msg: string, type: 'success' | 'error' = 'success'): void {
    this.toast = { show: true, msg, type };
    setTimeout(() => (this.toast.show = false), 3500);
  }

  get semesters(): number[] { return [1,2,3,4,5,6,7,8]; }
}

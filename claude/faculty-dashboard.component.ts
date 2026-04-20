// ============================================================
// faculty-dashboard.component.ts  — FULL REPLACEMENT
// Req #5  — "My Courses" visible ONLY to faculty (not HOD)
// Req #10 — upload internal marks, propose grades, modify before
//           submission, view assigned students
// ============================================================
import { Component, OnInit } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { FormsModule }       from '@angular/forms';
import { AuthService }       from '../../core/services/auth.service';
import { BlockchainService } from '../../core/services/blockchain.service';

type Tab = 'courses' | 'marks' | 'students';

@Component({
  selector: 'app-faculty-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './faculty-dashboard.component.html',
})
export class FacultyDashboardComponent implements OnInit {
  user: any;
  department = '';
  activeTab: Tab = 'courses';

  // ── Courses ───────────────────────────────────────────────────
  myCourses: any[] = [];
  allDeptCourses: any[] = []; // for self-enrollment dropdown

  // ── Marks ─────────────────────────────────────────────────────
  marksDrafts: any[] = [];
  showUploadForm = false;
  markForm = {
    studentId: '', courseCode: '', semester: 1,
    internal: null as number | null,
    external: null as number | null,
    proposedGrade: '',
  };
  uploadError = '';

  // ── Students ──────────────────────────────────────────────────
  assignedStudents: any[] = [];

  // ── UI ────────────────────────────────────────────────────────
  loading = false;
  toast = { show: false, msg: '', type: 'success' as 'success' | 'error' };

  constructor(
    private authService: AuthService,
    private blockchain: BlockchainService,
  ) {}

  ngOnInit(): void {
    this.user       = this.authService.getCurrentUser();
    this.department = this.user?.department ?? '';
    this.loadCourses();
  }

  setTab(tab: Tab): void {
    this.activeTab = tab;
    if (tab === 'courses')  this.loadCourses();
    if (tab === 'marks')    this.loadMarksDrafts();
    if (tab === 'students') this.loadStudents();
  }

  // ── Courses ───────────────────────────────────────────────────
  loadCourses(): void {
    this.loading = true;
    this.blockchain.getCourses().subscribe({
      next: (c: any[]) => { this.myCourses = c; this.loading = false; },
      error: () => { this.loading = false; },
    });
    // Load all dept courses for self-enrollment
    this.blockchain.getCoursesByDepartment(this.department).subscribe({
      next: (c: any[]) => (this.allDeptCourses = c),
      error: () => {},
    });
  }

  enrollInCourse(courseId: string): void {
    this.blockchain.enrollInCourse(courseId).subscribe({
      next: () => { this.loadCourses(); this.showToast('Enrolled in course'); },
      error: (e: any) => this.showToast(e?.error?.error ?? 'Enroll failed', 'error'),
    });
  }

  unenrollFromCourse(courseId: string): void {
    this.blockchain.unenrollFromCourse(courseId).subscribe({
      next: () => { this.loadCourses(); this.showToast('Unenrolled from course'); },
      error: (e: any) => this.showToast(e?.error?.error ?? 'Unenroll failed', 'error'),
    });
  }

  // ── Marks ─────────────────────────────────────────────────────
  loadMarksDrafts(): void {
    this.loading = true;
    this.blockchain.getMarks().subscribe({
      next: (m: any[]) => { this.marksDrafts = m; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  uploadMarks(): void {
    this.uploadError = '';
    const { studentId, courseCode, semester, internal, external, proposedGrade } = this.markForm;

    if (!studentId || !courseCode || !semester || internal === null) {
      this.uploadError = 'Student ID, course, semester, and internal marks are required';
      return;
    }
    if (internal > 40) { this.uploadError = 'Internal marks cannot exceed 40'; return; }
    if (external !== null && external > 60) {
      this.uploadError = 'External marks cannot exceed 60'; return;
    }

    this.blockchain.uploadMarks({
      studentId, courseCode, semester,
      internal: internal!,
      external: external ?? undefined,
      proposedGrade: proposedGrade || undefined,
    }).subscribe({
      next: () => {
        this.showUploadForm = false;
        this.markForm = { studentId: '', courseCode: '', semester: 1,
                          internal: null, external: null, proposedGrade: '' };
        this.loadMarksDrafts();
        this.showToast('Marks saved as draft');
      },
      error: (e: any) => {
        this.uploadError = e?.error?.error ?? (e?.error?.errors?.join(', ')) ?? 'Upload failed';
      },
    });
  }

  submitForApproval(id: string): void {
    this.blockchain.submitMarks(id).subscribe({
      next: () => {
        this.loadMarksDrafts();
        this.showToast('Marks submitted to HOD for approval');
      },
      error: (e: any) => this.showToast(e?.error?.error ?? 'Submit failed', 'error'),
    });
  }

  // ── Students ──────────────────────────────────────────────────
  loadStudents(): void {
    this.loading = true;
    this.blockchain.getStudentsByDepartment(this.department).subscribe({
      next: (s: any[]) => { this.assignedStudents = s; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  statusBadgeClass(status: string): string {
    const map: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-600',
      submitted: 'bg-blue-100 text-blue-700',
      hod_approved: 'bg-teal-100 text-teal-700',
      exam_approved: 'bg-green-100 text-green-700',
      locked: 'bg-purple-100 text-purple-700',
    };
    return map[status] ?? 'bg-gray-100 text-gray-500';
  }

  showToast(msg: string, type: 'success' | 'error' = 'success'): void {
    this.toast = { show: true, msg, type };
    setTimeout(() => (this.toast.show = false), 3500);
  }

  get semesters(): number[] { return [1,2,3,4,5,6,7,8]; }

  get notEnrolledCourses(): any[] {
    const enrolled = new Set(this.myCourses.map(c => c.id));
    return this.allDeptCourses.filter(c => !enrolled.has(c.id));
  }
}

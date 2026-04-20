// ============================================================
// FOUR COMPONENTS — each is a separate file in your project.
// Split at the "==== FILE:" markers.
// ============================================================


// ==== FILE: exam-section-dashboard.component.ts
// Req #12 — upload marks, lock semester, issue certs,
//           verify eligibility, maintain numbering, approve marks
// ============================================================
import { Component, OnInit } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { FormsModule }       from '@angular/forms';
import { AuthService }       from '../../core/services/auth.service';
import { BlockchainService } from '../../core/services/blockchain.service';

type ExamTab = 'marks' | 'lock' | 'certs' | 'records';

@Component({
  selector: 'app-exam-section-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="min-h-screen bg-gray-50">
  <div *ngIf="toast.show" [class.bg-green-600]="toast.type==='success'" [class.bg-red-600]="toast.type==='error'"
       class="fixed top-4 right-4 z-50 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg">{{ toast.msg }}</div>

  <header class="bg-white border-b border-gray-100 px-6 py-4">
    <h1 class="text-base font-semibold text-gray-900">Exam Section Dashboard</h1>
    <p class="text-xs text-gray-400 mt-0.5">{{ user?.username }}</p>
  </header>

  <nav class="bg-white border-b border-gray-100 px-6 flex gap-1">
    <button *ngFor="let t of [{id:'marks',label:'Marks Approval'},{id:'lock',label:'Lock Semester'},
                               {id:'certs',label:'Certificate Requests'},{id:'records',label:'All Records'}]"
      (click)="setTab(t.id)" [class.border-b-2]="activeTab===t.id" [class.border-blue-700]="activeTab===t.id"
      [class.text-blue-700]="activeTab===t.id" [class.text-gray-500]="activeTab!==t.id"
      class="px-3 py-3 text-sm font-medium transition-colors">{{ t.label }}</button>
  </nav>

  <main class="max-w-6xl mx-auto p-6">

    <!-- Marks approval (after HOD) -->
    <div *ngIf="activeTab==='marks'">
      <h2 class="text-sm font-medium text-gray-700 mb-4">Marks Pending Exam Section Approval</h2>
      <div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div *ngIf="loading" class="p-6 text-center text-sm text-gray-400">Loading…</div>
        <table *ngIf="!loading && pendingMarks.length" class="w-full text-sm">
          <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr><th class="px-4 py-3 text-left">Student</th><th class="px-4 py-3 text-left">Course</th>
                <th class="px-4 py-3 text-left">Sem</th><th class="px-4 py-3 text-left">Total</th>
                <th class="px-4 py-3 text-left">Dept</th><th class="px-4 py-3"></th></tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr *ngFor="let m of pendingMarks" class="hover:bg-gray-50">
              <td class="px-4 py-3 font-medium">{{ m.studentId }}</td>
              <td class="px-4 py-3 text-gray-600">{{ m.courseCode }}</td>
              <td class="px-4 py-3 text-gray-500">{{ m.semester }}</td>
              <td class="px-4 py-3 font-medium">{{ m.marksData?.total }}</td>
              <td class="px-4 py-3 text-gray-500">{{ m.department }}</td>
              <td class="px-4 py-3 text-right space-x-2">
                <button (click)="approveMarks(m.id)" class="text-xs text-green-600 font-medium hover:underline">Approve</button>
                <button (click)="rejectMarks(m.id)"  class="text-xs text-red-500 hover:underline">Reject</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p *ngIf="!loading && !pendingMarks.length" class="p-6 text-sm text-gray-400 text-center">No pending marks.</p>
      </div>
    </div>

    <!-- Lock semester -->
    <div *ngIf="activeTab==='lock'" class="max-w-sm">
      <h2 class="text-sm font-medium text-gray-700 mb-4">Lock Semester Results</h2>
      <div class="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
        <div>
          <label class="block text-xs text-gray-500 mb-1">Department</label>
          <select [(ngModel)]="lockForm.dept" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <option *ngFor="let d of ['CSE','ECE']" [value]="d">{{ d }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Semester</label>
          <select [(ngModel)]="lockForm.semester" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <option *ngFor="let s of [1,2,3,4,5,6,7,8]" [value]="s">Sem {{ s }}</option>
          </select>
        </div>
        <p class="text-xs text-amber-600">All exam-approved marks for this semester will be locked. This cannot be undone.</p>
        <button (click)="lockSemester()" class="w-full bg-amber-600 text-white text-sm py-2.5 rounded-lg font-medium">
          Lock Semester
        </button>
        <div *ngIf="lockResult" class="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">{{ lockResult }}</div>
      </div>
    </div>

    <!-- Certificate requests (exam section issues degree, consolidated, transfer, migration) -->
    <div *ngIf="activeTab==='certs'">
      <h2 class="text-sm font-medium text-gray-700 mb-4">Certificate Requests</h2>
      <div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div *ngIf="loading" class="p-6 text-center text-sm text-gray-400">Loading…</div>
        <table *ngIf="!loading && certRequests.length" class="w-full text-sm">
          <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr><th class="px-4 py-3 text-left">Student</th><th class="px-4 py-3 text-left">Type</th>
                <th class="px-4 py-3 text-left">Reason</th><th class="px-4 py-3"></th></tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr *ngFor="let r of certRequests" class="hover:bg-gray-50">
              <td class="px-4 py-3 font-medium">{{ r.studentId }}</td>
              <td class="px-4 py-3 text-gray-600 text-xs">{{ r.type }}</td>
              <td class="px-4 py-3 text-gray-500 text-xs">{{ r.reason || '—' }}</td>
              <td class="px-4 py-3 text-right space-x-2">
                <button (click)="approveCert(r.id)" class="text-xs text-green-600 font-medium hover:underline">Issue</button>
                <button (click)="rejectCert(r.id)"  class="text-xs text-red-500 hover:underline">Reject</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p *ngIf="!loading && !certRequests.length" class="p-6 text-sm text-gray-400 text-center">No pending requests.</p>
      </div>
    </div>

    <!-- All records -->
    <div *ngIf="activeTab==='records'">
      <h2 class="text-sm font-medium text-gray-700 mb-4">All Academic Records</h2>
      <div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div *ngIf="loading" class="p-6 text-center text-sm text-gray-400">Loading…</div>
        <table *ngIf="!loading && allMarks.length" class="w-full text-sm">
          <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr><th class="px-4 py-3 text-left">Student</th><th class="px-4 py-3 text-left">Course</th>
                <th class="px-4 py-3 text-left">Sem</th><th class="px-4 py-3 text-left">Total</th>
                <th class="px-4 py-3 text-left">Status</th></tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr *ngFor="let m of allMarks" class="hover:bg-gray-50">
              <td class="px-4 py-3 font-medium">{{ m.studentId }}</td>
              <td class="px-4 py-3 text-gray-600">{{ m.courseCode }}</td>
              <td class="px-4 py-3 text-gray-500">{{ m.semester }}</td>
              <td class="px-4 py-3 font-medium">{{ m.marksData?.total }}</td>
              <td class="px-4 py-3">
                <span class="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">{{ m.status }}</span>
              </td>
            </tr>
          </tbody>
        </table>
        <p *ngIf="!loading && !allMarks.length" class="p-6 text-sm text-gray-400 text-center">No records.</p>
      </div>
    </div>

  </main>
</div>`,
})
export class ExamSectionDashboardComponent implements OnInit {
  user: any;
  activeTab: ExamTab = 'marks';
  loading = false;
  pendingMarks: any[] = [];
  certRequests: any[] = [];
  allMarks: any[] = [];
  lockForm = { dept: 'CSE', semester: 1 };
  lockResult = '';
  toast = { show: false, msg: '', type: 'success' as 'success' | 'error' };

  constructor(private authService: AuthService, private blockchain: BlockchainService) {}
  ngOnInit(): void { this.user = this.authService.getCurrentUser(); this.loadPendingMarks(); }

  setTab(tab: string): void {
    this.activeTab = tab as ExamTab;
    if (tab === 'marks')   this.loadPendingMarks();
    if (tab === 'certs')   this.loadCertRequests();
    if (tab === 'records') this.loadAllMarks();
  }

  loadPendingMarks(): void {
    this.loading = true;
    this.blockchain.getMarks({ status: 'hod_approved' }).subscribe({
      next: (m: any[]) => { this.pendingMarks = m; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  approveMarks(id: string): void {
    this.blockchain.examApproveMarks(id).subscribe({
      next: () => { this.pendingMarks = this.pendingMarks.filter(m => m.id !== id); this.showToast('Marks approved'); },
      error: (e: any) => this.showToast(e?.error?.error ?? 'Failed', 'error'),
    });
  }

  rejectMarks(id: string): void {
    const r = prompt('Rejection reason:'); if (!r) return;
    this.blockchain.rejectMarks(id, r).subscribe({
      next: () => { this.pendingMarks = this.pendingMarks.filter(m => m.id !== id); this.showToast('Rejected'); },
      error: (e: any) => this.showToast(e?.error?.error ?? 'Failed', 'error'),
    });
  }

  lockSemester(): void {
    if (!confirm(`Lock Sem ${this.lockForm.semester} for ${this.lockForm.dept}?`)) return;
    this.blockchain.lockSemester(this.lockForm.dept, this.lockForm.semester).subscribe({
      next: (r: any) => { this.lockResult = r.message; this.showToast('Semester locked'); },
      error: (e: any) => this.showToast(e?.error?.error ?? 'Lock failed', 'error'),
    });
  }

  loadCertRequests(): void {
    this.loading = true;
    const types = ['CONSOLIDATED_MARKSHEET','DEGREE_CERTIFICATE','TRANSFER_CERTIFICATE','MIGRATION_CERTIFICATE'];
    this.blockchain.getDocumentRequests({ status: 'pending' }).subscribe({
      next: (d: any[]) => {
        this.certRequests = d.filter(r => types.includes(r.type));
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  approveCert(id: string): void {
    this.blockchain.approveDocumentRequest(id).subscribe({
      next: () => { this.certRequests = this.certRequests.filter(r => r.id !== id); this.showToast('Issued'); },
      error: (e: any) => this.showToast(e?.error?.error ?? 'Failed', 'error'),
    });
  }

  rejectCert(id: string): void {
    const r = prompt('Reason:'); if (!r) return;
    this.blockchain.rejectDocumentRequest(id, r).subscribe({
      next: () => { this.certRequests = this.certRequests.filter(x => x.id !== id); this.showToast('Rejected'); },
      error: (e: any) => this.showToast(e?.error?.error ?? 'Failed', 'error'),
    });
  }

  loadAllMarks(): void {
    this.loading = true;
    this.blockchain.getMarks().subscribe({
      next: (m: any[]) => { this.allMarks = m; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  showToast(msg: string, type: 'success' | 'error' = 'success'): void {
    this.toast = { show: true, msg, type };
    setTimeout(() => (this.toast.show = false), 3500);
  }
}


// ==== FILE: dean-dashboard.component.ts
// Req #9, #13 — approve/reject docs, validate compliance,
//               checkpoint after exam section, marks approval
// ============================================================

@Component({
  selector: 'app-dean-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="min-h-screen bg-gray-50">
  <div *ngIf="toast.show" [class.bg-green-600]="toast.type==='success'" [class.bg-red-600]="toast.type==='error'"
       class="fixed top-4 right-4 z-50 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg">{{ toast.msg }}</div>

  <header class="bg-white border-b border-gray-100 px-6 py-4">
    <h1 class="text-base font-semibold text-gray-900">Dean Academics Dashboard</h1>
    <p class="text-xs text-gray-400 mt-0.5">{{ user?.username }}</p>
  </header>

  <nav class="bg-white border-b border-gray-100 px-6 flex gap-1">
    <button *ngFor="let t of [{id:'marks',label:'Marks Approval'},{id:'certs',label:'Certificate Approval'}]"
      (click)="setTab(t.id)" [class.border-b-2]="activeTab===t.id" [class.border-blue-700]="activeTab===t.id"
      [class.text-blue-700]="activeTab===t.id" [class.text-gray-500]="activeTab!==t.id"
      class="px-3 py-3 text-sm font-medium transition-colors">{{ t.label }}</button>
  </nav>

  <main class="max-w-6xl mx-auto p-6">

    <!-- Marks (after exam section approval) -->
    <div *ngIf="activeTab==='marks'">
      <h2 class="text-sm font-medium text-gray-700 mb-4">Marks Pending Dean Approval</h2>
      <p class="text-xs text-gray-400 mb-3">
        These marks have been approved by both the department HOD and Exam Section.
        Dean approval triggers the digital signature chain and forwards to Admin for finalization.
      </p>
      <div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div *ngIf="loading" class="p-6 text-center text-sm text-gray-400">Loading…</div>
        <table *ngIf="!loading && pendingMarks.length" class="w-full text-sm">
          <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr><th class="px-4 py-3 text-left">Student</th><th class="px-4 py-3 text-left">Course</th>
                <th class="px-4 py-3 text-left">Dept</th><th class="px-4 py-3 text-left">Total</th>
                <th class="px-4 py-3"></th></tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr *ngFor="let m of pendingMarks" class="hover:bg-gray-50">
              <td class="px-4 py-3 font-medium">{{ m.studentId }}</td>
              <td class="px-4 py-3 text-gray-600">{{ m.courseCode }} – Sem {{ m.semester }}</td>
              <td class="px-4 py-3 text-gray-500">{{ m.department }}</td>
              <td class="px-4 py-3 font-medium">{{ m.marksData?.total }}</td>
              <td class="px-4 py-3 text-right space-x-2">
                <button (click)="approveMarks(m.id)" class="text-xs text-green-600 font-medium hover:underline">Approve</button>
                <button (click)="rejectMarks(m.id)"  class="text-xs text-red-500 hover:underline">Reject</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p *ngIf="!loading && !pendingMarks.length" class="p-6 text-sm text-gray-400 text-center">No pending marks.</p>
      </div>
    </div>

    <!-- Certificate approval -->
    <div *ngIf="activeTab==='certs'">
      <h2 class="text-sm font-medium text-gray-700 mb-4">Certificate Requests for Dean Approval</h2>
      <div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div *ngIf="loading" class="p-6 text-center text-sm text-gray-400">Loading…</div>
        <table *ngIf="!loading && certRequests.length" class="w-full text-sm">
          <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr><th class="px-4 py-3 text-left">Student</th><th class="px-4 py-3 text-left">Type</th>
                <th class="px-4 py-3 text-left">Reason</th><th class="px-4 py-3"></th></tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr *ngFor="let r of certRequests" class="hover:bg-gray-50">
              <td class="px-4 py-3 font-medium">{{ r.studentId }}</td>
              <td class="px-4 py-3 text-gray-600 text-xs">{{ r.type }}</td>
              <td class="px-4 py-3 text-gray-500 text-xs">{{ r.reason || '—' }}</td>
              <td class="px-4 py-3 text-right space-x-2">
                <button (click)="approveCert(r.id)" class="text-xs text-green-600 font-medium hover:underline">Approve</button>
                <button (click)="rejectCert(r.id)"  class="text-xs text-red-500 hover:underline">Reject</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p *ngIf="!loading && !certRequests.length" class="p-6 text-sm text-gray-400 text-center">No pending certificates.</p>
      </div>
    </div>

  </main>
</div>`,
})
export class DeanDashboardComponent implements OnInit {
  user: any;
  activeTab = 'marks';
  loading = false;
  pendingMarks: any[] = [];
  certRequests: any[] = [];
  toast = { show: false, msg: '', type: 'success' as 'success' | 'error' };

  constructor(private authService: AuthService, private blockchain: BlockchainService) {}
  ngOnInit(): void { this.user = this.authService.getCurrentUser(); this.loadPendingMarks(); }

  setTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'marks') this.loadPendingMarks();
    if (tab === 'certs') this.loadCertRequests();
  }

  loadPendingMarks(): void {
    this.loading = true;
    // Dean sees exam_approved marks (after exam section approval)
    this.blockchain.getMarks({ status: 'exam_approved' }).subscribe({
      next: (m: any[]) => { this.pendingMarks = m; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  // Dean approval calls the existing DeanApproveRecord chaincode function via backend
  approveMarks(id: string): void {
    // Using examApproveMarks placeholder — backend should route dean approval separately
    // This will be wired to /api/marks/:id/dean-approve in Phase 2
    this.blockchain.examApproveMarks(id).subscribe({
      next: () => { this.pendingMarks = this.pendingMarks.filter(m => m.id !== id); this.showToast('Approved — forwarded to Admin'); },
      error: (e: any) => this.showToast(e?.error?.error ?? 'Failed', 'error'),
    });
  }

  rejectMarks(id: string): void {
    const r = prompt('Rejection reason:'); if (!r) return;
    this.blockchain.rejectMarks(id, r).subscribe({
      next: () => { this.pendingMarks = this.pendingMarks.filter(m => m.id !== id); this.showToast('Rejected'); },
      error: (e: any) => this.showToast(e?.error?.error ?? 'Failed', 'error'),
    });
  }

  loadCertRequests(): void {
    this.loading = true;
    this.blockchain.getDocumentRequests({ status: 'exam_issued' }).subscribe({
      next: (d: any[]) => { this.certRequests = d; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  approveCert(id: string): void {
    this.blockchain.approveDocumentRequest(id).subscribe({
      next: () => { this.certRequests = this.certRequests.filter(r => r.id !== id); this.showToast('Approved'); },
      error: (e: any) => this.showToast(e?.error?.error ?? 'Failed', 'error'),
    });
  }

  rejectCert(id: string): void {
    const r = prompt('Reason:'); if (!r) return;
    this.blockchain.rejectDocumentRequest(id, r).subscribe({
      next: () => { this.certRequests = this.certRequests.filter(x => x.id !== id); this.showToast('Rejected'); },
      error: (e: any) => this.showToast(e?.error?.error ?? 'Failed', 'error'),
    });
  }

  showToast(msg: string, type: 'success' | 'error' = 'success'): void {
    this.toast = { show: true, msg, type };
    setTimeout(() => (this.toast.show = false), 3500);
  }
}


// ==== FILE: student-dashboard.component.ts
// Req #15, #17 — view personal records, download docs,
//                request documents, raise correction requests
// ============================================================

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="min-h-screen bg-gray-50">
  <div *ngIf="toast.show" [class.bg-green-600]="toast.type==='success'" [class.bg-red-600]="toast.type==='error'"
       class="fixed top-4 right-4 z-50 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg">{{ toast.msg }}</div>

  <header class="bg-white border-b border-gray-100 px-6 py-4">
    <h1 class="text-base font-semibold text-gray-900">Student Portal</h1>
    <p class="text-xs text-gray-400 mt-0.5">{{ user?.username }} — {{ user?.department }}</p>
  </header>

  <nav class="bg-white border-b border-gray-100 px-6 flex gap-1">
    <button *ngFor="let t of [{id:'marks',label:'My Marks'},{id:'docs',label:'My Documents'},
                               {id:'request',label:'Request Document'},{id:'corrections',label:'Correction Requests'}]"
      (click)="setTab(t.id)" [class.border-b-2]="activeTab===t.id" [class.border-blue-700]="activeTab===t.id"
      [class.text-blue-700]="activeTab===t.id" [class.text-gray-500]="activeTab!==t.id"
      class="px-3 py-3 text-sm font-medium transition-colors">{{ t.label }}</button>
  </nav>

  <main class="max-w-4xl mx-auto p-6">

    <!-- Marks -->
    <div *ngIf="activeTab==='marks'">
      <h2 class="text-sm font-medium text-gray-700 mb-4">My Academic Records</h2>
      <div class="flex gap-2 mb-3">
        <select [(ngModel)]="semFilter" (change)="loadMarks()"
                class="border border-gray-200 rounded-lg px-2 py-1.5 text-xs">
          <option [value]="null">All semesters</option>
          <option *ngFor="let s of [1,2,3,4,5,6,7,8]" [value]="s">Sem {{ s }}</option>
        </select>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div *ngIf="loading" class="p-6 text-center text-sm text-gray-400">Loading…</div>
        <table *ngIf="!loading && myMarks.length" class="w-full text-sm">
          <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr><th class="px-4 py-3 text-left">Course</th><th class="px-4 py-3 text-left">Name</th>
                <th class="px-4 py-3 text-left">Sem</th><th class="px-4 py-3 text-left">Internal</th>
                <th class="px-4 py-3 text-left">External</th><th class="px-4 py-3 text-left">Total</th></tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr *ngFor="let m of myMarks" class="hover:bg-gray-50">
              <td class="px-4 py-3 font-medium">{{ m.courseCode }}</td>
              <td class="px-4 py-3 text-gray-600">{{ m.courseName }}</td>
              <td class="px-4 py-3 text-gray-500">{{ m.semester }}</td>
              <td class="px-4 py-3">{{ m.marksData?.internal }}</td>
              <td class="px-4 py-3">{{ m.marksData?.external ?? '—' }}</td>
              <td class="px-4 py-3 font-semibold">{{ m.marksData?.total }}</td>
            </tr>
          </tbody>
        </table>
        <p *ngIf="!loading && !myMarks.length" class="p-6 text-sm text-gray-400 text-center">No finalised marks yet.</p>
      </div>
    </div>

    <!-- My Documents -->
    <div *ngIf="activeTab==='docs'">
      <h2 class="text-sm font-medium text-gray-700 mb-4">My Documents</h2>
      <div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div *ngIf="loading" class="p-6 text-center text-sm text-gray-400">Loading…</div>
        <table *ngIf="!loading && myDocs.length" class="w-full text-sm">
          <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr><th class="px-4 py-3 text-left">Type</th><th class="px-4 py-3 text-left">Issued</th>
                <th class="px-4 py-3 text-left">Status</th><th class="px-4 py-3"></th></tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr *ngFor="let d of myDocs" class="hover:bg-gray-50">
              <td class="px-4 py-3 font-medium text-xs">{{ d.type }}</td>
              <td class="px-4 py-3 text-gray-500 text-xs">{{ d.issuedAt | date:'mediumDate' }}</td>
              <td class="px-4 py-3">
                <span [class.text-green-600]="d.status==='issued'" [class.text-red-600]="d.status==='revoked'"
                      [class.text-amber-600]="d.status==='pending'" class="text-xs font-medium">
                  {{ d.status }}
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <button *ngIf="d.status==='issued'" class="text-xs text-blue-600 hover:underline">Download</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p *ngIf="!loading && !myDocs.length" class="p-6 text-sm text-gray-400 text-center">No documents yet.</p>
      </div>
    </div>

    <!-- Request Document (Req #17) -->
    <div *ngIf="activeTab==='request'" class="max-w-md">
      <h2 class="text-sm font-medium text-gray-700 mb-4">Request a Document</h2>
      <div class="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
        <div>
          <label class="block text-xs text-gray-500 mb-1">Document Type</label>
          <select [(ngModel)]="docReqForm.type" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <option value="CONSOLIDATED_MARKSHEET">Consolidated Marksheet</option>
            <option value="DEGREE_CERTIFICATE">Degree Certificate</option>
            <option value="TRANSFER_CERTIFICATE">Transfer Certificate</option>
            <option value="MIGRATION_CERTIFICATE">Migration Certificate</option>
            <option value="BONAFIDE_CERTIFICATE">Bonafide Certificate</option>
          </select>
        </div>
        <div *ngIf="docReqForm.type==='CONSOLIDATED_MARKSHEET'">
          <label class="block text-xs text-gray-500 mb-1">Up to Semester</label>
          <select [(ngModel)]="docReqForm.semester" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <option *ngFor="let s of [1,2,3,4,5,6,7,8]" [value]="s">Sem {{ s }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Reason / Purpose</label>
          <textarea [(ngModel)]="docReqForm.reason" rows="2"
                    class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
                    placeholder="Describe why you need this document"></textarea>
        </div>
        <button (click)="requestDocument()"
                class="w-full bg-blue-700 text-white text-sm py-2.5 rounded-lg font-medium">
          Submit Request
        </button>
      </div>
    </div>

    <!-- Corrections (Req #17) -->
    <div *ngIf="activeTab==='corrections'" class="max-w-md">
      <h2 class="text-sm font-medium text-gray-700 mb-4">Raise Correction Request</h2>
      <div class="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
        <div>
          <label class="block text-xs text-gray-500 mb-1">Record / Document ID</label>
          <input [(ngModel)]="corrForm.recordId" placeholder="e.g. marks record ID or cert ID"
                 class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Record Type</label>
          <select [(ngModel)]="corrForm.recordType" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <option value="marks">Marks</option>
            <option value="certificate">Certificate</option>
            <option value="personal_info">Personal Info</option>
          </select>
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Description</label>
          <textarea [(ngModel)]="corrForm.description" rows="3"
                    class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
                    placeholder="Describe the correction needed…"></textarea>
        </div>
        <button (click)="submitCorrection()"
                class="w-full bg-amber-600 text-white text-sm py-2.5 rounded-lg font-medium">
          Submit Correction Request
        </button>
      </div>
    </div>

  </main>
</div>`,
})
export class StudentDashboardComponent implements OnInit {
  user: any;
  activeTab = 'marks';
  loading = false;
  myMarks: any[] = [];
  myDocs: any[] = [];
  semFilter: number | null = null;
  docReqForm = { type: 'CONSOLIDATED_MARKSHEET', semester: 8, reason: '' };
  corrForm   = { recordId: '', recordType: 'marks', description: '' };
  toast      = { show: false, msg: '', type: 'success' as 'success' | 'error' };

  constructor(private authService: AuthService, private blockchain: BlockchainService) {}
  ngOnInit(): void { this.user = this.authService.getCurrentUser(); this.loadMarks(); }

  setTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'marks') this.loadMarks();
    if (tab === 'docs')  this.loadDocs();
  }

  loadMarks(): void {
    this.loading = true;
    const filters: any = { studentId: this.user?.username, status: 'locked' };
    if (this.semFilter) filters.semester = this.semFilter;
    this.blockchain.getMarks(filters).subscribe({
      next: (m: any[]) => { this.myMarks = m; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  loadDocs(): void {
    this.loading = true;
    this.blockchain.getDocumentRequests({ studentId: this.user?.username }).subscribe({
      next: (d: any[]) => { this.myDocs = d; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  requestDocument(): void {
    this.blockchain.requestDocument({
      type: this.docReqForm.type as any,
      studentId: this.user?.username,
      semester: this.docReqForm.semester,
      reason: this.docReqForm.reason,
    }).subscribe({
      next: () => { this.showToast('Request submitted successfully'); this.docReqForm.reason = ''; },
      error: (e: any) => this.showToast(e?.error?.error ?? 'Request failed', 'error'),
    });
  }

  submitCorrection(): void {
    if (!this.corrForm.recordId || !this.corrForm.description) {
      this.showToast('Record ID and description are required', 'error'); return;
    }
    this.blockchain.raiseCorrectionRequest(this.corrForm).subscribe({
      next: () => { this.showToast('Correction request submitted'); this.corrForm = { recordId: '', recordType: 'marks', description: '' }; },
      error: (e: any) => this.showToast(e?.error?.error ?? 'Failed', 'error'),
    });
  }

  showToast(msg: string, type: 'success' | 'error' = 'success'): void {
    this.toast = { show: true, msg, type };
    setTimeout(() => (this.toast.show = false), 3500);
  }
}


// ==== FILE: verifier-dashboard.component.ts
// Req #18 — verify hash, check signature, view status
// Req #21 — show revoked status with reason
// ============================================================

@Component({
  selector: 'app-verifier-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="min-h-screen bg-gray-50">
  <div *ngIf="toast.show" [class.bg-green-600]="toast.type==='success'" [class.bg-red-600]="toast.type==='error'"
       class="fixed top-4 right-4 z-50 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg">{{ toast.msg }}</div>

  <header class="bg-white border-b border-gray-100 px-6 py-4">
    <h1 class="text-base font-semibold text-gray-900">Document Verifier</h1>
    <p class="text-xs text-gray-400 mt-0.5">{{ user?.username }}</p>
  </header>

  <nav class="bg-white border-b border-gray-100 px-6 flex gap-1">
    <button *ngFor="let t of [{id:'hash',label:'Verify by Hash'},{id:'cert',label:'Verify Certificate'},
                               {id:'sig',label:'Verify Signature'}]"
      (click)="activeTab=t.id; clearResult()" [class.border-b-2]="activeTab===t.id"
      [class.border-blue-700]="activeTab===t.id" [class.text-blue-700]="activeTab===t.id"
      [class.text-gray-500]="activeTab!==t.id" class="px-3 py-3 text-sm font-medium transition-colors">{{ t.label }}</button>
  </nav>

  <main class="max-w-2xl mx-auto p-6 space-y-4">

    <!-- Verify by hash -->
    <div *ngIf="activeTab==='hash'">
      <h2 class="text-sm font-medium text-gray-700 mb-3">Verify Document by Hash</h2>
      <div class="flex gap-2">
        <input [(ngModel)]="hashInput" placeholder="Enter document hash (SHA-256)"
               class="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono" />
        <button (click)="verifyHash()" [disabled]="loading"
                class="bg-blue-700 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50">Verify</button>
      </div>
      <div *ngIf="result" [class]="resultCardClass()">
        <div class="flex items-start gap-3">
          <div class="mt-0.5 text-lg">{{ result.valid ? '✓' : '✗' }}</div>
          <div>
            <p class="font-medium text-sm">{{ result.valid ? 'Document verified' : 'Verification failed' }}</p>
            <p *ngIf="result.documentId" class="text-xs mt-1 opacity-80">ID: {{ result.documentId }}</p>
            <p *ngIf="result.issuedTo"   class="text-xs opacity-80">Issued to: {{ result.issuedTo }}</p>
            <p *ngIf="result.issuedAt"   class="text-xs opacity-80">Issued: {{ result.issuedAt | date:'mediumDate' }}</p>
            <!-- Req #21 — show revoked reason -->
            <div *ngIf="result.status==='REVOKED'" class="mt-2 p-2 bg-red-100 border border-red-200 rounded text-xs text-red-800">
              <strong>REVOKED</strong> — {{ result.revocationReason }}
              <span *ngIf="result.revokedAt"> ({{ result.revokedAt | date:'mediumDate' }})</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Verify certificate by ID -->
    <div *ngIf="activeTab==='cert'">
      <h2 class="text-sm font-medium text-gray-700 mb-3">Verify Certificate by ID</h2>
      <div class="flex gap-2">
        <input [(ngModel)]="certIdInput" placeholder="Certificate ID"
               class="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        <button (click)="verifyCert()" [disabled]="loading"
                class="bg-blue-700 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50">Verify</button>
      </div>
      <div *ngIf="result" [class]="resultCardClass()">
        <p class="font-medium text-sm">{{ result.valid ? '✓ Valid certificate' : '✗ Invalid or not found' }}</p>
        <div *ngIf="result.status==='REVOKED'" class="mt-2 p-2 bg-red-100 border border-red-200 rounded text-xs text-red-800">
          <strong>REVOKED</strong> — {{ result.revocationReason }}
        </div>
        <p *ngIf="result.studentId" class="text-xs mt-1 opacity-80">Student: {{ result.studentId }}</p>
        <p *ngIf="result.type" class="text-xs opacity-80">Type: {{ result.type }}</p>
        <p *ngIf="result.signatureChain?.length" class="text-xs opacity-80 mt-1">
          Signatures: {{ result.signatureChain?.join(' → ') }}
        </p>
      </div>
    </div>

    <!-- Verify signature -->
    <div *ngIf="activeTab==='sig'">
      <h2 class="text-sm font-medium text-gray-700 mb-3">Verify Digital Signature</h2>
      <div class="space-y-2">
        <input [(ngModel)]="sigForm.documentId" placeholder="Document ID"
               class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        <textarea [(ngModel)]="sigForm.signature" rows="3" placeholder="Paste digital signature"
                  class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono resize-none"></textarea>
        <button (click)="verifySig()" [disabled]="loading"
                class="w-full bg-blue-700 text-white text-sm py-2.5 rounded-lg font-medium disabled:opacity-50">
          Verify Signature
        </button>
      </div>
      <div *ngIf="result" [class]="resultCardClass()">
        <p class="font-medium text-sm">{{ result.valid ? '✓ Signature authentic' : '✗ Invalid signature' }}</p>
        <p *ngIf="result.signedBy" class="text-xs mt-1 opacity-80">Signed by: {{ result.signedBy }}</p>
        <p *ngIf="result.signedAt" class="text-xs opacity-80">At: {{ result.signedAt | date:'medium' }}</p>
      </div>
    </div>

  </main>
</div>`,
})
export class VerifierDashboardComponent implements OnInit {
  user: any;
  activeTab = 'hash';
  loading = false;
  hashInput = '';
  certIdInput = '';
  sigForm = { documentId: '', signature: '' };
  result: any = null;
  toast = { show: false, msg: '', type: 'success' as 'success' | 'error' };

  constructor(private authService: AuthService, private blockchain: BlockchainService) {}
  ngOnInit(): void { this.user = this.authService.getCurrentUser(); }

  clearResult(): void { this.result = null; }

  verifyHash(): void {
    if (!this.hashInput) return;
    this.loading = true; this.result = null;
    this.blockchain.verifyDocumentHash(this.hashInput).subscribe({
      next: (r: any) => { this.result = r; this.loading = false; },
      error: (e: any) => { this.result = { valid: false, error: e?.error?.error ?? 'Verification failed' }; this.loading = false; },
    });
  }

  verifyCert(): void {
    if (!this.certIdInput) return;
    this.loading = true; this.result = null;
    this.blockchain.verifyCertificate(this.certIdInput).subscribe({
      next: (r: any) => { this.result = r; this.loading = false; },
      error: (e: any) => { this.result = { valid: false, error: e?.error?.error ?? 'Not found' }; this.loading = false; },
    });
  }

  verifySig(): void {
    if (!this.sigForm.documentId || !this.sigForm.signature) return;
    this.loading = true; this.result = null;
    this.blockchain.verifySignature(this.sigForm).subscribe({
      next: (r: any) => { this.result = r; this.loading = false; },
      error: (e: any) => { this.result = { valid: false, error: e?.error?.error ?? 'Failed' }; this.loading = false; },
    });
  }

  resultCardClass(): string {
    const base = 'mt-3 p-4 rounded-xl border text-sm ';
    if (this.result?.status === 'REVOKED') return base + 'bg-red-50 border-red-200 text-red-900';
    return this.result?.valid
      ? base + 'bg-green-50 border-green-200 text-green-900'
      : base + 'bg-red-50 border-red-200 text-red-900';
  }

  showToast(msg: string, type: 'success' | 'error' = 'success'): void {
    this.toast = { show: true, msg, type };
    setTimeout(() => (this.toast.show = false), 3500);
  }
}

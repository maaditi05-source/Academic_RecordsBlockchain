import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
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

  <header class="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
    <div>
      <h1 class="text-base font-semibold text-gray-900">Exam Section Dashboard</h1>
      <p class="text-xs text-gray-400 mt-0.5">{{ user?.username }}</p>
    </div>
    <button (click)="logout()" class="text-xs text-red-500 hover:underline">Logout</button>
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
              <td class="px-4 py-3 font-medium">{{ m.marksData?.total || m.marksObtained }}</td>
              <td class="px-4 py-3 text-gray-500">{{ m.department }}</td>
              <td class="px-4 py-3 text-right space-x-2">
                <button (click)="approveMarks(m.id)" class="text-xs text-green-600 font-medium hover:underline">Approve</button>
                <button (click)="rejectMarks(m.id)" class="text-xs text-red-500 hover:underline">Reject</button>
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

    <!-- Certificate requests -->
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
                <button (click)="rejectCert(r.id)" class="text-xs text-red-500 hover:underline">Reject</button>
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
              <td class="px-4 py-3 font-medium">{{ m.marksData?.total || m.marksObtained }}</td>
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

    constructor(private authService: AuthService, private blockchain: BlockchainService) { }
    ngOnInit(): void { this.user = this.authService.currentUser; this.loadPendingMarks(); }

    setTab(tab: string): void {
        this.activeTab = tab as ExamTab;
        if (tab === 'marks') this.loadPendingMarks();
        if (tab === 'certs') this.loadCertRequests();
        if (tab === 'records') this.loadAllMarks();
    }

    loadPendingMarks(): void {
        this.loading = true;
        this.blockchain.getMarks({ status: 'hod_approved' }).subscribe({
            next: (m: any) => { this.pendingMarks = Array.isArray(m) ? m : (m?.data || []); this.loading = false; },
            error: () => { this.loading = false; },
        });
    }

    approveMarks(id: string): void {
        this.blockchain.examApproveMarks(id).subscribe({
            next: () => { this.pendingMarks = this.pendingMarks.filter(m => m.id !== id); this.showToast('Approved → Dean'); },
            error: (e: any) => this.showToast(e?.error?.message ?? 'Failed', 'error'),
        });
    }

    rejectMarks(id: string): void {
        const r = prompt('Rejection reason:'); if (!r) return;
        this.blockchain.rejectMarks(id, r).subscribe({
            next: () => { this.pendingMarks = this.pendingMarks.filter(m => m.id !== id); this.showToast('Rejected'); },
            error: (e: any) => this.showToast(e?.error?.message ?? 'Failed', 'error'),
        });
    }

    lockSemester(): void {
        if (!confirm(`Lock Sem ${this.lockForm.semester} for ${this.lockForm.dept}?`)) return;
        this.blockchain.lockSemester(this.lockForm.dept, this.lockForm.semester).subscribe({
            next: (r: any) => { this.lockResult = r?.message || 'Locked'; this.showToast('Semester locked'); },
            error: (e: any) => this.showToast(e?.error?.message ?? 'Lock failed', 'error'),
        });
    }

    loadCertRequests(): void {
        this.loading = true;
        const types = ['CONSOLIDATED_MARKSHEET', 'DEGREE_CERTIFICATE', 'TRANSFER_CERTIFICATE', 'MIGRATION_CERTIFICATE'];
        this.blockchain.getDocumentRequests({ status: 'pending' }).subscribe({
            next: (d: any) => {
                const arr = Array.isArray(d) ? d : (d?.data || []);
                this.certRequests = arr.filter((r: any) => types.includes(r.type));
                this.loading = false;
            },
            error: () => { this.loading = false; },
        });
    }

    approveCert(id: string): void {
        this.blockchain.approveDocumentRequest(id).subscribe({
            next: () => { this.certRequests = this.certRequests.filter(r => r.id !== id); this.showToast('Issued'); },
            error: (e: any) => this.showToast(e?.error?.message ?? 'Failed', 'error'),
        });
    }

    rejectCert(id: string): void {
        const r = prompt('Reason:'); if (!r) return;
        this.blockchain.rejectDocumentRequest(id, r).subscribe({
            next: () => { this.certRequests = this.certRequests.filter(x => x.id !== id); this.showToast('Rejected'); },
            error: (e: any) => this.showToast(e?.error?.message ?? 'Failed', 'error'),
        });
    }

    loadAllMarks(): void {
        this.loading = true;
        this.blockchain.getMarks({}).subscribe({
            next: (m: any) => { this.allMarks = Array.isArray(m) ? m : (m?.data || []); this.loading = false; },
            error: () => { this.loading = false; },
        });
    }

    logout(): void { this.authService.logout(); }
    showToast(msg: string, type: 'success' | 'error' = 'success'): void {
        this.toast = { show: true, msg, type };
        setTimeout(() => (this.toast.show = false), 3500);
    }
}

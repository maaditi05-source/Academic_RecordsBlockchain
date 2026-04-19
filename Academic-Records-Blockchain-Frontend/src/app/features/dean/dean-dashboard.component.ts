import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { BlockchainService } from '../../core/services/blockchain.service';

@Component({
    selector: 'app-dean-dashboard',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
<div class="min-h-screen bg-gray-50">
  <div *ngIf="toast.show" [class.bg-green-600]="toast.type==='success'" [class.bg-red-600]="toast.type==='error'"
       class="fixed top-4 right-4 z-50 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg">{{ toast.msg }}</div>

  <header class="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
    <div>
      <h1 class="text-base font-semibold text-gray-900">Dean Academics Dashboard</h1>
      <p class="text-xs text-gray-400 mt-0.5">{{ user?.username }}</p>
    </div>
    <button (click)="logout()" class="text-xs text-red-500 hover:underline">Logout</button>
  </header>

  <nav class="bg-white border-b border-gray-100 px-6 flex gap-1">
    <button *ngFor="let t of [{id:'marks',label:'Marks Approval'},{id:'certs',label:'Certificate Approval'}]"
      (click)="setTab(t.id)" [class.border-b-2]="activeTab===t.id" [class.border-blue-700]="activeTab===t.id"
      [class.text-blue-700]="activeTab===t.id" [class.text-gray-500]="activeTab!==t.id"
      class="px-3 py-3 text-sm font-medium transition-colors">{{ t.label }}</button>
  </nav>

  <main class="max-w-6xl mx-auto p-6">

    <div *ngIf="activeTab==='marks'">
      <h2 class="text-sm font-medium text-gray-700 mb-4">Marks Pending Dean Approval</h2>
      <p class="text-xs text-gray-400 mb-3">
        These marks have been approved by both the department HOD and Exam Section.
        Dean approval forwards to Admin for finalization.
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
              <td class="px-4 py-3 font-medium">{{ m.marksData?.total || m.marksObtained }}</td>
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
                <button (click)="rejectCert(r.id)" class="text-xs text-red-500 hover:underline">Reject</button>
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

    constructor(private authService: AuthService, private blockchain: BlockchainService) { }
    ngOnInit(): void { this.user = this.authService.currentUser; this.loadPendingMarks(); }

    setTab(tab: string): void {
        this.activeTab = tab;
        if (tab === 'marks') this.loadPendingMarks();
        if (tab === 'certs') this.loadCertRequests();
    }

    loadPendingMarks(): void {
        this.loading = true;
        this.blockchain.getMarks({ status: 'exam_approved' }).subscribe({
            next: (m: any) => { this.pendingMarks = Array.isArray(m) ? m : (m?.data || []); this.loading = false; },
            error: () => { this.loading = false; },
        });
    }

    approveMarks(id: string): void {
        this.blockchain.deanApproveMarks(id).subscribe({
            next: () => { this.pendingMarks = this.pendingMarks.filter(m => m.id !== id); this.showToast('Approved → Admin'); },
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

    loadCertRequests(): void {
        this.loading = true;
        this.blockchain.getDocumentRequests({ status: 'exam_approved' }).subscribe({
            next: (d: any) => { this.certRequests = Array.isArray(d) ? d : (d?.data || []); this.loading = false; },
            error: () => { this.loading = false; },
        });
    }

    approveCert(id: string): void {
        this.blockchain.approveDocumentRequest(id).subscribe({
            next: () => { this.certRequests = this.certRequests.filter(r => r.id !== id); this.showToast('Approved'); },
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

    logout(): void { this.authService.logout(); }
    showToast(msg: string, type: 'success' | 'error' = 'success'): void {
        this.toast = { show: true, msg, type };
        setTimeout(() => (this.toast.show = false), 3500);
    }
}

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
<div style="min-height:100vh;background:#f8fafc;">
  <div *ngIf="toast.show" [style.background]="toast.type==='success' ? '#16a34a' : '#dc2626'"
       style="position:fixed;top:16px;right:16px;z-index:50;color:#fff;font-size:14px;padding:10px 16px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);">{{ toast.msg }}</div>

  <header style="background:#fff;border-bottom:1px solid #e5e7eb;padding:16px 24px;display:flex;justify-content:space-between;align-items:center;">
    <div>
      <h1 style="font-size:16px;font-weight:600;color:#111827;">Exam Section Dashboard</h1>
      <p style="font-size:12px;color:#6b7280;margin-top:2px;">{{ user?.username }}</p>
    </div>
    <button (click)="logout()" style="font-size:12px;color:#ef4444;cursor:pointer;background:none;border:none;">Logout</button>
  </header>

  <nav style="background:#fff;border-bottom:1px solid #e5e7eb;padding:0 24px;display:flex;gap:4px;">
    <button *ngFor="let t of [{id:'marks',label:'Marks Approval'},{id:'lock',label:'Lock Semester'},
                               {id:'certs',label:'Certificate Requests'},{id:'records',label:'All Records'}]"
      (click)="setTab(t.id)" [class.border-b-2]="activeTab===t.id" [class.border-blue-700]="activeTab===t.id"
      [style.color]="activeTab===t.id ? '#1d4ed8' : '#374151'"
      style="padding:12px;font-size:14px;font-weight:500;background:none;border:none;cursor:pointer;">{{ t.label }}</button>
  </nav>

  <main style="max-width:72rem;margin:0 auto;padding:24px;">

    <!-- Marks approval (after HOD) -->
    <div *ngIf="activeTab==='marks'">
      <h2 style="font-size:14px;font-weight:500;color:#374151;margin-bottom:16px;">Marks Pending Exam Section Approval</h2>
      <div style="background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
        <div *ngIf="loading" style="padding:24px;text-align:center;font-size:14px;color:#6b7280;">Loading…</div>
        <table *ngIf="!loading && pendingMarks.length" style="width:100%;font-size:14px;border-collapse:collapse;">
          <thead style="background:#f9fafb;">
            <tr><th style="padding:12px 16px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600;">Student</th><th style="padding:12px 16px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600;">Course</th>
                <th style="padding:12px 16px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600;">Sem</th><th style="padding:12px 16px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600;">Total</th>
                <th style="padding:12px 16px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600;">Dept</th><th style="padding:12px 16px;"></th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let m of pendingMarks" style="border-top:1px solid #f3f4f6;">
              <td style="padding:12px 16px;font-weight:600;color:#111827;">{{ m.studentId }}</td>
              <td style="padding:12px 16px;color:#374151;font-weight:500;">{{ m.courseCode }}</td>
              <td style="padding:12px 16px;color:#374151;">{{ m.semester }}</td>
              <td style="padding:12px 16px;font-weight:600;color:#111827;">{{ m.marksData?.total || m.marksObtained }}</td>
              <td style="padding:12px 16px;color:#374151;">{{ m.department }}</td>
              <td style="padding:12px 16px;text-align:right;">
                <button (click)="approveMarks(m.id)" style="font-size:12px;color:#16a34a;font-weight:500;cursor:pointer;background:none;border:none;margin-right:8px;">Approve</button>
                <button (click)="rejectMarks(m.id)" style="font-size:12px;color:#ef4444;cursor:pointer;background:none;border:none;">Reject</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p *ngIf="!loading && !pendingMarks.length" style="padding:24px;font-size:14px;color:#6b7280;text-align:center;">No pending marks.</p>
      </div>
    </div>

    <!-- Lock semester -->
    <div *ngIf="activeTab==='lock'" style="max-width:24rem;">
      <h2 style="font-size:14px;font-weight:500;color:#374151;margin-bottom:16px;">Lock Semester Results</h2>
      <div style="background:#fff;border-radius:12px;border:1px solid #e5e7eb;padding:20px;">
        <div style="margin-bottom:12px;">
          <label style="display:block;font-size:12px;color:#6b7280;margin-bottom:4px;">Department</label>
          <select [(ngModel)]="lockForm.dept" style="width:100%;border:1px solid #d1d5db;border-radius:8px;padding:8px 12px;font-size:14px;color:#111827;">
            <option *ngFor="let d of ['CSE','ECE']" [value]="d">{{ d }}</option>
          </select>
        </div>
        <div style="margin-bottom:12px;">
          <label style="display:block;font-size:12px;color:#6b7280;margin-bottom:4px;">Semester</label>
          <select [(ngModel)]="lockForm.semester" style="width:100%;border:1px solid #d1d5db;border-radius:8px;padding:8px 12px;font-size:14px;color:#111827;">
            <option *ngFor="let s of [1,2,3,4,5,6,7,8]" [value]="s">Sem {{ s }}</option>
          </select>
        </div>
        <p style="font-size:12px;color:#d97706;margin-bottom:12px;">All exam-approved marks for this semester will be locked. This cannot be undone.</p>
        <button (click)="lockSemester()" style="width:100%;background:#d97706;color:#fff;font-size:14px;padding:10px;border-radius:8px;font-weight:500;border:none;cursor:pointer;">
          Lock Semester
        </button>
        <div *ngIf="lockResult" style="font-size:12px;color:#374151;background:#f9fafb;padding:12px;border-radius:8px;margin-top:12px;">{{ lockResult }}</div>
      </div>
    </div>

    <!-- Certificate requests -->
    <div *ngIf="activeTab==='certs'">
      <h2 style="font-size:14px;font-weight:500;color:#374151;margin-bottom:16px;">Certificate Requests</h2>
      <div style="background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
        <div *ngIf="loading" style="padding:24px;text-align:center;font-size:14px;color:#6b7280;">Loading…</div>
        <table *ngIf="!loading && certRequests.length" style="width:100%;font-size:14px;border-collapse:collapse;">
          <thead style="background:#f9fafb;">
            <tr><th style="padding:12px 16px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600;">Student</th><th style="padding:12px 16px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600;">Type</th>
                <th style="padding:12px 16px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600;">Reason</th><th style="padding:12px 16px;"></th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of certRequests" style="border-top:1px solid #f3f4f6;">
              <td style="padding:12px 16px;font-weight:600;color:#111827;">{{ r.studentId }}</td>
              <td style="padding:12px 16px;color:#374151;font-size:13px;">{{ r.type }}</td>
              <td style="padding:12px 16px;color:#374151;font-size:13px;">{{ r.reason || '—' }}</td>
              <td style="padding:12px 16px;text-align:right;">
                <button (click)="approveCert(r.id)" style="font-size:12px;color:#16a34a;font-weight:500;cursor:pointer;background:none;border:none;margin-right:8px;">Issue</button>
                <button (click)="rejectCert(r.id)" style="font-size:12px;color:#ef4444;cursor:pointer;background:none;border:none;">Reject</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p *ngIf="!loading && !certRequests.length" style="padding:24px;font-size:14px;color:#6b7280;text-align:center;">No pending requests.</p>
      </div>
    </div>

    <!-- All records -->
    <div *ngIf="activeTab==='records'">
      <h2 style="font-size:14px;font-weight:500;color:#374151;margin-bottom:16px;">All Academic Records</h2>
      <div style="background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
        <div *ngIf="loading" style="padding:24px;text-align:center;font-size:14px;color:#6b7280;">Loading…</div>
        <table *ngIf="!loading && allMarks.length" style="width:100%;font-size:14px;border-collapse:collapse;">
          <thead style="background:#f9fafb;">
            <tr><th style="padding:12px 16px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600;">Student</th><th style="padding:12px 16px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600;">Course</th>
                <th style="padding:12px 16px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600;">Sem</th><th style="padding:12px 16px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600;">Total</th>
                <th style="padding:12px 16px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600;">Status</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let m of allMarks" style="border-top:1px solid #f3f4f6;">
              <td style="padding:12px 16px;font-weight:600;color:#111827;">{{ m.studentId }}</td>
              <td style="padding:12px 16px;color:#374151;font-weight:500;">{{ m.courseCode }}</td>
              <td style="padding:12px 16px;color:#374151;">{{ m.semester }}</td>
              <td style="padding:12px 16px;font-weight:600;color:#111827;">{{ m.marksData?.total || m.marksObtained }}</td>
              <td style="padding:12px 16px;">
                <span style="font-size:12px;padding:2px 8px;border-radius:12px;font-weight:500;background:#f3f4f6;color:#374151;">{{ m.status }}</span>
              </td>
            </tr>
          </tbody>
        </table>
        <p *ngIf="!loading && !allMarks.length" style="padding:24px;font-size:14px;color:#6b7280;text-align:center;">No records.</p>
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
    const types = ['CONSOLIDATED_MARKSHEET', 'DEGREE_CERTIFICATE', 'MIGRATION_CERTIFICATE'];
    this.blockchain.getDocumentRequests({ status: 'hod_approved' }).subscribe({
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

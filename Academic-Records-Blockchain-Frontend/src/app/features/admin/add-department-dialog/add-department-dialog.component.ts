import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { APP_CONFIG } from '../../../core/config/app.config';

@Component({
  selector: 'app-add-department-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatSelectModule, MatProgressSpinnerModule,
    MatSnackBarModule, HttpClientModule
  ],
  template: `
    <h2 mat-dialog-title>Add New Department</h2>
    <mat-dialog-content>
      <form #deptForm="ngForm" class="dialog-form">
        <mat-form-field appearance="outline" class="full-width mt-3">
          <mat-label>Department ID / Code</mat-label>
          <input matInput [(ngModel)]="deptData.departmentId" name="departmentId" required placeholder="e.g. CSE">
          <mat-hint>Must be unique (e.g., CSE, ECE)</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Department Name</mat-label>
          <input matInput [(ngModel)]="deptData.departmentName" name="departmentName" required placeholder="Computer Science and Engineering">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>HOD Name</mat-label>
          <input matInput [(ngModel)]="deptData.hod" name="hod" required>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>HOD Email</mat-label>
          <input matInput type="email" [(ngModel)]="deptData.email" name="email" required>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()" [disabled]="submitting">Cancel</button>
      <button mat-raised-button color="primary"
              (click)="onSubmit()"
              [disabled]="!isValid() || submitting">
        <span *ngIf="!submitting">Create Department</span>
        <mat-spinner *ngIf="submitting" diameter="20"></mat-spinner>
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form { display: flex; flex-direction: column; gap: 8px; min-width: 400px; padding-top: 8px; }
    .full-width { width: 100%; }
    .mt-3 { margin-top: 12px; }
    mat-spinner { margin-left: auto; margin-right: auto; }
  `]
})
export class AddDepartmentDialogComponent {
  deptData = {
    departmentId: '',
    departmentName: '',
    hod: '',
    email: ''
  };
  submitting = false;

  constructor(
    public dialogRef: MatDialogRef<AddDepartmentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) { }

  isValid(): boolean {
    return !!(this.deptData.departmentId && this.deptData.departmentName && this.deptData.hod && this.deptData.email);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onSubmit(): void {
    if (!this.isValid()) return;
    this.submitting = true;

    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.post<any>(`${APP_CONFIG.api.baseUrl}/department/create`, this.deptData, { headers }).subscribe({
      next: (res) => {
        this.submitting = false;
        if (res.success) {
          this.snackBar.open('Department created successfully', 'Close', { duration: 3000 });
          this.dialogRef.close(true);
        } else {
          this.snackBar.open(res.message || 'Failed to create department', 'Close', { duration: 5000 });
        }
      },
      error: (err) => {
        this.submitting = false;
        console.error('Error creating department:', err);
        this.snackBar.open(err.error?.message || 'Error communicating with server', 'Close', { duration: 5000 });
      }
    });
  }
}

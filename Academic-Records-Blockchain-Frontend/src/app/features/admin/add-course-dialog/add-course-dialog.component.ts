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
  selector: 'app-add-course-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatSelectModule, MatProgressSpinnerModule,
    MatSnackBarModule, HttpClientModule
  ],
  template: `
    <h2 mat-dialog-title>Add New Course</h2>
    <mat-dialog-content>
      <form #courseForm="ngForm" class="dialog-form">
        <div class="row">
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Department ID</mat-label>
            <input matInput [(ngModel)]="courseData.departmentId" name="departmentId" required placeholder="e.g. CSE">
          </mat-form-field>

          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Course Code</mat-label>
            <input matInput [(ngModel)]="courseData.courseCode" name="courseCode" required placeholder="e.g. CS101">
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Course Name</mat-label>
          <input matInput [(ngModel)]="courseData.courseName" name="courseName" required placeholder="e.g. Intro to Programming">
        </mat-form-field>

        <div class="row">
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Credits</mat-label>
            <input matInput type="number" [(ngModel)]="courseData.credits" name="credits" required placeholder="e.g. 4">
          </mat-form-field>

          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Semester</mat-label>
            <input matInput type="number" [(ngModel)]="courseData.semester" name="semester" required placeholder="e.g. 3">
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Academic Year</mat-label>
          <input matInput [(ngModel)]="courseData.academicYear" name="academicYear" required placeholder="e.g. 2025-26">
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()" [disabled]="submitting">Cancel</button>
      <button mat-raised-button color="primary"
              (click)="onSubmit()"
              [disabled]="!isValid() || submitting">
        <span *ngIf="!submitting">Add Course</span>
        <mat-spinner *ngIf="submitting" diameter="20"></mat-spinner>
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form { display: flex; flex-direction: column; gap: 8px; min-width: 400px; padding-top: 8px; }
    .full-width { width: 100%; }
    .half-width { width: 48%; }
    .row { display: flex; justify-content: space-between; }
    .mt-3 { margin-top: 12px; }
    mat-spinner { margin-left: auto; margin-right: auto; }
  `]
})
export class AddCourseDialogComponent {
  courseData = {
    departmentId: '',
    courseCode: '',
    courseName: '',
    credits: null as number | null,
    semester: null as number | null,
    academicYear: '2025-26'
  };
  submitting = false;

  constructor(
    public dialogRef: MatDialogRef<AddCourseDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) { }

  isValid(): boolean {
    return !!(this.courseData.departmentId && this.courseData.courseCode && this.courseData.courseName
      && this.courseData.credits && this.courseData.semester && this.courseData.academicYear);
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

    this.http.post<any>(`${APP_CONFIG.api.baseUrl}/department/courses/create`, this.courseData, { headers }).subscribe({
      next: (res) => {
        this.submitting = false;
        if (res.success) {
          this.snackBar.open('Course added successfully', 'Close', { duration: 3000 });
          this.dialogRef.close(true);
        } else {
          this.snackBar.open(res.message || 'Failed to add course', 'Close', { duration: 5000 });
        }
      },
      error: (err) => {
        this.submitting = false;
        console.error('Error adding course:', err);
        this.snackBar.open(err.error?.message || 'Error communicating with server', 'Close', { duration: 5000 });
      }
    });
  }
}

import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Student {
  studentId: string;
  name: string;
  rollNumber: string;
  department: string;
}

@Component({
  selector: 'app-certificate-request-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="dialog-header">
      <mat-icon class="header-icon">request_page</mat-icon>
      <h2 mat-dialog-title>Request Certificate</h2>
    </div>
    <mat-dialog-content>
      <div class="form-container">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Certificate Type</mat-label>
          <mat-select [(ngModel)]="certificateType" required>
            <mat-option value="DEGREE">Degree Certificate</mat-option>
            <mat-option value="TRANSCRIPT">Transcript</mat-option>
            <mat-option value="BONAFIDE">Bonafide Certificate</mat-option>
            <mat-option value="PROVISIONAL">Provisional Certificate</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Purpose</mat-label>
          <mat-select [(ngModel)]="purpose" required>
            <mat-option value="EMPLOYMENT">Employment</mat-option>
            <mat-option value="HIGHER_STUDIES">Higher Studies</mat-option>
            <mat-option value="VISA">Visa Application</mat-option>
            <mat-option value="LOAN">Loan Application</mat-option>
            <mat-option value="OTHER">Other</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Additional Details</mat-label>
          <textarea 
            matInput 
            [(ngModel)]="additionalDetails"
            rows="4"
            placeholder="Please provide any additional information about your certificate request..."
          ></textarea>
        </mat-form-field>

        <div class="info-section">
          <div class="info-header">
            <mat-icon>info</mat-icon>
            <strong>Student Information</strong>
          </div>
          <div class="info-row">
            <mat-icon>person</mat-icon>
                <span><strong>Name:</strong> {{ data.student.name || 'N/A' }}</span>
          </div>
          <div class="info-row">
            <mat-icon>badge</mat-icon>
                <span><strong>Roll Number:</strong> {{ data.student.rollNumber || 'N/A' }}</span>
          </div>
          <div class="info-row">
            <mat-icon>domain</mat-icon>
                <span><strong>Department:</strong> {{ data.student.department || 'N/A' }}</span>
          </div>
        </div>

        <div class="note-section">
          <div class="note-header">
            <mat-icon>lightbulb</mat-icon>
            <strong>Important Note</strong>
          </div>
          <p>Your certificate request will be reviewed by the admin office. 
          You will be notified once your certificate is ready for collection or has been issued.</p>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()" [disabled]="submitting">Cancel</button>
      <button 
        mat-raised-button 
        color="primary" 
        (click)="onSubmit()" 
        [disabled]="!isValid() || submitting"
      >
        <span *ngIf="!submitting">Submit Request</span>
        <mat-spinner *ngIf="submitting" diameter="20"></mat-spinner>
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    /* Dialog Header */
    .dialog-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 1.5rem 1.5rem 1rem 1.5rem;
      margin: -24px -24px 0 -24px;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .header-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: white;
    }

    .dialog-header h2 {
      margin: 0;
      color: white;
      font-weight: 600;
      font-size: 1.5rem;
    }

    /* Dialog Content */
    ::ng-deep .mat-mdc-dialog-content {
      padding: 1.5rem 1.5rem 0 1.5rem !important;
    }

    .form-container {
      padding: 1rem 0;
      min-width: 500px;
    }

    /* Form Fields */
    .full-width {
      width: 100%;
      margin-bottom: 1rem;
    }

    ::ng-deep .mat-mdc-form-field {
      font-family: inherit;
    }

    ::ng-deep .mat-mdc-text-field-wrapper {
      background: rgba(102, 126, 234, 0.03);
      border-radius: 12px;
    }

    ::ng-deep .mat-mdc-form-field-focus-overlay {
      background-color: rgba(102, 126, 234, 0.05);
    }

    ::ng-deep .mdc-text-field--outlined .mdc-notched-outline .mdc-notched-outline__leading,
    ::ng-deep .mdc-text-field--outlined .mdc-notched-outline .mdc-notched-outline__notch,
    ::ng-deep .mdc-text-field--outlined .mdc-notched-outline .mdc-notched-outline__trailing {
      border-color: rgba(102, 126, 234, 0.3);
      transition: border-color 0.3s ease;
    }

    ::ng-deep .mat-mdc-form-field.mat-focused .mdc-notched-outline .mdc-notched-outline__leading,
    ::ng-deep .mat-mdc-form-field.mat-focused .mdc-notched-outline .mdc-notched-outline__notch,
    ::ng-deep .mat-mdc-form-field.mat-focused .mdc-notched-outline .mdc-notched-outline__trailing {
      border-color: #667eea;
      border-width: 2px;
    }

    /* Info Section */
    .info-section {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
      padding: 1.25rem;
      border-radius: 16px;
      margin: 1.5rem 0;
      border: 2px solid rgba(102, 126, 234, 0.2);
    }

    .info-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      color: #667eea;
      font-size: 1rem;
    }

    .info-header mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .info-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin: 0.75rem 0;
      padding: 0.5rem;
      border-radius: 8px;
      transition: background 0.2s ease;
    }

    .info-row:hover {
      background: rgba(102, 126, 234, 0.08);
    }

    .info-row mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #667eea;
    }

    .info-row span {
      font-size: 0.875rem;
      color: #1a1a2e;
    }

    .info-row strong {
      font-weight: 600;
      margin-right: 0.5rem;
    }

    /* Note Section */
    .note-section {
      background: linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 152, 0, 0.1) 100%);
      border-left: 4px solid #ffc107;
      padding: 1.25rem;
      border-radius: 12px;
      margin: 1.5rem 0;
    }

    .note-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
      color: #f57f17;
      font-size: 1rem;
    }

    .note-header mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .note-section p {
      margin: 0;
      font-size: 0.875rem;
      color: #856404;
      line-height: 1.6;
    }

    /* Dialog Actions */
    mat-dialog-actions {
      padding: 1.5rem 1.5rem 1rem 1.5rem;
      margin: 0 -24px -24px -24px;
      border-top: 2px solid rgba(102, 126, 234, 0.1);
      background: rgba(102, 126, 234, 0.02);
    }

    mat-dialog-actions button {
      border-radius: 12px;
      padding: 0 24px;
      height: 44px;
      font-weight: 600;
      transition: all 0.3s ease;
    }

    mat-dialog-actions button[mat-raised-button] {
      min-width: 140px;
    }

    mat-dialog-actions button:hover:not([disabled]) {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
    }

    mat-dialog-actions button[disabled] {
      opacity: 0.6;
      cursor: not-allowed;
    }

    mat-spinner {
      display: inline-block;
      margin: 0;
    }

    /* Responsive Design */
    @media (max-width: 600px) {
      .dialog-header {
        padding: 1rem;
        margin: -16px -16px 0 -16px;
      }

      .header-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }

      .dialog-header h2 {
        font-size: 1.25rem;
      }

      .form-container {
        min-width: unset;
        padding: 0.5rem 0;
      }

      ::ng-deep .mat-mdc-dialog-content {
        padding: 1rem !important;
      }

      mat-dialog-actions {
        padding: 1rem;
        margin: 0 -16px -16px -16px;
        flex-direction: column;
        gap: 0.75rem;
      }

      mat-dialog-actions button {
        width: 100%;
      }
    }
  `]
})
export class CertificateRequestDialogComponent {
  certificateType = '';
  purpose = '';
  additionalDetails = '';
  submitting = false;
  private apiUrl = environment.apiUrl;

  constructor(
    public dialogRef: MatDialogRef<CertificateRequestDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { student: Student },
    private snackBar: MatSnackBar,
    private http: HttpClient
  ) {
    console.log('CertificateRequestDialog initialized with apiUrl:', this.apiUrl);
  }

  isValid(): boolean {
    return this.certificateType !== '' && this.purpose !== '';
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (!this.isValid()) {
      this.snackBar.open('Please fill all required fields', 'Close', { duration: 3000 });
      return;
    }

    this.submitting = true;

    const requestData = {
      certificateType: this.certificateType,
      purpose: this.purpose,
      additionalDetails: this.additionalDetails
    };

    console.log('Submitting certificate request:', requestData);
    console.log('API URL:', `${this.apiUrl}/certificates/request`);
    console.log('Token from localStorage:', localStorage.getItem('access_token') ? 'Token exists' : 'No token');

    this.http.post<any>(`${this.apiUrl}/certificates/request`, requestData).subscribe({
      next: (response) => {
        console.log('Certificate request submitted successfully:', response);
        this.submitting = false;
        this.dialogRef.close(response.data);
      },
      error: (error) => {
        console.error('Error submitting certificate request:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        console.error('Error details:', error.error);
        
        let errorMessage = 'Failed to submit request. Please try again.';
        if (error.status === 401) {
          errorMessage = 'Unauthorized. Please login again.';
        } else if (error.status === 403) {
          errorMessage = 'You do not have permission to request certificates.';
        } else if (error.status === 0) {
          errorMessage = 'Cannot connect to server. Please check if backend is running.';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
        this.submitting = false;
      }
    });
  }
}

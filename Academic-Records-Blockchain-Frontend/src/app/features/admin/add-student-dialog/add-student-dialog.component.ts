import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';

@Component({
  selector: 'app-add-student-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatStepperModule
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <div class="header-content">
          <div class="icon-wrapper">
            <mat-icon>person_add</mat-icon>
          </div>
          <div class="header-text">
            <h2 mat-dialog-title>Add New Student</h2>
            <p class="subtitle">Register student on blockchain</p>
          </div>
        </div>
        <button mat-icon-button mat-dialog-close class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content>
        <mat-stepper [linear]="true" #stepper>
          <!-- Step 1: Basic Info -->
          <mat-step [stepControl]="basicInfoForm">
            <ng-template matStepLabel>Basic Information</ng-template>
            <form [formGroup]="basicInfoForm" class="step-form">
              <mat-form-field appearance="outline">
                <mat-label>Roll Number</mat-label>
                <input matInput formControlName="rollNumber" placeholder="CS21B001">
                <mat-icon matPrefix>badge</mat-icon>
                <mat-hint>Enter student roll number</mat-hint>
                <mat-error *ngIf="basicInfoForm.get('rollNumber')?.hasError('required')">
                  Roll number is required
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Full Name</mat-label>
                <input matInput formControlName="name" placeholder="John Doe">
                <mat-icon matPrefix>person</mat-icon>
                <mat-error *ngIf="basicInfoForm.get('name')?.hasError('required')">
                  Name is required
                </mat-error>
              </mat-form-field>

              <div class="step-actions">
                <button mat-raised-button color="primary" matStepperNext 
                        [disabled]="!basicInfoForm.valid">
                  Next <mat-icon>arrow_forward</mat-icon>
                </button>
              </div>
            </form>
          </mat-step>

          <!-- Step 2: Contact Info -->
          <mat-step [stepControl]="contactInfoForm">
            <ng-template matStepLabel>Contact Information</ng-template>
            <form [formGroup]="contactInfoForm" class="step-form">
              <mat-form-field appearance="outline">
                <mat-label>Email Address</mat-label>
                <input matInput type="email" formControlName="email" 
                       placeholder="cs21b001@student.nitw.ac.in">
                <mat-icon matPrefix>email</mat-icon>
                <mat-hint>Use official student email</mat-hint>
                <mat-error *ngIf="contactInfoForm.get('email')?.hasError('required')">
                  Email is required
                </mat-error>
                <mat-error *ngIf="contactInfoForm.get('email')?.hasError('email')">
                  Invalid email format
                </mat-error>
              </mat-form-field>

              <div class="step-actions">
                <button mat-button matStepperPrevious>
                  <mat-icon>arrow_back</mat-icon> Back
                </button>
                <button mat-raised-button color="primary" matStepperNext 
                        [disabled]="!contactInfoForm.valid">
                  Next <mat-icon>arrow_forward</mat-icon>
                </button>
              </div>
            </form>
          </mat-step>

          <!-- Step 3: Academic Info -->
          <mat-step [stepControl]="academicInfoForm">
            <ng-template matStepLabel>Academic Details</ng-template>
            <form [formGroup]="academicInfoForm" class="step-form">
              <mat-form-field appearance="outline">
                <mat-label>Department</mat-label>
                <mat-select formControlName="department">
                  <mat-option *ngFor="let dept of departments" [value]="dept">
                    {{dept}}
                  </mat-option>
                </mat-select>
                <mat-icon matPrefix>school</mat-icon>
                <mat-error *ngIf="academicInfoForm.get('department')?.hasError('required')">
                  Department is required
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Enrollment Year</mat-label>
                <input matInput type="number" formControlName="enrollmentYear" 
                       [placeholder]="currentYear.toString()">
                <mat-icon matPrefix>calendar_today</mat-icon>
                <mat-error *ngIf="academicInfoForm.get('enrollmentYear')?.hasError('required')">
                  Year is required
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Admission Category</mat-label>
                <mat-select formControlName="admissionCategory">
                  <mat-option value="GENERAL">GENERAL</mat-option>
                  <mat-option value="OBC">OBC</mat-option>
                  <mat-option value="SC">SC</mat-option>
                  <mat-option value="ST">ST</mat-option>
                  <mat-option value="EWS">EWS</mat-option>
                </mat-select>
                <mat-icon matPrefix>category</mat-icon>
              </mat-form-field>

              <div class="step-actions">
                <button mat-button matStepperPrevious>
                  <mat-icon>arrow_back</mat-icon> Back
                </button>
                <button mat-raised-button color="primary" matStepperNext 
                        [disabled]="!academicInfoForm.valid">
                  Review <mat-icon>preview</mat-icon>
                </button>
              </div>
            </form>
          </mat-step>

          <!-- Step 4: Review -->
          <mat-step>
            <ng-template matStepLabel>Review & Confirm</ng-template>
            <div class="review-section">
              <div class="review-card">
                <mat-icon class="review-icon">check_circle</mat-icon>
                <h3>Review Student Details</h3>
                
                <div class="review-grid">
                  <div class="review-item">
                    <mat-icon>badge</mat-icon>
                    <div>
                      <label>Roll Number</label>
                      <span>{{basicInfoForm.get('rollNumber')?.value}}</span>
                    </div>
                  </div>

                  <div class="review-item">
                    <mat-icon>person</mat-icon>
                    <div>
                      <label>Full Name</label>
                      <span>{{basicInfoForm.get('name')?.value}}</span>
                    </div>
                  </div>

                  <div class="review-item">
                    <mat-icon>email</mat-icon>
                    <div>
                      <label>Email</label>
                      <span>{{contactInfoForm.get('email')?.value}}</span>
                    </div>
                  </div>

                  <div class="review-item">
                    <mat-icon>school</mat-icon>
                    <div>
                      <label>Department</label>
                      <span>{{academicInfoForm.get('department')?.value}}</span>
                    </div>
                  </div>

                  <div class="review-item">
                    <mat-icon>calendar_today</mat-icon>
                    <div>
                      <label>Enrollment Year</label>
                      <span>{{academicInfoForm.get('enrollmentYear')?.value}}</span>
                    </div>
                  </div>

                  <div class="review-item">
                    <mat-icon>category</mat-icon>
                    <div>
                      <label>Category</label>
                      <span>{{academicInfoForm.get('admissionCategory')?.value}}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="step-actions">
                <button mat-button matStepperPrevious>
                  <mat-icon>arrow_back</mat-icon> Back
                </button>
                <button mat-raised-button color="primary" (click)="onSubmit()">
                  <mat-icon>check</mat-icon> Add Student
                </button>
              </div>
            </div>
          </mat-step>
        </mat-stepper>
      </mat-dialog-content>
    </div>
  `,
  styles: [`
    .dialog-container {
      width: 600px;
      max-width: 95vw;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 24px 24px 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      position: relative;
      overflow: hidden;
    }

    .dialog-header::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -20%;
      width: 300px;
      height: 300px;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
      border-radius: 50%;
    }

    .header-content {
      display: flex;
      gap: 16px;
      align-items: center;
      z-index: 1;
      padding-bottom: 24px;
    }

    .icon-wrapper {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid rgba(255, 255, 255, 0.3);
      
      mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        color: white;
      }
    }

    .header-text {
      h2 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 700;
        color: white;
      }

      .subtitle {
        margin: 4px 0 0;
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.85);
      }
    }

    .close-btn {
      z-index: 1;
      color: white;
    }

    mat-dialog-content {
      padding: 32px 24px;
      overflow: visible;
    }

    .step-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding: 24px 0;
      min-height: 300px;
    }

    mat-form-field {
      width: 100%;
    }

    .step-actions {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin-top: auto;
      padding-top: 24px;
      
      button {
        display: flex;
        align-items: center;
        gap: 8px;
        border-radius: 12px;
        font-weight: 600;
        height: 44px;
        padding: 0 24px;
      }

      button[color="primary"] {
        flex: 1;
      }
    }

    ::ng-deep .mat-stepper-horizontal {
      background: transparent;
    }

    ::ng-deep .mat-step-header {
      pointer-events: none;
    }

    ::ng-deep .mat-step-header .mat-step-icon {
      background-color: #667eea;
    }

    ::ng-deep .mat-step-header .mat-step-icon-selected {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .review-section {
      min-height: 300px;
      display: flex;
      flex-direction: column;
    }

    .review-card {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05));
      border-radius: 16px;
      padding: 32px;
      text-align: center;
      margin-bottom: 24px;
    }

    .review-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #667eea;
      margin-bottom: 16px;
    }

    .review-card h3 {
      margin: 0 0 24px;
      color: #1a1a2e;
      font-size: 1.25rem;
      font-weight: 700;
    }

    .review-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      text-align: left;
    }

    .review-item {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      padding: 16px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      
      mat-icon {
        color: #667eea;
        font-size: 24px;
        width: 24px;
        height: 24px;
      }

      div {
        flex: 1;
        
        label {
          display: block;
          font-size: 0.75rem;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
          font-weight: 600;
        }

        span {
          display: block;
          font-size: 0.95rem;
          color: #1a1a2e;
          font-weight: 600;
        }
      }
    }

    @media (max-width: 600px) {
      .dialog-container {
        width: 100%;
      }

      .review-grid {
        grid-template-columns: 1fr;
      }

      .step-form {
        min-height: 250px;
      }
    }
  `]
})
export class AddStudentDialogComponent {
  basicInfoForm: FormGroup;
  contactInfoForm: FormGroup;
  academicInfoForm: FormGroup;
  currentYear = new Date().getFullYear();
  departments: string[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddStudentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.departments = data.departments || ['CSE', 'ECE', 'EE', 'MECH', 'CIVIL', 'CHEM', 'MME', 'BIO'];

    this.basicInfoForm = this.fb.group({
      rollNumber: ['', Validators.required],
      name: ['', Validators.required]
    });

    this.contactInfoForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.academicInfoForm = this.fb.group({
      department: ['', Validators.required],
      enrollmentYear: [this.currentYear, Validators.required],
      admissionCategory: ['GENERAL', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.basicInfoForm.valid && this.contactInfoForm.valid && this.academicInfoForm.valid) {
      const studentData = {
        ...this.basicInfoForm.value,
        ...this.contactInfoForm.value,
        ...this.academicInfoForm.value,
        rollNumber: this.basicInfoForm.value.rollNumber.toUpperCase(),
        email: this.contactInfoForm.value.email.toLowerCase(),
        department: this.academicInfoForm.value.department.toUpperCase()
      };
      
      this.dialogRef.close(studentData);
    }
  }
}

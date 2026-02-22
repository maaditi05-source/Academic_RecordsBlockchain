import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthService } from '../../core/services/auth.service';
import { BlockchainService } from '../../core/services/blockchain.service';
import { Student, AcademicRecord, Course } from '../../core/models/blockchain.model';
import { ConfirmDialogComponent } from '../admin/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-department-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
    MatChipsModule,
    MatDialogModule
  ],
  template: `
    <div class="dashboard-container">
      <!-- Animated Background -->
      <div class="bg-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
      </div>

      <!-- Header -->
      <div class="dashboard-header">
        <div class="header-content">
          <div class="logo-wrapper">
            <mat-icon class="dashboard-icon">domain</mat-icon>
          </div>
          <div class="header-text">
            <h1>{{currentUser?.department}} Department</h1>
            <p class="welcome-text">
              <mat-icon class="welcome-icon">waving_hand</mat-icon>
              Welcome back, <span class="user-name">{{currentUser?.name}}</span>
            </p>
          </div>
        </div>
        <button mat-raised-button class="logout-btn" (click)="logout()">
          <mat-icon>logout</mat-icon>
          Logout
        </button>
      </div>

      <!-- Main Content -->
      <mat-card class="content-card modern-card">
        <mat-tab-group>
          <!-- Department Students Tab -->
          <mat-tab label="Department Students">
            <div class="tab-content">
              <div class="tab-header">
                <h2>Students in {{currentUser?.department}}</h2>
                <button mat-raised-button color="primary" (click)="refreshStudents()">
                  <mat-icon>refresh</mat-icon>
                  Refresh
                </button>
              </div>

              <div class="table-container" *ngIf="students.length > 0; else noStudents">
                <table mat-table [dataSource]="students" class="students-table">
                  <ng-container matColumnDef="rollNumber">
                    <th mat-header-cell *matHeaderCellDef>Roll Number</th>
                    <td mat-cell *matCellDef="let student">{{student.rollNumber}}</td>
                  </ng-container>

                  <ng-container matColumnDef="name">
                    <th mat-header-cell *matHeaderCellDef>Name</th>
                    <td mat-cell *matCellDef="let student">{{student.name}}</td>
                  </ng-container>

                  <ng-container matColumnDef="year">
                    <th mat-header-cell *matHeaderCellDef>Year</th>
                    <td mat-cell *matCellDef="let student">{{student.enrollmentYear}}</td>
                  </ng-container>

                  <ng-container matColumnDef="cgpa">
                    <th mat-header-cell *matHeaderCellDef>CGPA</th>
                    <td mat-cell *matCellDef="let student">{{student.currentCGPA}}</td>
                  </ng-container>

                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>Status</th>
                    <td mat-cell *matCellDef="let student">
                      <mat-chip [class.active]="student.status === 'ACTIVE'">
                        {{student.status}}
                      </mat-chip>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef>Actions</th>
                    <td mat-cell *matCellDef="let student">
                      <button mat-button color="primary" (click)="viewStudent(student)">
                        <mat-icon>visibility</mat-icon>
                        View
                      </button>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="studentColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: studentColumns;"></tr>
                </table>
              </div>

              <ng-template #noStudents>
                <div class="empty-state">
                  <mat-icon>people_outline</mat-icon>
                  <h3>No Students Found</h3>
                  <p>No students in this department</p>
                </div>
              </ng-template>
            </div>
          </mat-tab>

          <!-- Create Record Tab -->
          <mat-tab label="Create Academic Record">
            <div class="tab-content">
              <div class="form-container">
                <h2>Create New Academic Record</h2>
                
                <form #recordForm="ngForm" (ngSubmit)="createRecord()">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Student Roll Number</mat-label>
                    <input matInput [(ngModel)]="newRecord.studentId" name="studentId" required>
                    <mat-hint>Enter the student's roll number</mat-hint>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Semester</mat-label>
                    <mat-select [(ngModel)]="newRecord.semester" name="semester" required>
                      <mat-option *ngFor="let sem of [1,2,3,4,5,6,7,8]" [value]="sem">
                        Semester {{sem}}
                      </mat-option>
                    </mat-select>
                  </mat-form-field>

                  <h3>Courses</h3>
                  <div *ngIf="availableCourses.length === 0" class="info-message">
                    <mat-icon>info</mat-icon>
                    <p>No courses available. Please create courses first in the Admin Dashboard.</p>
                  </div>
                  
                  <div *ngFor="let course of newRecord.courses; let i = index" class="course-row-extended">
                    <mat-form-field appearance="outline" class="course-select">
                      <mat-label>Select Course</mat-label>
                      <mat-select [(ngModel)]="course.offeringId" [name]="'offering-'+i" required (selectionChange)="onCourseSelect(i, $event.value)">
                        <mat-option *ngFor="let offering of availableCourses" [value]="offering.offeringId">
                          {{offering.courseCode}} - {{offering.courseName}} ({{offering.credits}} credits)
                        </mat-option>
                      </mat-select>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Course Code</mat-label>
                      <input matInput [(ngModel)]="course.courseCode" [name]="'code-'+i" required readonly>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Credits</mat-label>
                      <input matInput type="number" [(ngModel)]="course.credits" [name]="'credits-'+i" required readonly>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Grade</mat-label>
                      <mat-select [(ngModel)]="course.grade" [name]="'grade-'+i" required>
                        <mat-option value="S">S (Outstanding)</mat-option>
                        <mat-option value="A">A (Excellent)</mat-option>
                        <mat-option value="B">B (Very Good)</mat-option>
                        <mat-option value="C">C (Good)</mat-option>
                        <mat-option value="D">D (Satisfactory)</mat-option>
                        <mat-option value="P">P (Pass)</mat-option>
                        <mat-option value="U">U (Fail)</mat-option>
                        <mat-option value="R">R (Repeat)</mat-option>
                      </mat-select>
                    </mat-form-field>

                    <button mat-icon-button color="warn" type="button" (click)="removeCourse(i)">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>

                  <button mat-button color="accent" type="button" (click)="addCourse()" class="add-course-btn" [disabled]="availableCourses.length === 0">
                    <mat-icon>add</mat-icon>
                    Add Course
                  </button>

                  <div class="form-actions">
                    <button mat-raised-button color="primary" type="submit" [disabled]="!recordForm.valid">
                      <mat-icon>save</mat-icon>
                      Create Record
                    </button>
                    <button mat-button type="button" (click)="resetForm()">
                      Clear Form
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </mat-tab>

          <!-- Department Records Tab -->
          <mat-tab label="Department Records">
            <div class="tab-content">
              <div class="tab-header">
                <h2>All Records</h2>
                <button mat-raised-button color="primary" (click)="refreshRecords()">
                  <mat-icon>refresh</mat-icon>
                  Refresh
                </button>
              </div>

              <div *ngIf="records.length === 0" class="empty-state">
                <mat-icon>assignment</mat-icon>
                <p>No academic records found</p>
              </div>

              <table mat-table [dataSource]="records" class="records-table" *ngIf="records.length > 0">
                <!-- Record ID Column -->
                <ng-container matColumnDef="recordId">
                  <th mat-header-cell *matHeaderCellDef>Record ID</th>
                  <td mat-cell *matCellDef="let record">{{ record.recordId }}</td>
                </ng-container>

                <!-- Roll Number Column -->
                <ng-container matColumnDef="rollNumber">
                  <th mat-header-cell *matHeaderCellDef>Student Roll No</th>
                  <td mat-cell *matCellDef="let record">{{ record.studentId }}</td>
                </ng-container>

                <!-- Semester Column -->
                <ng-container matColumnDef="semester">
                  <th mat-header-cell *matHeaderCellDef>Semester</th>
                  <td mat-cell *matCellDef="let record">{{ record.semester }}</td>
                </ng-container>

                <!-- Year Column -->
                <ng-container matColumnDef="year">
                  <th mat-header-cell *matHeaderCellDef>Year</th>
                  <td mat-cell *matCellDef="let record">{{ record.year }}</td>
                </ng-container>

                <!-- Total Credits Column -->
                <ng-container matColumnDef="totalCredits">
                  <th mat-header-cell *matHeaderCellDef>Total Credits</th>
                  <td mat-cell *matCellDef="let record">{{ record.totalCredits }}</td>
                </ng-container>

                <!-- CGPA Column -->
                <ng-container matColumnDef="cgpa">
                  <th mat-header-cell *matHeaderCellDef>CGPA</th>
                  <td mat-cell *matCellDef="let record">{{ record.cgpa || 'N/A' }}</td>
                </ng-container>

                <!-- Status Column -->
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let record">
                    <span class="status-badge" [class.approved]="record.status === 'APPROVED'" [class.pending]="record.status === 'SUBMITTED'">
                      {{ record.status === 'APPROVED' ? 'Approved' : record.status === 'SUBMITTED' ? 'Pending' : record.status }}
                    </span>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="recordColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: recordColumns;"></tr>
              </table>
            </div>
          </mat-tab>
        </mat-tab-group>
      </mat-card>
    </div>
  `,
  styles: [`
    /* Container & Background */
    .dashboard-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 30px 20px;
      position: relative;
      overflow-x: hidden;
    }

    /* Animated Background */
    .bg-shapes {
      position: fixed;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      overflow: hidden;
      z-index: 0;
      pointer-events: none;
    }

    .shape {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.08);
      animation: float 25s infinite ease-in-out;
    }

    .shape-1 {
      width: 400px;
      height: 400px;
      top: -150px;
      left: 10%;
      animation-delay: 0s;
    }

    .shape-2 {
      width: 250px;
      height: 250px;
      bottom: -100px;
      right: 15%;
      animation-delay: 8s;
    }

    .shape-3 {
      width: 180px;
      height: 180px;
      top: 50%;
      right: 8%;
      animation-delay: 16s;
    }

    @keyframes float {
      0%, 100% { transform: translate(0, 0) rotate(0deg); }
      33% { transform: translate(40px, -40px) rotate(120deg); }
      66% { transform: translate(-30px, 30px) rotate(240deg); }
    }

    /* Header */
    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 40px;
      position: relative;
      z-index: 1;
      flex-wrap: wrap;
      gap: 20px;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .logo-wrapper {
      width: 80px;
      height: 80px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(10px);
      border: 2px solid rgba(255, 255, 255, 0.3);
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(255, 255, 255, 0.3); }
      50% { transform: scale(1.05); box-shadow: 0 0 30px rgba(255, 255, 255, 0.5); }
    }

    .dashboard-icon {
      font-size: 3rem !important;
      width: 3rem !important;
      height: 3rem !important;
      color: white;
    }

    .header-text h1 {
      margin: 0;
      font-size: 2.5rem;
      color: white;
      font-weight: 800;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
      letter-spacing: -0.5px;
    }

    .welcome-text {
      margin: 8px 0 0 0;
      color: white;
      font-size: 1.1rem;
      display: flex;
      align-items: center;
      gap: 8px;
      opacity: 0.95;
    }

    .welcome-icon {
      font-size: 1.3rem !important;
      width: 1.3rem !important;
      height: 1.3rem !important;
    }

    .user-name {
      font-weight: 600;
      color: #fff;
    }

    .logout-btn {
      background: rgba(244, 67, 54, 0.9) !important;
      color: white !important;
      border-radius: 12px !important;
      padding: 0 24px !important;
      height: 48px !important;
      font-weight: 600 !important;
      box-shadow: 0 4px 16px rgba(244, 67, 54, 0.3) !important;
      transition: all 0.3s ease !important;
    }

    .logout-btn:hover {
      background: rgba(211, 47, 47, 1) !important;
      box-shadow: 0 6px 20px rgba(244, 67, 54, 0.4) !important;
      transform: translateY(-2px);
    }

    /* Content Card */
    .content-card {\n      margin-bottom: 30px;\n      border-radius: 24px !important;\n      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15) !important;\n      overflow: hidden;\n      position: relative;\n      z-index: 1;\n      background: white !important;\n    }\n\n    /* Tab Styles */\n    ::ng-deep .mat-mdc-tab-group {\n      background: transparent !important;\n    }\n\n    ::ng-deep .mat-mdc-tab-header {\n      background: linear-gradient(to bottom, #f8f9fa, white) !important;\n      border-bottom: 2px solid #e0e0e0;\n    }\n\n    ::ng-deep .mat-mdc-tab .mdc-tab__text-label {\n      font-weight: 600 !important;\n      font-size: 1rem !important;\n    }\n\n    ::ng-deep .mat-mdc-tab.mdc-tab--active .mdc-tab__text-label {\n      color: #667eea !important;\n    }\n\n    ::ng-deep .mat-mdc-tab-body-content {\n      overflow-x: hidden;\n    }\n\n    .tab-content {\n      padding: 32px;\n    }\n\n    .tab-header {\n      display: flex;\n      justify-content: space-between;\n      align-items: center;\n      margin-bottom: 28px;\n      flex-wrap: wrap;\n      gap: 16px;\n    }\n\n    .tab-header h2 {\n      margin: 0;\n      font-size: 1.8rem;\n      font-weight: 700;\n      color: #1a1a1a;\n    }\n\n    /* Tables */\n    .table-container {\n      overflow-x: auto;\n      border-radius: 16px;\n      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);\n      background: white;\n      margin-top: 20px;\n    }\n\n    .students-table, .records-table {\n      width: 100%;\n    }\n\n    ::ng-deep .mat-mdc-table {\n      background: white !important;\n    }\n\n    ::ng-deep .mat-mdc-header-row {\n      background: linear-gradient(to right, #f8f9fa, #f0f0f0) !important;\n    }\n\n    ::ng-deep .mat-mdc-header-cell {\n      font-weight: 700 !important;\n      font-size: 0.9rem !important;\n      color: #1a1a1a !important;\n      text-transform: uppercase;\n      letter-spacing: 0.5px;\n    }\n\n    ::ng-deep .mat-mdc-cell {\n      font-size: 0.95rem;\n      color: #333;\n    }\n\n    ::ng-deep .mat-mdc-row:hover {\n      background: #f8f9fa !important;\n    }\n\n    /* Chips */\n    mat-chip {\n      font-size: 0.8rem !important;\n      font-weight: 600 !important;\n      border-radius: 12px !important;\n    }\n\n    mat-chip.active {\n      background-color: #C8E6C9 !important;\n      color: #2E7D32 !important;\n    }\n\n    .status-badge {\n      display: inline-block;\n      padding: 6px 16px;\n      border-radius: 12px;\n      font-size: 0.8rem;\n      font-weight: 600;\n    }\n\n    .status-badge.approved {\n      background: #C8E6C9;\n      color: #2E7D32;\n    }\n\n    .status-badge.pending {\n      background: #FFF3E0;\n      color: #F57C00;\n    }\n\n    /* Forms */\n    .form-container {\n      max-width: 900px;\n      margin: 0 auto;\n    }\n\n    .form-container h2 {\n      margin: 0 0 24px 0;\n      font-size: 1.8rem;\n      font-weight: 700;\n      color: #1a1a1a;\n    }\n\n    .form-container h3 {\n      margin: 32px 0 20px 0;\n      font-size: 1.3rem;\n      font-weight: 600;\n      color: #1a1a1a;\n      display: flex;\n      align-items: center;\n      gap: 12px;\n    }\n\n    .full-width {\n      width: 100%;\n      margin-bottom: 20px;\n    }\n\n    .course-row, .course-row-extended {\n      display: grid;\n      gap: 12px;\n      margin-bottom: 16px;\n      padding: 20px;\n      background: #f8f9fa;\n      border-radius: 12px;\n      align-items: start;\n      border: 2px solid #e0e0e0;\n      transition: all 0.3s ease;\n    }\n\n    .course-row:hover, .course-row-extended:hover {\n      border-color: #667eea;\n      background: #f5f7ff;\n    }\n\n    .course-row {\n      grid-template-columns: 1fr 2fr 1fr 1fr auto;\n    }\n\n    .course-row-extended {\n      grid-template-columns: 2fr 1fr 1fr 1fr auto;\n    }\n\n    .course-select {\n      min-width: 250px;\n    }\n\n    .info-message {\n      display: flex;\n      align-items: center;\n      gap: 12px;\n      padding: 20px;\n      background: linear-gradient(135deg, #E3F2FD, #BBDEFB);\n      border-radius: 12px;\n      margin: 16px 0;\n      border-left: 4px solid #1976D2;\n    }\n\n    .info-message mat-icon {\n      color: #1976D2;\n      font-size: 1.5rem !important;\n      width: 1.5rem !important;\n      height: 1.5rem !important;\n    }\n\n    .info-message p {\n      margin: 0;\n      color: #0D47A1;\n      font-weight: 500;\n    }\n\n    .add-course-btn {\n      margin: 16px 0 24px 0;\n      border-radius: 12px !important;\n      font-weight: 600 !important;\n    }\n\n    .form-actions {\n      display: flex;\n      gap: 12px;\n      margin-top: 32px;\n      padding-top: 24px;\n      border-top: 2px solid #e0e0e0;\n    }\n\n    .form-actions button {\n      height: 48px !important;\n      font-weight: 600 !important;\n      border-radius: 12px !important;\n    }\n\n    .form-actions button[color=\"primary\"] {\n      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3) !important;\n    }\n\n    .form-actions button[color=\"primary\"]:hover:not(:disabled) {\n      box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4) !important;\n      transform: translateY(-2px);\n    }\n\n    /* Empty State */\n    .empty-state {\n      text-align: center;\n      padding: 80px 20px;\n      background: linear-gradient(135deg, #f8f9fa, #f0f0f0);\n      border-radius: 16px;\n      margin: 20px 0;\n    }\n\n    .empty-state mat-icon {\n      font-size: 5rem !important;\n      width: 5rem !important;\n      height: 5rem !important;\n      color: #ccc;\n      margin-bottom: 20px;\n    }\n\n    .empty-state h3 {\n      margin: 0 0 12px 0;\n      color: #666;\n      font-size: 1.5rem;\n      font-weight: 600;\n    }\n\n    .empty-state p {\n      color: #999;\n      font-size: 1rem;\n      margin: 0;\n    }\n\n    /* Responsive */\n    @media (max-width: 768px) {\n      .dashboard-container {\n        padding: 16px;\n      }\n\n      .header-text h1 {\n        font-size: 1.8rem;\n      }\n\n      .tab-content {\n        padding: 20px;\n      }\n\n      .course-row, .course-row-extended {\n        grid-template-columns: 1fr;\n      }\n\n      .form-container {\n        max-width: 100%;\n      }\n    }\n  `]
})
export class DepartmentDashboardComponent implements OnInit {
  students: Student[] = [];
  records: any[] = [];
  availableCourses: any[] = []; // Loaded from blockchain
  studentColumns = ['rollNumber', 'name', 'year', 'cgpa', 'status', 'actions'];
  recordColumns = ['recordId', 'rollNumber', 'semester', 'year', 'totalCredits', 'cgpa', 'status'];
  currentUser = this.authService.currentUser;
  
  newRecord: any = {
    recordId: '',
    studentId: '',
    semester: 1,
    department: this.currentUser?.department || 'CSE',
    courses: []
  };

  constructor(
    private authService: AuthService,
    private blockchainService: BlockchainService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadStudents();
    this.loadAvailableCourses();
    this.loadRecords();
    this.addCourse(); // Add first course by default
  }

  loadStudents(): void {
    const dept = this.currentUser?.department || 'CSE';
    this.blockchainService.getStudentsByDepartment(dept).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.students = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading students:', error);
        this.students = [];
      }
    });
  }

  loadAvailableCourses(): void {
    const dept = this.currentUser?.department || 'CSE';
    this.blockchainService.getDepartmentCourses(dept).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.availableCourses = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading courses:', error);
        this.availableCourses = [];
      }
    });
  }

  refreshStudents(): void {
    this.loadStudents();
  }

  refreshRecords(): void {
    this.loadRecords();
  }

  loadRecords(): void {
    const department = this.currentUser?.department;
    console.log('Loading records for department:', department);
    if (!department) return;

    this.blockchainService.getDepartmentRecords(department).subscribe({
      next: (response) => {
        console.log('Records API response:', response);
        if (response.success && response.data) {
          // Show all records
          this.records = response.data;
          console.log('Loaded records:', this.records);
        } else {
          console.log('No records in response');
          this.records = [];
        }
      },
      error: (error) => {
        console.error('Error loading records:', error);
        this.records = [];
      }
    });
  }

  addCourse(): void {
    this.newRecord.courses.push({
      offeringId: '',
      courseCode: '',
      courseName: '',
      credits: 4,
      grade: 'A',
      department: this.currentUser?.department
    });
  }

  onCourseSelect(index: number, offeringId: string): void {
    const selectedCourse = this.availableCourses.find(c => c.offeringId === offeringId);
    if (selectedCourse) {
      this.newRecord.courses[index].courseCode = selectedCourse.courseCode;
      this.newRecord.courses[index].courseName = selectedCourse.courseName;
      this.newRecord.courses[index].credits = selectedCourse.credits;
      this.newRecord.courses[index].department = selectedCourse.departmentId;
    }
  }

  removeCourse(index: number): void {
    this.newRecord.courses.splice(index, 1);
  }

  createRecord(): void {
    // Validate form
    if (!this.newRecord.studentId || this.newRecord.courses.length === 0) {
      this.dialog.open(ConfirmDialogComponent, {
        width: '450px',
        data: {
          type: 'warning',
          title: 'Validation Error',
          message: 'Please fill in all required fields and add at least one course',
          confirmText: 'OK',
          confirmIcon: 'check',
          confirmColor: 'primary'
        }
      });
      return;
    }

    // Validate all courses have required fields
    for (let i = 0; i < this.newRecord.courses.length; i++) {
      const course = this.newRecord.courses[i];
      if (!course.courseCode || !course.courseName || !course.grade) {
        this.dialog.open(ConfirmDialogComponent, {
          width: '450px',
          data: {
            type: 'warning',
            title: 'Incomplete Course',
            message: `Course ${i + 1} is incomplete. Please select a course and enter a grade.`,
            confirmText: 'OK',
            confirmIcon: 'check',
            confirmColor: 'primary'
          }
        });
        return;
      }
    }

    // Calculate total credits
    const totalCredits = this.newRecord.courses.reduce((sum: number, course: any) => sum + (course.credits || 0), 0);
    
    // Validate credits range (16-30 per semester as per chaincode validation)
    if (totalCredits < 16 || totalCredits > 30) {
      this.dialog.open(ConfirmDialogComponent, {
        width: '450px',
        data: {
          type: 'warning',
          title: 'Invalid Credits',
          message: `Total credits must be between 16 and 30 per semester. Current total: ${totalCredits} credits. Please add more courses or adjust credit values.`,
          confirmText: 'OK',
          confirmIcon: 'check',
          confirmColor: 'primary'
        }
      });
      return;
    }

    // Auto-generate recordID: DEPT-ROLLNUMBER-SEMESTER-YEAR
    const year = new Date().getFullYear();
    const recordId = `${this.currentUser?.department}-${this.newRecord.studentId}-SEM${this.newRecord.semester}-${year}`;
    
    const recordData = {
      recordID: recordId,
      rollNumber: this.newRecord.studentId,
      semester: this.newRecord.semester,
      year: year.toString(),
      department: this.currentUser?.department || 'CSE',
      courses: this.newRecord.courses
    };

    console.log('Sending record data:', recordData);

    this.blockchainService.createDepartmentRecord(recordData).subscribe({
      next: (response) => {
        if (response.success) {
          this.dialog.open(ConfirmDialogComponent, {
            width: '500px',
            data: {
              type: 'success',
              title: 'Record Created Successfully!',
              message: 'The academic record has been successfully created on the blockchain.',
              details: [
                { icon: 'badge', label: 'Record ID', value: recordId },
                { icon: 'person', label: 'Student', value: this.newRecord.studentId },
                { icon: 'book', label: 'Semester', value: this.newRecord.semester },
                { icon: 'school', label: 'Courses', value: this.newRecord.courses.length },
                { icon: 'grade', label: 'Total Credits', value: totalCredits }
              ],
              confirmText: 'Done',
              confirmIcon: 'check_circle',
              confirmColor: 'primary'
            }
          });
          this.resetForm();
        }
      },
      error: (error) => {
        console.error('Error creating record:', error);
        this.dialog.open(ConfirmDialogComponent, {
          width: '500px',
          data: {
            type: 'error',
            title: 'Error Creating Record',
            message: error.error?.message || error.message || 'Failed to create academic record',
            confirmText: 'OK',
            confirmIcon: 'close',
            confirmColor: 'warn'
          }
        });
      }
    });
  }

  resetForm(): void {
    this.newRecord = {
      studentId: '',
      semester: 1,
      department: this.currentUser?.department || 'CSE',
      courses: []
    };
    this.addCourse();
  }

  viewStudent(student: Student): void {
    // Navigate to student detail page (department route)
    this.router.navigate(['/department/students', student.rollNumber]);
  }

  logout(): void {
    this.authService.logout();
  }
}

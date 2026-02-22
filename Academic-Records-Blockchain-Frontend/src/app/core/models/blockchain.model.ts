// Blockchain Data Models
export interface Student {
  studentId: string;
  name: string;
  department: string;
  enrollmentYear: number;
  rollNumber: string;
  email: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  program?: string;
  expectedGraduation?: string;
  admissionCategory: string;
  status: 'ACTIVE' | 'GRADUATED' | 'WITHDRAWN' | 'CANCELLED' | 'TEMPORARY_WITHDRAWAL';
  totalCreditsEarned: number;
  completedCredits?: number;
  currentCGPA: number;
  createdBy: string;
  createdAt: string;
  modifiedBy: string;
  modifiedAt: string;
}

export interface Course {
  courseCode: string;
  courseName: string;
  credits: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'P' | 'U' | 'R';
  department?: string;
}

export interface AcademicRecord {
  recordId: string;
  studentId: string;
  department: string;
  semester: number;
  year?: string;
  courses: Course[];
  totalCredits: number;
  sgpa: number;
  cgpa: number;
  timestamp: string;
  submittedBy: string;
  submissionDate?: string;
  approvedBy?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED';
  rejectionNote?: string;
}

export interface Certificate {
  certificateId: string;
  studentId: string;
  type: 'DEGREE' | 'TRANSCRIPT' | 'PROVISIONAL' | 'BONAFIDE' | 'MIGRATION' | 'CHARACTER' | 'STUDY_CONDUCT';
  degreeAwarded?: string;
  finalCGPA?: number;
  issueDate: string;
  expiryDate?: string;
  pdfHash: string;
  ipfsHash: string;
  issuedBy: string;
  verified: boolean;
  isValid?: boolean;
  revoked: boolean;
  revokedBy?: string;
  revokedAt?: string;
  revocationReason?: string;
  // Additional fields populated from student data
  studentName?: string;
  rollNumber?: string;
  department?: string;
  recordId?: string;   // blockchain record ID the cert was generated from
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  pendingRecords: number;
  certificatesIssued: number;
}

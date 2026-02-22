import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  Student,
  AcademicRecord,
  Certificate,
  ApiResponse,
  DashboardStats
} from '../models/blockchain.model';
import { APP_CONFIG } from '../config/app.config';

@Injectable({
  providedIn: 'root'
})
export class BlockchainService {
  private apiUrl = APP_CONFIG.api.baseUrl;

  constructor(private http: HttpClient) { }

  // ============ Student APIs ============

  createStudent(studentData: any): Observable<ApiResponse<Student>> {
    return this.http.post<ApiResponse<Student>>(`${this.apiUrl}/students`, studentData);
  }

  getStudent(rollNumber: string): Observable<ApiResponse<Student>> {
    return this.http.get<ApiResponse<Student>>(`${this.apiUrl}/students/${rollNumber}`);
  }

  // Alias for getStudent to match verifier usage
  getStudentByRollNumber(rollNumber: string): Observable<ApiResponse<Student>> {
    return this.getStudent(rollNumber);
  }

  getAllStudents(): Observable<ApiResponse<Student[]>> {
    return this.http.get<ApiResponse<Student[]>>(`${this.apiUrl}/students/all`);
  }

  getStudentsByStatus(status: string): Observable<ApiResponse<Student[]>> {
    return this.http.get<ApiResponse<Student[]>>(`${this.apiUrl}/students/status/${status}`);
  }

  updateStudentStatus(rollNumber: string, newStatus: string, reason?: string): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.apiUrl}/students/${rollNumber}/status`, {
      newStatus,
      reason
    });
  }

  updateStudentDepartment(rollNumber: string, newDepartment: string): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.apiUrl}/students/${rollNumber}/department`, {
      newDepartment
    });
  }

  // ============ Department & Course APIs ============

  getStudentsByDepartment(department: string): Observable<ApiResponse<Student[]>> {
    return this.http.get<ApiResponse<Student[]>>(`${this.apiUrl}/department/${department}/students`);
  }

  getDepartmentCourses(departmentId: string): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/department/${departmentId}/courses`);
  }

  createDepartmentRecord(recordData: any): Observable<ApiResponse<AcademicRecord>> {
    return this.http.post<ApiResponse<AcademicRecord>>(`${this.apiUrl}/department/records`, recordData);
  }

  getDepartmentRecords(departmentId: string): Observable<ApiResponse<AcademicRecord[]>> {
    return this.http.get<ApiResponse<AcademicRecord[]>>(`${this.apiUrl}/department/records/${departmentId}`);
  }

  approveDepartmentRecord(recordId: string): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.apiUrl}/department/records/${recordId}/status`, {});
  }

  // ============ Academic Record APIs ============

  createAcademicRecord(recordData: any): Observable<ApiResponse<AcademicRecord>> {
    return this.http.post<ApiResponse<AcademicRecord>>(`${this.apiUrl}/records`, recordData);
  }

  getAcademicRecord(recordID: string): Observable<ApiResponse<AcademicRecord>> {
    return this.http.get<ApiResponse<AcademicRecord>>(`${this.apiUrl}/records/${recordID}`);
  }

  getStudentRecords(rollNumber: string): Observable<ApiResponse<AcademicRecord[]>> {
    return this.http.get<ApiResponse<AcademicRecord[]>>(`${this.apiUrl}/records/student/${rollNumber}`);
  }

  getPendingRecords(): Observable<ApiResponse<AcademicRecord[]>> {
    return this.http.get<ApiResponse<AcademicRecord[]>>(`${this.apiUrl}/records/pending/all`);
  }

  getRecordsByDepartment(department: string): Observable<ApiResponse<AcademicRecord[]>> {
    return this.http.get<ApiResponse<AcademicRecord[]>>(`${this.apiUrl}/records/department/${department}`);
  }

  approveAcademicRecord(recordID: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/records/${recordID}/approve`, {});
  }

  // ============ Certificate APIs ============

  issueCertificate(certData: any): Observable<ApiResponse<Certificate>> {
    return this.http.post<ApiResponse<Certificate>>(`${this.apiUrl}/certificates`, certData);
  }

  getCertificate(certificateID: string): Observable<ApiResponse<Certificate>> {
    return this.http.get<ApiResponse<Certificate>>(`${this.apiUrl}/certificates/${certificateID}`);
  }

  getStudentCertificates(studentID: string): Observable<ApiResponse<Certificate[]>> {
    return this.http.get<ApiResponse<Certificate[]>>(`${this.apiUrl}/certificates/student/${studentID}`);
  }

  verifyCertificate(certificateID: string, pdfHash: string): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/certificates/verify`, {
      certificateID,
      pdfHash
    });
  }

  revokeCertificate(certificateID: string, reason: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/certificates/${certificateID}/revoke`, {
      reason
    });
  }

  // ============ Dashboard Stats ============

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<{ success: boolean; data: DashboardStats }>(`${this.apiUrl}/stats/dashboard`)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error fetching dashboard stats:', error);
          // Return default stats on error
          return of({
            totalStudents: 0,
            activeStudents: 0,
            pendingRecords: 0,
            certificatesIssued: 0
          });
        })
      );
  }

  // ============ Approval Workflow APIs ============

  submitForApproval(recordId: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/approval/submit/${recordId}`, {});
  }

  facultyApprove(recordId: string, comment: string = ''): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/approval/faculty/${recordId}`, { comment });
  }

  hodApprove(recordId: string, comment: string = ''): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/approval/hod/${recordId}`, { comment });
  }

  dacApprove(recordId: string, comment: string = '', memberRole: string = 'dac_member'): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/approval/dac/${recordId}`, { comment, memberRole });
  }

  examSectionApprove(recordId: string, comment: string = ''): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/approval/examsection/${recordId}`, { comment });
  }

  deanApprove(recordId: string, comment: string = ''): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/approval/dean/${recordId}`, { comment });
  }

  rejectRecord(recordId: string, reason: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/approval/reject/${recordId}`, { reason });
  }

  getApprovalStatus(recordId: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/approval/status/${recordId}`);
  }

  getApprovalQueue(status: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/approval/queue/${status}`);
  }

  // ============ Document Upload / Verification APIs ============

  uploadDocument(formData: FormData): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/documents/upload`, formData);
  }

  verifyDocumentByUpload(formData: FormData): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/documents/verify`, formData);
  }

  verifyDocumentByHash(hash: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/documents/verify/${hash}`);
  }

  getStudentDocuments(studentId: string): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/documents/student/${studentId}`);
  }

  // ============ Semester Registration APIs ============

  registerForSemester(data: { studentId: string; semester: number; academicYear: string; facultyAdvisor?: string }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/semester/register`, data);
  }

  getStudentSemesters(studentId: string): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/semester/student/${studentId}`);
  }
}

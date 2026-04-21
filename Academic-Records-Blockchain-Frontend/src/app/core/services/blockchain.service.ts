import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
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

  verifyCertificateByFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.apiUrl}/certificates/verify`, formData);
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

  /** Admin Final Approval — last step (DEAN_APPROVED → ADMIN_FINALIZED).
   *  Only callable by admin role on NITWarangalMSP machine (Node 04).
   *  Finalizes CGPA and emits RecordFinalized event. */
  adminFinalApprove(recordId: string, comment: string = ''): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/approval/admin-final/${recordId}`, { comment });
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

  /** SLA Breach Check — returns records where 72hr approval deadline was exceeded */
  checkSLABreach(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/approval/sla-breached`);
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

  // ============ COURSES (Req #1, #6) ============

  getCourses(filters?: any): Observable<any> {
    const params = new URLSearchParams();
    if (filters) Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, String(v)); });
    const q = params.toString() ? `?${params.toString()}` : '';
    return this.http.get<any>(`${this.apiUrl}/courses${q}`);
  }

  getCoursesByDepartment(dept: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/courses/department/${dept}`);
  }

  createCourse(payload: { code: string; name: string; department: string; semester: number; credits?: number }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/courses`, payload);
  }

  updateCourse(id: string, payload: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/courses/${id}`, payload);
  }

  deleteCourse(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/courses/${id}`);
  }

  assignFacultyToCourse(courseId: string, facultyUsername: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/courses/${courseId}/assign`, { facultyUsername });
  }

  enrollInCourse(courseId: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/courses/${courseId}/enroll`, {});
  }

  unenrollFromCourse(courseId: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/courses/${courseId}/unenroll`, {});
  }

  // ============ MARKS APPROVAL CHAIN (Req #2, #3, #8, #10-13) ============

  getMarks(filters?: { studentId?: string; semester?: number; courseCode?: string; status?: string; department?: string }): Observable<any> {
    const params = new URLSearchParams();
    if (filters) Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== null) params.set(k, String(v)); });
    const q = params.toString() ? `?${params.toString()}` : '';
    return this.http.get<any>(`${this.apiUrl}/marks${q}`);
  }

  uploadMarks(payload: { studentId: string; courseCode: string; semester?: number; internal?: number; external?: number; marksObtained?: number; maxMarks?: number; proposedGrade?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/marks/upload`, payload);
  }

  submitMarks(markId: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/marks/${markId}/submit`, {});
  }

  hodApproveMarks(markId: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/marks/${markId}/hod-approve`, {});
  }

  examApproveMarks(markId: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/marks/${markId}/exam-approve`, {});
  }

  deanApproveMarks(markId: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/marks/${markId}/dean-approve`, {});
  }

  adminFinalizeMarks(markId: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/marks/${markId}/admin-finalize`, {});
  }

  rejectMarks(markId: string, reason: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/marks/${markId}/reject`, { reason });
  }

  lockSemester(dept: string, semester: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/marks/semester/${dept}/${semester}/lock`, {});
  }

  // ============ DOCUMENT REQUESTS (Req #17, #19) ============

  requestDocument(payload: { type: string; studentId: string; semester?: number; reason?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/documents/request`, payload);
  }

  getDocumentRequests(filters?: { studentId?: string; type?: string; status?: string }): Observable<any> {
    const params = new URLSearchParams();
    if (filters) Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, String(v)); });
    const q = params.toString() ? `?${params.toString()}` : '';

    // Fetch both pipelines and merge natively
    return forkJoin({
      docs: this.http.get<any>(`${this.apiUrl}/documents/requests${q}`).pipe(catchError(() => of([]))),
      certs: this.http.get<any>(`${this.apiUrl}/certificates/requests`).pipe(catchError(() => of([])))
    }).pipe(
      map(results => {
        const d = Array.isArray(results.docs) ? results.docs : (results.docs?.data || []);
        let c = Array.isArray(results.certs) ? results.certs : (results.certs?.data || []);

        // Manual filter for legacy certs since backend doesn't support query params stringently
        if (filters?.status) c = c.filter((x: any) => x.status?.toLowerCase() === filters.status?.toLowerCase());
        if (filters?.studentId) c = c.filter((x: any) => x.studentId === filters.studentId);

        return [
          ...d,
          ...c.map((r: any) => ({ ...r, id: r.requestId || r.id, type: r.certificateType || r.type, reason: r.purpose || r.reason }))
        ];
      })
    );
  }

  approveDocumentRequest(requestId: string): Observable<any> {
    if (requestId.startsWith('REQ-')) {
      return this.http.put<any>(`${this.apiUrl}/certificates/requests/${requestId}`, { status: 'APPROVED' });
    }
    return this.http.put<any>(`${this.apiUrl}/documents/requests/${requestId}/approve`, {});
  }

  rejectDocumentRequest(requestId: string, reason: string): Observable<any> {
    if (requestId.startsWith('REQ-')) {
      return this.http.put<any>(`${this.apiUrl}/certificates/requests/${requestId}`, { status: 'REJECTED' });
    }
    return this.http.put<any>(`${this.apiUrl}/documents/requests/${requestId}/reject`, { reason });
  }

  raiseCorrectionRequest(payload: { recordId: string; recordType: string; description: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/documents/corrections`, payload);
  }

  // ============ VERIFIER (Req #18, #21) ============

  verifyDocumentHash(hash: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/documents/verify/${hash}`);
  }

  verifySignature(payload: { documentId: string; signature: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/documents/verify`, payload);
  }

  // ============ STUDENT ENROLLMENT APPROVAL (Req #16) ============

  getPendingStudents(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/auth/users?role=student&active=false`);
  }

  approveStudentEnrollment(userId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/users/${userId}/approve`, {});
  }
}

// ============================================================
// blockchain.service.ts  — ADDITIONS ONLY
// Add these methods to your existing BlockchainService class.
// CHANGED: added course management, marks upload/approval,
//          semester lock, document request, verifier calls.
// The existing methods are NOT repeated here — only new ones.
// ============================================================

// ── Add to imports at top of file ────────────────────────────
// (HttpClient, HttpHeaders should already be imported)

// ── Paste inside the BlockchainService class body ─────────────

  // =============================================================
  // COURSES  (Req #6)
  // =============================================================

  getCourses(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/courses`, {
      headers: this.getAuthHeaders(),
    });
  }

  getCoursesByDepartment(dept: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/courses/department/${dept}`, {
      headers: this.getAuthHeaders(),
    });
  }

  createCourse(payload: {
    code: string; name: string; department: string;
    semester: number; credits?: number;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/courses`, payload, {
      headers: this.getAuthHeaders(),
    });
  }

  updateCourse(id: string, payload: Partial<{
    name: string; credits: number; maxMarks: number; semester: number;
  }>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/courses/${id}`, payload, {
      headers: this.getAuthHeaders(),
    });
  }

  deleteCourse(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/courses/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }

  /** HOD/Admin: assign a faculty member to a course */
  assignFacultyToCourse(courseId: string, facultyUsername: string): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/courses/${courseId}/assign`,
      { facultyUsername },
      { headers: this.getAuthHeaders() }
    );
  }

  /** Faculty: self-enroll into a course */
  enrollInCourse(courseId: string): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/courses/${courseId}/enroll`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  /** Faculty: self-unenroll from a course */
  unenrollFromCourse(courseId: string): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/courses/${courseId}/unenroll`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  // =============================================================
  // MARKS  (Req #2, #3, #8, #10, #11, #12)
  // =============================================================

  getMarks(filters?: {
    studentId?: string; semester?: number;
    courseCode?: string; status?: string; department?: string;
  }): Observable<any[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null) params.set(k, String(v));
      });
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.http.get<any[]>(`${this.apiUrl}/marks${query}`, {
      headers: this.getAuthHeaders(),
    });
  }

  uploadMarks(payload: {
    studentId: string; courseCode: string; semester: number;
    internal: number; external?: number; proposedGrade?: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/marks/upload`, payload, {
      headers: this.getAuthHeaders(),
    });
  }

  submitMarks(markId: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/marks/${markId}/submit`, {}, {
      headers: this.getAuthHeaders(),
    });
  }

  hodApproveMarks(markId: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/marks/${markId}/hod-approve`, {}, {
      headers: this.getAuthHeaders(),
    });
  }

  examApproveMarks(markId: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/marks/${markId}/exam-approve`, {}, {
      headers: this.getAuthHeaders(),
    });
  }

  rejectMarks(markId: string, reason: string): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/marks/${markId}/reject`,
      { reason },
      { headers: this.getAuthHeaders() }
    );
  }

  lockSemester(dept: string, semester: number): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/marks/semester/${dept}/${semester}/lock`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  // =============================================================
  // DOCUMENT REQUESTS  (Req #17, #19 workflows)
  // These call the existing chaincode certificate/document endpoints
  // =============================================================

  /** Student requests a document (consolidated marksheet, degree cert, etc.) */
  requestDocument(payload: {
    type: 'CONSOLIDATED_MARKSHEET' | 'DEGREE_CERTIFICATE' |
          'TRANSFER_CERTIFICATE' | 'MIGRATION_CERTIFICATE' | 'BONAFIDE_CERTIFICATE';
    studentId: string;
    semester?: number;
    reason?: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/documents/request`, payload, {
      headers: this.getAuthHeaders(),
    });
  }

  getDocumentRequests(filters?: {
    studentId?: string; type?: string; status?: string;
  }): Observable<any[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.set(k, String(v));
      });
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.http.get<any[]>(`${this.apiUrl}/documents/requests${query}`, {
      headers: this.getAuthHeaders(),
    });
  }

  approveDocumentRequest(requestId: string): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/documents/requests/${requestId}/approve`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  rejectDocumentRequest(requestId: string, reason: string): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/documents/requests/${requestId}/reject`,
      { reason },
      { headers: this.getAuthHeaders() }
    );
  }

  /** Student raises a correction request on a record */
  raiseCorrectionRequest(payload: {
    recordId: string; recordType: string; description: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/documents/corrections`, payload, {
      headers: this.getAuthHeaders(),
    });
  }

  // =============================================================
  // VERIFIER  (Req #18, #21)
  // =============================================================

  verifyDocumentHash(hash: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/verify/hash/${hash}`, {
      headers: this.getAuthHeaders(),
    });
  }

  verifySignature(payload: {
    documentId: string; signature: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/verify/signature`, payload, {
      headers: this.getAuthHeaders(),
    });
  }

  // Uses existing VerifyCertificate chaincode function
  verifyCertificate(certId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/certificates/${certId}/verify`, {
      headers: this.getAuthHeaders(),
    });
  }

  // =============================================================
  // CERTIFICATE REVOCATION  (Req #22 — admin manual revoke)
  // =============================================================

  revokeCertificate(certId: string, reason: string): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/certificates/${certId}/revoke`,
      { reason },
      { headers: this.getAuthHeaders() }
    );
  }

  // =============================================================
  // STUDENT ENROLLMENT APPROVAL  (Req #16 — admin approves enrollment)
  // Already exists as POST /api/auth/users/:id/approve
  // Adding convenience wrapper here:
  // =============================================================

  getPendingStudents(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/auth/users?role=student&active=false`, {
      headers: this.getAuthHeaders(),
    });
  }

  approveStudentEnrollment(userId: string): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/auth/users/${userId}/approve`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  // =============================================================
  // HELPER (should already exist — included for completeness)
  // =============================================================

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

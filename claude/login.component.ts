// ============================================================
// login.component.ts  — FULL REPLACEMENT
// CHANGED: added student signup/enroll flow (Req #15)
//          added role-based redirect after login using ROLE_DASHBOARD
//          shows "pending approval" message for inactive students
// ============================================================
import { Component, OnInit }       from '@angular/core';
import { Router }                  from '@angular/router';
import { FormsModule }             from '@angular/forms';
import { CommonModule }            from '@angular/common';
import { AuthService }             from '../../core/services/auth.service';
import { ROLE_DASHBOARD }          from '../../core/guards/auth.guard'; // NEW

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit {
  // ── View mode ────────────────────────────────────────────────
  mode: 'login' | 'signup' = 'login';   // NEW: toggle between login / enroll

  // ── Login form ────────────────────────────────────────────────
  loginForm = { username: '', password: '' };

  // ── Signup form (student enrollment) — Req #15 ───────────────
  // CHANGED: renamed from 'signupForm' to match enroll terminology
  enrollForm = {
    rollNumber: '',   // becomes the username
    fullName: '',
    email: '',
    department: 'CSE',
    semester: 1,
    password: '',
    confirmPassword: '',
  };
  departments = ['CSE', 'ECE'];

  // ── State ─────────────────────────────────────────────────────
  loading = false;
  errorMsg = '';
  successMsg = '';
  enrollPending = false;  // NEW: shown after successful enroll

  // ── Demo credentials (kept from original) ────────────────────
  demoCredentials = [
    { role: 'Admin',         username: 'admin',          password: 'admin123' },
    { role: 'HOD CSE',       username: 'cse_hod',        password: 'csehod123' },
    { role: 'HOD ECE',       username: 'ece_hod',        password: 'ecehod123' },
    { role: 'Faculty CSE',   username: 'cse_faculty',    password: 'csefaculty123' },
    { role: 'Faculty ECE',   username: 'ece_faculty',    password: 'ecefaculty123' },
    { role: 'Dean',          username: 'dean_academic',  password: 'dean123' },
    { role: 'Exam Section',  username: 'exam_section',   password: 'exam123' },
    { role: 'Verifier',      username: 'verifier_demo',  password: 'verifier123' },
  ];

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    // If already logged in, redirect straight to the correct dashboard
    if (this.auth.isLoggedIn()) {
      const user = this.auth.getCurrentUser();
      const path = ROLE_DASHBOARD[user?.role ?? ''] ?? '/login';
      this.router.navigate([path]);
    }
  }

  // ── Login ─────────────────────────────────────────────────────
  onLogin(): void {
    this.errorMsg = '';
    this.successMsg = '';
    this.loading = true;

    this.auth.login(this.loginForm.username, this.loginForm.password).subscribe({
      next: (res: any) => {
        this.loading = false;
        const role = res.user?.role ?? res.role;
        // NEW: role-based redirect
        const path = ROLE_DASHBOARD[role] ?? '/login';
        this.router.navigate([path]);
      },
      error: (err: any) => {
        this.loading = false;
        const msg = err?.error?.message ?? err?.error?.error ?? 'Login failed';
        // NEW: handle inactive student case
        if (msg.toLowerCase().includes('not active') ||
            msg.toLowerCase().includes('pending approval')) {
          this.errorMsg =
            'Your account is pending admin approval. Please check back later.';
        } else {
          this.errorMsg = msg;
        }
      },
    });
  }

  // ── Student Enroll (Req #15) ──────────────────────────────────
  onEnroll(): void {
    this.errorMsg = '';
    this.successMsg = '';

    // Client-side validation
    if (this.enrollForm.password !== this.enrollForm.confirmPassword) {
      this.errorMsg = 'Passwords do not match';
      return;
    }
    if (this.enrollForm.password.length < 6) {
      this.errorMsg = 'Password must be at least 6 characters';
      return;
    }
    if (!this.enrollForm.rollNumber) {
      this.errorMsg = 'Roll number is required';
      return;
    }

    this.loading = true;

    const payload = {
      username: this.enrollForm.rollNumber,
      password: this.enrollForm.password,
      role: 'student',
      fullName: this.enrollForm.fullName,
      email: this.enrollForm.email,
      department: this.enrollForm.department,
      semester: this.enrollForm.semester,
    };

    this.auth.register(payload).subscribe({
      next: () => {
        this.loading = false;
        this.enrollPending = true;  // show "awaiting approval" state
        this.successMsg =
          'Enrollment submitted! An admin will review and activate your account.';
      },
      error: (err: any) => {
        this.loading = false;
        this.errorMsg =
          err?.error?.message ?? err?.error?.error ?? 'Enrollment failed';
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────
  fillDemo(cred: { username: string; password: string }): void {
    this.loginForm.username = cred.username;
    this.loginForm.password = cred.password;
  }

  switchMode(m: 'login' | 'signup'): void {
    this.mode = m;
    this.errorMsg = '';
    this.successMsg = '';
    this.enrollPending = false;
  }
}

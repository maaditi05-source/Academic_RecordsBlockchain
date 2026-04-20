// ============================================================
// app.routes.ts  — FULL REPLACEMENT
// CHANGED: added 7 role-specific routes with canActivate guards
//          replaced single 'dashboard' route that pointed at
//          faculty-dashboard for all roles
// ============================================================

import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';  // CHANGED: named export

export const routes: Routes = [
  // ── Public ───────────────────────────────────────────────────
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login.component').then(m => m.LoginComponent),
  },

  // ── Role-specific dashboards ──────────────────────────────────
  // Req #7 — admin has all rights; sees admin-dashboard
  {
    path: 'admin',
    loadComponent: () =>
      import('./features/admin/admin-dashboard.component').then(
        m => m.AdminDashboardComponent
      ),
    canActivate: [authGuard],
    data: { roles: ['admin'] },                        // NEW role guard data
  },

  // Req #11 — HOD dashboard (separate from faculty)
  {
    path: 'hod',
    loadComponent: () =>
      import('./features/hod/hod-dashboard.component').then(  // NEW component path
        m => m.HodDashboardComponent
      ),
    canActivate: [authGuard],
    data: { roles: ['hod'] },
  },

  // Req #10 — Faculty dashboard (my courses, marks upload, grades)
  {
    path: 'faculty',
    loadComponent: () =>
      import('./features/faculty/faculty-dashboard.component').then(
        m => m.FacultyDashboardComponent
      ),
    canActivate: [authGuard],
    data: { roles: ['faculty'] },
  },

  // Req #12 — Exam Section dashboard
  {
    path: 'exam-section',
    loadComponent: () =>
      import('./features/exam-section/exam-section-dashboard.component').then(  // NEW
        m => m.ExamSectionDashboardComponent
      ),
    canActivate: [authGuard],
    data: { roles: ['exam_section'] },
  },

  // Req #9, #13 — Dean dashboard
  {
    path: 'dean',
    loadComponent: () =>
      import('./features/dean/dean-dashboard.component').then(  // NEW
        m => m.DeanDashboardComponent
      ),
    canActivate: [authGuard],
    data: { roles: ['dean_academic'] },
  },

  // Req #15, #17 — Student dashboard
  {
    path: 'student',
    loadComponent: () =>
      import('./features/student/student-dashboard.component').then(  // NEW
        m => m.StudentDashboardComponent
      ),
    canActivate: [authGuard],
    data: { roles: ['student'] },
  },

  // Req #18, #21 — Verifier dashboard
  {
    path: 'verifier',
    loadComponent: () =>
      import('./features/verifier/verifier-dashboard.component').then(
        m => m.VerifierDashboardComponent
      ),
    canActivate: [authGuard],
    data: { roles: ['verifier'] },
  },

  // ── Default redirects ─────────────────────────────────────────
  { path: '',        redirectTo: 'login', pathMatch: 'full' },
  { path: '**',      redirectTo: 'login' },
];

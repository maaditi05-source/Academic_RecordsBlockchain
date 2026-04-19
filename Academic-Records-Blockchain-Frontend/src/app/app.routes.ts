import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'home',
    loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent)
      }
    ]
  },
  // ── Admin ─────────────────────────────────────────────────────
  {
    path: 'admin',
    canActivate: [authGuard],
    data: { roles: ['admin'] },
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/admin/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'students/:rollNumber',
        loadComponent: () => import('./features/student/student-profile.component').then(m => m.StudentProfileComponent)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  // ── HOD (separate from faculty) ───────────────────────────────
  {
    path: 'hod',
    canActivate: [authGuard],
    data: { roles: ['hod', 'department', 'admin'] },
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/hod/hod-dashboard.component').then(m => m.HodDashboardComponent)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  // ── Faculty ───────────────────────────────────────────────────
  {
    path: 'faculty',
    canActivate: [authGuard],
    data: { roles: ['faculty', 'admin'] },
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/faculty/faculty-dashboard.component').then(m => m.FacultyDashboardComponent)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  // ── Exam Section ──────────────────────────────────────────────
  {
    path: 'exam-section',
    canActivate: [authGuard],
    data: { roles: ['exam_section', 'admin'] },
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/exam-section/exam-section-dashboard.component').then(m => m.ExamSectionDashboardComponent)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  // ── Dean ──────────────────────────────────────────────────────
  {
    path: 'dean',
    canActivate: [authGuard],
    data: { roles: ['dean_academic', 'admin'] },
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dean/dean-dashboard.component').then(m => m.DeanDashboardComponent)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  // ── Student ───────────────────────────────────────────────────
  {
    path: 'student',
    canActivate: [authGuard],
    data: { roles: ['student'] },
    children: [
      {
        path: 'profile/:rollNumber',
        loadComponent: () => import('./features/student/student-profile.component').then(m => m.StudentProfileComponent)
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/student/student-profile.component').then(m => m.StudentProfileComponent)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  // ── Department (legacy alias → redirects to HOD) ──────────────
  {
    path: 'department',
    canActivate: [authGuard],
    data: { roles: ['department', 'hod'] },
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/hod/hod-dashboard.component').then(m => m.HodDashboardComponent)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  // ── Verifier ──────────────────────────────────────────────────
  {
    path: 'verifier',
    loadComponent: () => import('./features/verifier/verifier.component').then(m => m.VerifierComponent)
  },
  {
    path: 'verify',
    loadComponent: () => import('./features/verifier/verifier.component').then(m => m.VerifierComponent)
  },
  // ── Catch-all ─────────────────────────────────────────────────
  {
    path: '**',
    redirectTo: '/auth/login'
  }
];

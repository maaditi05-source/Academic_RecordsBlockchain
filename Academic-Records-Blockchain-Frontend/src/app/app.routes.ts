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
      }
    ]
  },
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
        path: '',
        redirectTo: 'profile',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'department',
    canActivate: [authGuard],
    data: { roles: ['department'] },
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/department/department-dashboard.component').then(m => m.DepartmentDashboardComponent)
      },
      {
        path: 'students/:rollNumber',
        loadComponent: () => import('./features/student/student-profile.component').then(m => m.StudentProfileComponent)
      }
    ]
  },
  {
    path: 'verifier',
    // Public route - no authentication required
    loadComponent: () => import('./features/verifier/verifier.component').then(m => m.VerifierComponent)
  },
  {
    path: 'verify',
    // Public route - no authentication required (alias for verifier)
    loadComponent: () => import('./features/verifier/verifier.component').then(m => m.VerifierComponent)
  },
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
  {
    path: '**',
    redirectTo: '/auth/login'
  }
];

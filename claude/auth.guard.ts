// ============================================================
// auth.guard.ts  — FULL REPLACEMENT
// CHANGED: converted to functional guard (Angular 17 style)
//          added role-based access check using route data.roles
//          added roleToPath() for post-login redirect
// ============================================================

import { inject }          from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService }     from '../services/auth.service';

// ── Role → dashboard path map ─────────────────────────────────
// Used by LoginComponent to redirect after login (req #5 fix:
// HOD should NOT be redirected to faculty route)
export const ROLE_DASHBOARD: Record<string, string> = {
  admin:          '/admin',
  hod:            '/hod',
  faculty:        '/faculty',
  exam_section:   '/exam-section',
  dean_academic:  '/dean',
  student:        '/student',
  verifier:       '/verifier',
};

// ── Guard ─────────────────────────────────────────────────────
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot
) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  const allowedRoles: string[] | undefined = route.data?.['roles'];

  // If the route has no role restriction, allow any logged-in user
  if (!allowedRoles || allowedRoles.length === 0) return true;

  const userRole = auth.getCurrentUser()?.role;

  if (userRole && allowedRoles.includes(userRole)) {
    return true;
  }

  // Wrong role — redirect to their correct dashboard
  const correctPath = ROLE_DASHBOARD[userRole ?? ''] ?? '/login';
  router.navigate([correctPath]);
  return false;
};

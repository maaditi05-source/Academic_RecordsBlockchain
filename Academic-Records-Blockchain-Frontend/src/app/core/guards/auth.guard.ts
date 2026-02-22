import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('=== AUTH GUARD CHECK ===');
  console.log('Route:', state.url);
  console.log('isAuthenticated:', authService.isAuthenticated);
  console.log('Token in localStorage:', !!localStorage.getItem('access_token'));
  console.log('Current user:', authService.currentUser);
  
  if (authService.isAuthenticated) {
    console.log('✅ User is authenticated');
    // Check role-based access
    const requiredRoles = route.data['roles'] as string[];
    if (requiredRoles && requiredRoles.length > 0) {
      console.log('Checking roles:', requiredRoles);
      console.log('User role:', authService.userRole);
      if (authService.hasRole(requiredRoles)) {
        console.log('✅ User has required role');
        return true;
      } else {
        console.log('❌ User does NOT have required role');
        // User doesn't have required role
        router.navigate(['/unauthorized']);
        return false;
      }
    }
    console.log('✅ No role check needed, allowing access');
    return true;
  }

  // Not authenticated
  console.log('❌ User is NOT authenticated - redirecting to login');
  router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

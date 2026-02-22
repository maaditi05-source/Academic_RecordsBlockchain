import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  const router = inject(Router);
  
  // Public endpoints that don't require authentication
  const publicEndpoints = [
    '/certificates/verify',
    '/certificates/',
    '/students/'
  ];
  
  const isPublicEndpoint = publicEndpoints.some(endpoint => req.url.includes(endpoint));
  
  console.log('=== HTTP INTERCEPTOR ===');
  console.log('Request URL:', req.url);
  console.log('Request Method:', req.method);
  console.log('Is Public Endpoint:', isPublicEndpoint);
  console.log('Is Browser:', isPlatformBrowser(platformId));
  
  // Only access localStorage in browser
  if (isPlatformBrowser(platformId)) {
    const token = localStorage.getItem('access_token');
    
    console.log('Token exists in localStorage:', !!token);
    if (token) {
      console.log('Token preview:', token.substring(0, 30) + '...');
      console.log('Token length:', token.length);
    } else {
      console.warn('⚠️ NO TOKEN FOUND IN LOCALSTORAGE!');
      console.log('LocalStorage keys:', Object.keys(localStorage));
    }
    
    // Clone request and add authorization header if token exists
    // For public endpoints, token is optional
    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('✅ Authorization header added successfully');
    } else {
      if (isPublicEndpoint) {
        console.log('ℹ️ Public endpoint - proceeding without token');
      } else {
        console.error('❌ NO Authorization header added - token missing!');
      }
    }
  } else {
    console.warn('Not in browser environment - skipping token');
  }
  
  // Handle response and errors
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('=== HTTP ERROR ===');
      console.error('Status:', error.status);
      console.error('Status Text:', error.statusText);
      console.error('URL:', error.url);
      console.error('Error message:', error.message);
      console.error('Error body:', error.error);
      
      // Don't redirect to login for public endpoints
      if ((error.status === 401 || error.status === 403) && isPlatformBrowser(platformId) && !isPublicEndpoint) {
        // Check if it's a token error
        const errorCode = error.error?.code;
        console.log('Error code from backend:', errorCode);
        
        if (errorCode === 'TOKEN_EXPIRED' || errorCode === 'INVALID_TOKEN' || errorCode === 'VERIFICATION_FAILED' || error.status === 401) {
          // Token expired or invalid - clear storage and redirect to login
          console.log('🚨 Token issue detected - clearing storage and redirecting');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('current_user');
          localStorage.removeItem('user');
          router.navigate(['/auth/login'], { 
            queryParams: { message: 'Session expired. Please login again.' } 
          });
        } else {
          console.log('403 error but not a token issue - letting component handle it');
        }
        // If it's 403 but not a token error, let the component handle it
      } else if (isPublicEndpoint) {
        console.log('ℹ️ Error on public endpoint - not redirecting to login');
      }
      return throwError(() => error);
    })
  );
};

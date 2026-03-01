import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { User, LoginCredentials, RegisterCredentials, LoginResponse, ApiResponse } from '../models/user.model';
import { environment } from '../../../environments/environment';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private platformId = inject(PLATFORM_ID);
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private readonly USER_KEY = 'current_user';
  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';

  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private router: Router,
    private notificationService: NotificationService
  ) {
    // Load user from localStorage on init (only in browser)
    if (isPlatformBrowser(this.platformId)) {
      const storedUser = localStorage.getItem(this.USER_KEY);
      if (storedUser) {
        this.currentUserSubject.next(JSON.parse(storedUser));
      }
    }
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get isAuthenticated(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }
    const token = localStorage.getItem(this.TOKEN_KEY);
    return !!token && !!this.currentUser;
  }

  get userRole(): string | null {
    return this.currentUser?.role || null;
  }

  login(credentials: LoginCredentials): Observable<LoginResponse> {
    console.log('=== AUTH SERVICE LOGIN START ===');
    console.log('Credentials:', { email: credentials.email, password: '***' });
    console.log('API URL:', `${this.apiUrl}/auth/login`);

    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap(response => {
        console.log('=== LOGIN API RESPONSE RECEIVED ===');
        console.log('Full response:', JSON.stringify(response, null, 2));
        console.log('Success:', response.success);
        console.log('Has data:', !!response.data);

        if (response.success && response.data) {
          console.log('=== SETTING AUTH DATA ===');
          console.log('Access Token:', response.data.accessToken?.substring(0, 30) + '...');
          console.log('User object:', JSON.stringify(response.data.user, null, 2));

          this.setAuthData(response.data);
          // Connect Socket.io for real-time notifications
          const userId = response.data.user?.username || response.data.user?.id;
          if (userId) this.notificationService.connect(userId);

          console.log('=== VERIFYING LOCALSTORAGE ===');
          const storedToken = localStorage.getItem('access_token');
          const storedUser = localStorage.getItem('user');
          console.log('Token stored:', !!storedToken);
          console.log('Token preview:', storedToken?.substring(0, 30) + '...');
          console.log('User stored:', !!storedUser);
          console.log('User data:', storedUser);
          console.log('=== AUTH SERVICE LOGIN COMPLETE ===');
        } else {
          console.error('Login response missing success or data');
        }
      }),
      catchError(error => {
        console.error('=== LOGIN ERROR ===', error);
        return throwError(() => error);
      })
    );
  }

  register(credentials: RegisterCredentials): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/auth/register`, credentials).pipe(
      catchError(error => {
        console.error('Registration error:', error);
        return throwError(() => error);
      })
    );
  }

  refreshToken(): Observable<LoginResponse> {
    if (!isPlatformBrowser(this.platformId)) {
      return throwError(() => new Error('Not in browser'));
    }

    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token'));
    }

    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/refresh`, { refreshToken }).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.setAuthData(response.data);
        }
      }),
      catchError(error => {
        this.logout();
        return throwError(() => error);
      })
    );
  }

  getProfile(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/auth/profile`).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.setUser(response.data);
        }
      })
    );
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.USER_KEY);
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem('user'); // Also remove 'user' key
    }
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  private setAuthData(data: LoginResponse['data']): void {
    if (!data || !isPlatformBrowser(this.platformId)) return;

    localStorage.setItem(this.TOKEN_KEY, data.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, data.refreshToken);

    const user: User = {
      userId: data.user.role === 'student'
        ? (data.user.username || data.user.userId || data.user.id || '')
        : (data.user.userId || data.user.id || data.user.username || ''),
      email: data.user.email,
      role: data.user.role,
      name: data.user.name,
      department: data.user.department
    };

    // Also store the full user object with all fields for backward compatibility
    const fullUser = {
      ...user,
      id: data.user.id,
      username: data.user.username
    };

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(fullUser));
      // Also store as 'user' for components that expect it
      localStorage.setItem('user', JSON.stringify(fullUser));
    }

    this.currentUserSubject.next(user);
  }

  private setUser(user: User): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
    this.currentUserSubject.next(user);
  }

  hasRole(roles: string[]): boolean {
    return !!this.currentUser && roles.includes(this.currentUser.role);
  }

  // Helper method for backward compatibility
  isDepartmentUser(): boolean {
    return this.currentUser?.role === 'department';
  }
}

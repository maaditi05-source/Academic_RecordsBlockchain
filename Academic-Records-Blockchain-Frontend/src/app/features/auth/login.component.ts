import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';
import { LoginCredentials } from '../../core/models/user.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatSnackBarModule
  ],
  template: `
    <div class="login-container">
      <!-- Animated Background -->
      <div class="bg-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
      </div>

      <div class="login-card-wrapper scale-in">
        <!-- Back to Home Link -->
        <div class="back-link">
          <a routerLink="/" class="back-btn">
            <mat-icon>arrow_back</mat-icon>
            <span>Back to Home</span>
          </a>
        </div>

        <mat-card class="login-card">
          <!-- Header with Icon -->
          <div class="card-header">
            <div class="icon-wrapper">
              <mat-icon class="header-icon">lock_open</mat-icon>
            </div>
            <h1 class="title">Welcome Back</h1>
            <p class="subtitle">Sign in to access your academic records</p>
          </div>
          
          <mat-card-content>
            <form #loginForm="ngForm" (ngSubmit)="onLogin()">
              <mat-form-field appearance="outline" class="full-width modern-field">
                <mat-label>Username or Email</mat-label>
                <input 
                  matInput 
                  type="text"
                  [(ngModel)]="credentials.email" 
                  name="email" 
                  required
                  placeholder="Enter your username or email">
                <mat-icon matPrefix class="input-icon">person_outline</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width modern-field">
                <mat-label>Password</mat-label>
                <input 
                  matInput 
                  [type]="hidePassword ? 'password' : 'text'"
                  [(ngModel)]="credentials.password" 
                  name="password" 
                  required
                  placeholder="Enter your password">
                <mat-icon matPrefix class="input-icon">lock_outline</mat-icon>
                <button mat-icon-button matSuffix type="button" (click)="hidePassword = !hidePassword" class="toggle-password">
                  <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
                </button>
              </mat-form-field>

              <!-- Demo Credentials Card -->
              <div class="demo-credentials">
                <div class="demo-header">
                  <mat-icon class="demo-icon">info_outline</mat-icon>
                  <span class="demo-title">Demo Credentials</span>
                </div>
                <div class="credentials-grid">
                  <div class="credential-item">
                    <mat-icon class="role-icon admin-icon">admin_panel_settings</mat-icon>
                    <div class="credential-info">
                      <span class="role-label">Admin</span>
                      <span class="credential-value">admin / password123</span>
                    </div>
                  </div>
                  <div class="credential-item">
                    <mat-icon class="role-icon student-icon">school</mat-icon>
                    <div class="credential-info">
                      <span class="role-label">Student</span>
                      <span class="credential-value">25CSM2R26 / password123</span>
                    </div>
                  </div>
                  <div class="credential-item">
                    <mat-icon class="role-icon dept-icon">domain</mat-icon>
                    <div class="credential-info">
                      <span class="role-label">HOD</span>
                      <span class="credential-value">hod_demo / password123</span>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                mat-raised-button 
                color="primary" 
                type="submit" 
                class="login-button"
                [disabled]="!loginForm.valid || loading">
                <mat-icon *ngIf="!loading">login</mat-icon>
                <mat-icon *ngIf="loading" class="rotating">sync</mat-icon>
                <span *ngIf="loading">Signing in...</span>
                <span *ngIf="!loading">Sign In</span>
              </button>

              <div class="divider">
                <span>or</span>
              </div>

              <div class="register-section">
                <p class="register-text">Don't have an account?</p>
                <a routerLink="/auth/register" class="register-link">
                  <mat-icon>person_add</mat-icon>
                  <span>Create Account</span>
                </a>
              </div>
            </form>
          </mat-card-content>
        </mat-card>

        <!-- Footer -->
        <div class="footer-info">
          <div class="footer-content">
            <mat-icon class="footer-icon">verified_user</mat-icon>
            <span>Secured by Hyperledger Fabric Blockchain</span>
          </div>
          <p class="version">NIT Warangal Academic Records v1.0.0</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e1b4b 100%);
      padding: 20px;
      position: relative;
      overflow: hidden;
    }

    /* Animated Background Shapes */
    .bg-shapes {
      position: absolute;
      width: 100%;
      height: 100%;
      overflow: hidden;
      z-index: 0;
    }

    .shape {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      animation: float 20s infinite ease-in-out;
    }

    .shape-1 {
      width: 300px;
      height: 300px;
      top: -100px;
      left: -100px;
      animation-delay: 0s;
    }

    .shape-2 {
      width: 200px;
      height: 200px;
      bottom: -50px;
      right: -50px;
      animation-delay: 5s;
    }

    .shape-3 {
      width: 150px;
      height: 150px;
      top: 50%;
      right: 10%;
      animation-delay: 10s;
    }

    @keyframes float {
      0%, 100% { transform: translate(0, 0) rotate(0deg); }
      33% { transform: translate(30px, -30px) rotate(120deg); }
      66% { transform: translate(-20px, 20px) rotate(240deg); }
    }

    .login-card-wrapper {
      width: 100%;
      max-width: 480px;
      position: relative;
      z-index: 1;
    }

    .back-link {
      margin-bottom: 20px;
    }

    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: white;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      padding: 8px 16px;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
    }

    .back-btn:hover {
      background: rgba(255, 255, 255, 0.25);
      transform: translateX(-5px);
    }

    .back-btn mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .login-card {
      padding: 40px 32px;
      border-radius: 24px;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(148, 163, 184, 0.1);
    }

    .card-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .icon-wrapper {
      width: 80px;
      height: 80px;
      margin: 0 auto 20px;
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }

    .header-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: white;
    }

    .title {
      margin: 0 0 8px 0;
      color: #ffffff;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }

    .subtitle {
      margin: 0;
      color: #94a3b8;
      font-size: 15px;
      font-weight: 400;
    }

    .modern-field {
      margin-bottom: 20px;
    }

    .modern-field ::ng-deep .mat-mdc-text-field-wrapper {
      background: rgba(15, 23, 42, 0.95);
    }

    .input-icon {
      color: #60a5fa;
      opacity: 0.9;
    }

    .toggle-password {
      color: #999;
    }

    /* Demo Credentials */
    .demo-credentials {
      background: rgba(15, 23, 42, 0.8);
      border-radius: 16px;
      padding: 20px;
      margin: 24px 0;
      border: 1px solid rgba(148, 163, 184, 0.1);
    }

    .demo-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }

    .demo-icon {
      color: #2dd4bf;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .demo-title {
      font-weight: 600;
      font-size: 14px;
      color: #e2e8f0;
    }

    .credentials-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .credential-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: rgba(2, 6, 23, 0.6);
      border-radius: 12px;
      transition: all 0.3s ease;
    }

    .credential-item:hover {
      transform: translateX(5px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .role-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .admin-icon { color: #ef5350; }
    .dept-icon { color: #42a5f5; }
    .student-icon { color: #66bb6a; }

    .credential-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
    }

    .role-label {
      font-size: 12px;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .credential-value {
      font-size: 13px;
      color: #ffffff;
      font-weight: 600;
      font-family: 'JetBrains Mono', 'Courier New', monospace;
    }

    .login-button {
      width: 100%;
      height: 52px;
      font-size: 16px;
      font-weight: 600;
      border-radius: 12px;
      margin-top: 8px;
      text-transform: none;
      letter-spacing: 0.5px;
      background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
      box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
    }

    .login-button:hover:not(:disabled) {
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
      transform: translateY(-2px);
    }

    .login-button mat-icon {
      margin-right: 8px;
    }

    .rotating {
      animation: rotate 1s linear infinite;
    }

    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .divider {
      position: relative;
      text-align: center;
      margin: 24px 0;
    }

    .divider::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 1px;
      background: rgba(148, 163, 184, 0.2);
    }

    .divider span {
      position: relative;
      background: rgba(15, 23, 42, 0.85);
      padding: 0 16px;
      color: #64748b;
      font-size: 13px;
      font-weight: 500;
    }

    .register-section {
      text-align: center;
    }

    .register-text {
      margin: 0 0 12px 0;
      color: #94a3b8;
      font-size: 14px;
    }

    .register-link {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: #60a5fa;
      text-decoration: none;
      font-weight: 600;
      font-size: 15px;
      padding: 10px 24px;
      border-radius: 10px;
      border: 2px solid rgba(96, 165, 250, 0.4);
      transition: all 0.3s ease;
    }

    .register-link:hover {
      background: rgba(96, 165, 250, 0.15);
      color: #93c5fd;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(96, 165, 250, 0.2);
    }

    .register-link mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .footer-info {
      text-align: center;
      margin-top: 24px;
      color: white;
    }

    .footer-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .footer-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .footer-content span {
      font-size: 14px;
      font-weight: 500;
    }

    .version {
      opacity: 0.8;
      font-size: 12px;
      margin: 0;
    }

    /* Responsive */
    @media (max-width: 600px) {
      .login-container {
        padding: 16px;
      }

      .login-card {
        padding: 32px 24px;
      }

      .title {
        font-size: 24px;
      }

      .subtitle {
        font-size: 14px;
      }

      .credential-item {
        flex-direction: row;
      }
    }
  `]
})
export class LoginComponent {
  credentials: LoginCredentials = {
    email: '',
    password: ''
  };

  loading = false;
  hidePassword = true;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    // Show message if redirected from session expiry
    this.route.queryParams.subscribe(params => {
      if (params['message']) {
        this.snackBar.open(params['message'], 'Close', { duration: 5000 });
      }
    });
  }

  onLogin(): void {
    if (!this.credentials.email || !this.credentials.password) {
      return;
    }

    this.loading = true;

    this.authService.login(this.credentials).subscribe({
      next: (response) => {
        console.log('Login response:', response);
        this.loading = false;
        if (response.success && response.data) {
          console.log('User role:', response.data.user.role);
          console.log('User data:', response.data.user);
          this.snackBar.open('Login successful!', 'Close', { duration: 3000 });
          // Navigate based on role
          this.navigateByRole(response.data.user.role, response.data.user.username || response.data.user.id);
        }
      },
      error: (error) => {
        this.loading = false;
        const message = error.error?.message || 'Login failed. Please check your credentials.';
        this.snackBar.open(message, 'Close', { duration: 5000 });
        console.error('Login error:', error);
      }
    });
  }

  private navigateByRole(role: string, userId?: string): void {
    console.log('Navigating by role:', role, 'userId:', userId);

    if (role === 'student' && userId) {
      // Students go directly to their profile page
      console.log('Navigating to student profile:', userId);
      this.router.navigate(['/student/profile', userId]);
    } else {
      const routes: Record<string, string> = {
        'admin': '/admin/dashboard',
        'department': '/department/dashboard',
        'verifier': '/verifier',
        'faculty': '/faculty/dashboard',
        'hod': '/faculty/dashboard',
        'dac_member': '/faculty/dashboard',
        'exam_section': '/faculty/dashboard',
        'dean_academic': '/faculty/dashboard'
      };
      const targetRoute = routes[role] || '/';
      console.log('Navigating to:', targetRoute);
      this.router.navigate([targetRoute]).then(success => {
        console.log('Navigation success:', success);
      }).catch(err => {
        console.error('Navigation error:', err);
      });
    }
  }
}

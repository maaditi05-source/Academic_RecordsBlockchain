import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';
import { RegisterCredentials } from '../../core/models/user.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatSnackBarModule
  ],
  template: `
    <div class="register-container">
      <!-- Animated Background -->
      <div class="bg-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
      </div>

      <div class="register-card-wrapper">
        <!-- Back to Login Link -->
        <div class="back-link">
          <a routerLink="/auth/login" class="back-btn">
            <mat-icon>arrow_back</mat-icon>
            <span>Back to Login</span>
          </a>
        </div>

        <mat-card class="register-card">
          <!-- Card Header -->
          <div class="card-header">
            <div class="icon-wrapper">
              <mat-icon class="header-icon">person_add</mat-icon>
            </div>
            <h1 class="title">Create Account</h1>
            <p class="subtitle">Join NIT Warangal Academic Records</p>
          </div>
          
          <mat-card-content>
            <form #registerForm="ngForm" (ngSubmit)="onRegister()">
              <!-- Personal Information Section -->
              <div class="form-section">
                <h3 class="section-title">
                  <mat-icon>person_outline</mat-icon>
                  Personal Information
                </h3>
                
                <mat-form-field appearance="outline" class="modern-field">
                  <mat-label>Full Name</mat-label>
                  <input 
                    matInput 
                    [(ngModel)]="credentials.name" 
                    name="name" 
                    required
                    placeholder="Enter your full name">
                  <mat-icon matPrefix class="input-icon">person</mat-icon>
                </mat-form-field>

                <mat-form-field appearance="outline" class="modern-field">
                  <mat-label>Email Address</mat-label>
                  <input 
                    matInput 
                    type="email"
                    [(ngModel)]="credentials.email" 
                    name="email" 
                    required
                    placeholder="your.email@nitw.ac.in">
                  <mat-icon matPrefix class="input-icon">email</mat-icon>
                </mat-form-field>
              </div>

              <!-- Role Selection Section -->
              <div class="form-section">
                <h3 class="section-title">
                  <mat-icon>badge</mat-icon>
                  Role Selection
                </h3>
                
                <div class="role-cards">
                  <div 
                    class="role-card" 
                    [class.selected]="credentials.role === 'department'"
                    (click)="credentials.role = 'department'">
                    <mat-icon class="role-card-icon dept-icon">business</mat-icon>
                    <h4>Department</h4>
                    <p>Manage academic records</p>
                  </div>
                  <div 
                    class="role-card" 
                    [class.selected]="credentials.role === 'verifier'"
                    (click)="credentials.role = 'verifier'">
                    <mat-icon class="role-card-icon verifier-icon">verified</mat-icon>
                    <h4>Verifier</h4>
                    <p>Verify certificates</p>
                  </div>
                </div>

                <mat-form-field 
                  appearance="outline" 
                  class="modern-field" 
                  *ngIf="credentials.role === 'department'">
                  <mat-label>Department</mat-label>
                  <mat-select 
                    [(ngModel)]="credentials.department" 
                    name="department" 
                    [required]="credentials.role === 'department'">
                    <mat-option value="CSE">Computer Science & Engineering</mat-option>
                    <mat-option value="ECE">Electronics & Communication Engineering</mat-option>
                    <mat-option value="EE">Electrical Engineering</mat-option>
                    <mat-option value="MECH">Mechanical Engineering</mat-option>
                    <mat-option value="CIVIL">Civil Engineering</mat-option>
                    <mat-option value="CHEM">Chemical Engineering</mat-option>
                    <mat-option value="MME">Metallurgical & Materials Engineering</mat-option>
                    <mat-option value="BT">Biotechnology</mat-option>
                  </mat-select>
                  <mat-icon matPrefix class="input-icon">domain</mat-icon>
                </mat-form-field>
              </div>

              <!-- Security Section -->
              <div class="form-section">
                <h3 class="section-title">
                  <mat-icon>security</mat-icon>
                  Security
                </h3>
                
                <mat-form-field appearance="outline" class="modern-field">
                  <mat-label>Password</mat-label>
                  <input 
                    matInput 
                    [type]="hidePassword ? 'password' : 'text'"
                    [(ngModel)]="credentials.password" 
                    name="password" 
                    required
                    minlength="6"
                    placeholder="At least 6 characters">
                  <mat-icon matPrefix class="input-icon">lock</mat-icon>
                  <button 
                    mat-icon-button 
                    matSuffix 
                    type="button" 
                    (click)="hidePassword = !hidePassword"
                    class="toggle-password">
                    <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
                  </button>
                </mat-form-field>

                <div class="password-strength">
                  <div class="strength-bar" [class.weak]="credentials.password.length > 0 && credentials.password.length < 6"
                       [class.good]="credentials.password.length >= 6 && credentials.password.length < 10"
                       [class.strong]="credentials.password.length >= 10"></div>
                  <span class="strength-text" *ngIf="credentials.password.length > 0">
                    {{ getPasswordStrength() }}
                  </span>
                </div>
              </div>

              <button 
                mat-raised-button 
                color="primary" 
                type="submit" 
                class="register-button"
                [disabled]="!registerForm.valid || loading">
                <mat-icon *ngIf="!loading">person_add</mat-icon>
                <mat-icon *ngIf="loading" class="rotating">sync</mat-icon>
                <span *ngIf="loading">Creating Account...</span>
                <span *ngIf="!loading">Create Account</span>
              </button>

              <div class="divider">
                <span>or</span>
              </div>

              <div class="login-section">
                <p class="login-text">Already have an account?</p>
                <a routerLink="/auth/login" class="login-link">
                  <mat-icon>login</mat-icon>
                  <span>Login Here</span>
                </a>
              </div>
            </form>
          </mat-card-content>
        </mat-card>

        <div class="footer-info">
          <div class="footer-content">
            <mat-icon class="footer-icon">verified_user</mat-icon>
            <span>Secured by Hyperledger Fabric Blockchain</span>
          </div>
          <p class="version">v2.5.14</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .register-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
      right: -100px;
      animation-delay: 0s;
    }

    .shape-2 {
      width: 200px;
      height: 200px;
      bottom: -50px;
      left: -50px;
      animation-delay: 5s;
    }

    .shape-3 {
      width: 150px;
      height: 150px;
      top: 50%;
      left: 10%;
      animation-delay: 10s;
    }

    @keyframes float {
      0%, 100% { transform: translate(0, 0) rotate(0deg); }
      33% { transform: translate(30px, -30px) rotate(120deg); }
      66% { transform: translate(-20px, 20px) rotate(240deg); }
    }

    .register-card-wrapper {
      width: 100%;
      max-width: 520px;
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

    .register-card {
      padding: 40px 32px;
      border-radius: 24px;
      background: rgba(255, 255, 255, 0.98);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.3);
    }

    .card-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .icon-wrapper {
      width: 80px;
      height: 80px;
      margin: 0 auto 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
      color: #1a1a1a;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }

    .subtitle {
      margin: 0;
      color: #666;
      font-size: 15px;
      font-weight: 400;
    }

    /* Form Sections */
    .form-section {
      margin-bottom: 24px;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 16px 0;
      color: #1a1a1a;
      font-size: 16px;
      font-weight: 600;
    }

    .section-title mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #667eea;
    }

    .modern-field {
      width: 100%;
      margin-bottom: 16px;
    }

    .modern-field ::ng-deep .mat-mdc-text-field-wrapper {
      background: #f8f9fa;
    }

    .input-icon {
      color: #667eea;
      opacity: 0.8;
    }

    .toggle-password {
      color: #999;
    }

    /* Role Selection Cards */
    .role-cards {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 16px;
    }

    .role-card {
      padding: 20px 16px;
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      background: white;
    }

    .role-card:hover {
      border-color: #667eea;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
    }

    .role-card.selected {
      border-color: #667eea;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
    }

    .role-card-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
      margin-bottom: 8px;
    }

    .dept-icon { color: #42a5f5; }
    .verifier-icon { color: #66bb6a; }

    .role-card h4 {
      margin: 0 0 4px 0;
      font-size: 15px;
      font-weight: 600;
      color: #1a1a1a;
    }

    .role-card p {
      margin: 0;
      font-size: 12px;
      color: #999;
    }

    /* Password Strength */
    .password-strength {
      margin-top: -8px;
      margin-bottom: 16px;
    }

    .strength-bar {
      height: 4px;
      border-radius: 2px;
      background: #e0e0e0;
      transition: all 0.3s ease;
    }

    .strength-bar.weak {
      width: 33%;
      background: #ef5350;
    }

    .strength-bar.good {
      width: 66%;
      background: #ffa726;
    }

    .strength-bar.strong {
      width: 100%;
      background: #66bb6a;
    }

    .strength-text {
      display: block;
      margin-top: 4px;
      font-size: 12px;
      font-weight: 500;
    }

    .strength-bar.weak + .strength-text { color: #ef5350; }
    .strength-bar.good + .strength-text { color: #ffa726; }
    .strength-bar.strong + .strength-text { color: #66bb6a; }

    .register-button {
      width: 100%;
      height: 52px;
      font-size: 16px;
      font-weight: 600;
      border-radius: 12px;
      margin-top: 8px;
      text-transform: none;
      letter-spacing: 0.5px;
      box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
    }

    .register-button:hover:not(:disabled) {
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
      transform: translateY(-2px);
    }

    .register-button mat-icon {
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
      background: #dee2e6;
    }

    .divider span {
      position: relative;
      background: white;
      padding: 0 16px;
      color: #999;
      font-size: 13px;
      font-weight: 500;
    }

    .login-section {
      text-align: center;
    }

    .login-text {
      margin: 0 0 12px 0;
      color: #666;
      font-size: 14px;
    }

    .login-link {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
      font-size: 15px;
      padding: 10px 24px;
      border-radius: 10px;
      border: 2px solid #667eea;
      transition: all 0.3s ease;
    }

    .login-link:hover {
      background: #667eea;
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .login-link mat-icon {
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
      .register-container {
        padding: 16px;
      }

      .register-card {
        padding: 32px 24px;
      }

      .title {
        font-size: 24px;
      }

      .subtitle {
        font-size: 14px;
      }

      .role-cards {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class RegisterComponent {
  credentials: RegisterCredentials = {
    name: '',
    email: '',
    password: '',
    role: 'department',
    department: undefined
  };
  
  loading = false;
  hidePassword = true;

  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  onRegister(): void {
    if (!this.validateForm()) {
      return;
    }

    this.loading = true;
    
    this.authService.register(this.credentials as any).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.snackBar.open('Registration successful! Please login.', 'Close', { duration: 5000 });
          this.router.navigate(['/auth/login']);
        }
      },
      error: (error) => {
        this.loading = false;
        const message = error.error?.message || 'Registration failed. Please try again.';
        this.snackBar.open(message, 'Close', { duration: 5000 });
        console.error('Registration error:', error);
      }
    });
  }

  getPasswordStrength(): string {
    const length = this.credentials.password.length;
    if (length < 6) return 'Weak password';
    if (length < 10) return 'Good password';
    return 'Strong password';
  }

  private validateForm(): boolean {
    if (!this.credentials.name || !this.credentials.email || !this.credentials.password) {
      this.snackBar.open('Please fill all required fields', 'Close', { duration: 3000 });
      return false;
    }

    if (this.credentials.password.length < 6) {
      this.snackBar.open('Password must be at least 6 characters', 'Close', { duration: 3000 });
      return false;
    }

    if (this.credentials.role === 'department' && !this.credentials.department) {
      this.snackBar.open('Please select a department', 'Close', { duration: 3000 });
      return false;
    }

    return true;
  }
}

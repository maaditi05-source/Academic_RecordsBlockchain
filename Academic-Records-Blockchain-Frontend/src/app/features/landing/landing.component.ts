import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatToolbarModule
  ],
  template: `
    <div class="landing-container">
      <!-- Animated Background Particles -->
      <div class="particles">
        <div class="particle" *ngFor="let p of particles" 
             [style.left.%]="p.x" 
             [style.top.%]="p.y"
             [style.animation-delay.s]="p.delay"></div>
      </div>

      <!-- Hero Section -->
      <header class="hero-section">
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <div class="logo-section animate-in">
            <div class="logo-glow">
              <mat-icon class="logo-icon">school</mat-icon>
            </div>
            <h1 class="main-title">NIT Warangal</h1>
          </div>
          <h2 class="subtitle animate-in delay-1">Academic Records on Blockchain</h2>
          <p class="hero-description animate-in delay-2">
            Secure, Transparent, and Immutable Academic Record Management powered by Hyperledger Fabric
          </p>
          
          <div class="cta-buttons animate-in delay-3">
            <button mat-raised-button color="primary" class="cta-btn primary" routerLink="/verifier">
              <mat-icon>verified</mat-icon>
              Verify Certificate
            </button>
            <button mat-raised-button class="cta-btn secondary" routerLink="/auth/login">
              <mat-icon>login</mat-icon>
              Portal Login
            </button>
          </div>

          <div class="stats-row animate-in delay-4">
            <div class="stat-item">
              <mat-icon>security</mat-icon>
              <span class="stat-number">100%</span>
              <span class="stat-label">Secure</span>
            </div>
            <div class="stat-item">
              <mat-icon>speed</mat-icon>
              <span class="stat-number">&lt;1s</span>
              <span class="stat-label">Verification</span>
            </div>
            <div class="stat-item">
              <mat-icon>verified</mat-icon>
              <span class="stat-number">∞</span>
              <span class="stat-label">Immutable</span>
            </div>
          </div>
        </div>

        <!-- Scroll Indicator -->
        <div class="scroll-indicator">
          <div class="scroll-line"></div>
          <mat-icon>keyboard_arrow_down</mat-icon>
        </div>
      </header>

      <!-- Features Section -->
      <section class="features-section">
        <div class="section-container">
          <div class="section-header">
            <span class="section-badge">Features</span>
            <h2 class="section-title">Why Blockchain for Academic Records?</h2>
            <p class="section-subtitle">Revolutionizing education with cutting-edge technology</p>
          </div>
          
          <div class="features-grid">
            <mat-card class="feature-card" *ngFor="let feature of features">
              <div class="feature-icon-wrapper">
                <mat-icon class="feature-icon" [class]="feature.class">{{feature.icon}}</mat-icon>
              </div>
              <h3>{{feature.title}}</h3>
              <p>{{feature.description}}</p>
              <div class="feature-badge">{{feature.badge}}</div>
            </mat-card>
          </div>
        </div>
      </section>

      <!-- How It Works Section -->
      <section class="how-it-works-section">
        <div class="section-container">
          <div class="section-header">
            <span class="section-badge">Process</span>
            <h2 class="section-title">How It Works</h2>
            <p class="section-subtitle">Simple, secure, and efficient workflow</p>
          </div>
          
          <div class="steps-container">
            <div class="step" *ngFor="let step of steps; let i = index">
              <div class="step-number">{{i + 1}}</div>
              <div class="step-icon-bg">
                <mat-icon class="step-icon">{{step.icon}}</mat-icon>
              </div>
              <div class="step-content">
                <h3>{{step.title}}</h3>
                <p>{{step.description}}</p>
              </div>
              <div class="step-connector" *ngIf="i < steps.length - 1"></div>
            </div>
          </div>
        </div>
      </section>

      <!-- Quick Actions Section -->
      <section class="quick-actions-section">
        <div class="section-container">
          <div class="section-header">
            <h2 class="section-title white">Get Started Today</h2>
            <p class="section-subtitle white">Choose your action to begin</p>
          </div>
          
          <div class="actions-grid">
            <mat-card class="action-card verifier-card">
              <div class="action-card-bg"></div>
              <div class="action-content">
                <div class="icon-badge">
                  <mat-icon class="action-icon">verified</mat-icon>
                </div>
                <h3>Verify a Certificate</h3>
                <p>Instantly verify the authenticity of any academic certificate or record using blockchain technology</p>
                <div class="action-features">
                  <span><mat-icon>check_circle</mat-icon> Instant Results</span>
                  <span><mat-icon>check_circle</mat-icon> No Login Required</span>
                  <span><mat-icon>check_circle</mat-icon> 100% Accurate</span>
                </div>
                <button mat-raised-button color="primary" routerLink="/verifier">
                  Verify Now
                  <mat-icon>arrow_forward</mat-icon>
                </button>
              </div>
            </mat-card>

            <mat-card class="action-card login-card">
              <div class="action-card-bg"></div>
              <div class="action-content">
                <div class="icon-badge">
                  <mat-icon class="action-icon">account_circle</mat-icon>
                </div>
                <h3>Access Portal</h3>
                <p>Students, faculty, and administrators can login to manage and access academic records</p>
                <div class="action-features">
                  <span><mat-icon>check_circle</mat-icon> Secure Access</span>
                  <span><mat-icon>check_circle</mat-icon> Role-Based</span>
                  <span><mat-icon>check_circle</mat-icon> Real-Time Updates</span>
                </div>
                <button mat-raised-button color="accent" routerLink="/auth/login">
                  Login
                  <mat-icon>arrow_forward</mat-icon>
                </button>
              </div>
            </mat-card>
          </div>
        </div>
      </section>

      <!-- Technology Section -->
      <section class="technology-section">
        <div class="section-container">
          <div class="section-header">
            <span class="section-badge">Technology</span>
            <h2 class="section-title">Powered By Enterprise Blockchain</h2>
          </div>
          <div class="tech-stack">
            <div class="tech-item" *ngFor="let tech of techStack">
              <div class="tech-icon-wrapper">
                <mat-icon>{{tech.icon}}</mat-icon>
              </div>
              <span>{{tech.name}}</span>
              <p>{{tech.description}}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="footer">
        <div class="footer-content">
          <div class="footer-section">
            <div class="footer-logo">
              <mat-icon>school</mat-icon>
              <h4>NIT Warangal</h4>
            </div>
            <p>National Institute of Technology</p>
            <p>Warangal, Telangana, India</p>
            <div class="footer-social">
              <button mat-icon-button><mat-icon>language</mat-icon></button>
              <button mat-icon-button><mat-icon>email</mat-icon></button>
              <button mat-icon-button><mat-icon>phone</mat-icon></button>
            </div>
          </div>
          <div class="footer-section">
            <h4>Quick Links</h4>
            <a routerLink="/verifier"><mat-icon>arrow_right</mat-icon> Verify Certificate</a>
            <a routerLink="/auth/login"><mat-icon>arrow_right</mat-icon> Portal Login</a>
            <a routerLink="/auth/register"><mat-icon>arrow_right</mat-icon> Register Account</a>
          </div>
          <div class="footer-section">
            <h4>Technology</h4>
            <p><mat-icon>check_circle</mat-icon> Hyperledger Fabric 2.5</p>
            <p><mat-icon>check_circle</mat-icon> Distributed Ledger</p>
            <p><mat-icon>check_circle</mat-icon> Smart Contracts</p>
            <p><mat-icon>check_circle</mat-icon> Cryptographic Security</p>
          </div>
          <div class="footer-section">
            <h4>Support</h4>
            <a href="#"><mat-icon>arrow_right</mat-icon> Documentation</a>
            <a href="#"><mat-icon>arrow_right</mat-icon> FAQ</a>
            <a href="#"><mat-icon>arrow_right</mat-icon> Contact Support</a>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; 2025 NIT Warangal. All rights reserved.</p>
          <p>Academic Records Management System • v2.5.14</p>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .landing-container {
      width: 100%;
      overflow-x: hidden;
      position: relative;
    }

    /* Animated Particles */
    .particles {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100vh;
      pointer-events: none;
      z-index: 0;
    }

    .particle {
      position: absolute;
      width: 4px;
      height: 4px;
      background: rgba(255, 255, 255, 0.5);
      border-radius: 50%;
      animation: particleFloat 10s infinite ease-in-out;
    }

    @keyframes particleFloat {
      0%, 100% { transform: translateY(0) translateX(0); opacity: 0; }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% { transform: translateY(-100vh) translateX(50px); opacity: 0; }
    }

    /* Hero Section */
    .hero-section {
      position: relative;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0a0e1a 0%, #1e293b 50%, #0f172a 100%);
      color: white;
      text-align: center;
      overflow: hidden;
    }

    .hero-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: 
        radial-gradient(circle at 20% 50%, rgba(56, 189, 248, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.15) 0%, transparent 50%);
      animation: pulse 15s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.8; }
    }

    .hero-content {
      position: relative;
      z-index: 1;
      max-width: 900px;
      padding: 2rem;
    }

    .animate-in {
      animation: fadeInUp 1s ease-out forwards;
      opacity: 0;
    }

    .delay-1 { animation-delay: 0.2s; }
    .delay-2 { animation-delay: 0.4s; }
    .delay-3 { animation-delay: 0.6s; }
    .delay-4 { animation-delay: 0.8s; }

    @keyframes fadeInUp {
      to {
        opacity: 1;
        transform: translateY(0);
      }
      from {
        opacity: 0;
        transform: translateY(30px);
      }
    }

    .logo-section {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .logo-glow {
      width: 100px;
      height: 100px;
      background: rgba(255, 215, 0, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: glow 2s infinite alternate;
    }

    @keyframes glow {
      from { box-shadow: 0 0 20px rgba(255, 215, 0, 0.3); }
      to { box-shadow: 0 0 40px rgba(255, 215, 0, 0.6); }
    }

    .logo-icon {
      font-size: 4.5rem;
      width: 4.5rem;
      height: 4.5rem;
      color: #ffd700;
    }

    .main-title {
      font-size: 4.5rem;
      font-weight: 800;
      margin: 0;
      text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.3);
      letter-spacing: -2px;
      background: linear-gradient(45deg, #fff, #ffd700);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .subtitle {
      font-size: 2.2rem;
      font-weight: 400;
      margin: 1.5rem 0;
      opacity: 0.95;
      letter-spacing: 0.5px;
    }

    .hero-description {
      font-size: 1.3rem;
      margin: 2rem auto;
      max-width: 700px;
      line-height: 1.8;
      opacity: 0.95;
      font-weight: 300;
    }

    .cta-buttons {
      display: flex;
      gap: 1.5rem;
      justify-content: center;
      margin: 3rem 0 2rem;
      flex-wrap: wrap;
    }

    .cta-btn {
      padding: 1.2rem 3rem !important;
      font-size: 1.1rem !important;
      font-weight: 600 !important;
      border-radius: 50px !important;
      text-transform: none;
      letter-spacing: 0.5px;
      transition: all 0.3s ease !important;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    }

    .cta-btn.primary {
      background: rgba(56, 189, 248, 0.15) !important;
      color: #38bdf8 !important;
      border: 2px solid rgba(56, 189, 248, 0.4) !important;
    }

    .cta-btn.primary:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    }

    .cta-btn.secondary {
      background: rgba(255, 255, 255, 0.15) !important;
      color: white !important;
      border: 2px solid white !important;
      backdrop-filter: blur(10px);
    }

    .cta-btn.secondary:hover {
      background: rgba(255, 255, 255, 0.25) !important;
      transform: translateY(-3px);
    }

    /* Stats Row */
    .stats-row {
      display: flex;
      justify-content: center;
      gap: 4rem;
      margin-top: 4rem;
      flex-wrap: wrap;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .stat-item mat-icon {
      font-size: 2.5rem;
      width: 2.5rem;
      height: 2.5rem;
      color: #ffd700;
    }

    .stat-number {
      font-size: 2rem;
      font-weight: 700;
      color: white;
    }

    .stat-label {
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.8);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    /* Scroll Indicator */
    .scroll-indicator {
      position: absolute;
      bottom: 2rem;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .scroll-line {
      width: 2px;
      height: 40px;
      background: linear-gradient(to bottom, transparent, white);
      animation: scrollLine 2s infinite;
    }

    @keyframes scrollLine {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 1; }
    }

    .scroll-indicator mat-icon {
      font-size: 2.5rem;
      width: 2.5rem;
      height: 2.5rem;
      opacity: 0.7;
      animation: bounce 2s infinite;
    }

    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-10px); }
      60% { transform: translateY(-5px); }
    }

    /* Section Common Styles */
    .section-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 5rem 2rem;
    }

    .section-header {
      text-align: center;
      margin-bottom: 4rem;
    }

    .section-badge {
      display: inline-block;
      padding: 0.5rem 1.5rem;
      background: linear-gradient(135deg, #38bdf8 0%, #8b5cf6 100%);
      color: white;
      border-radius: 50px;
      font-size: 0.85rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 1rem;
    }

    .section-title {
      font-size: 3rem;
      font-weight: 800;
      margin: 1rem 0;
      color: #e2e8f0;
      letter-spacing: -1px;
    }

    .section-title.white {
      color: white;
    }

    .section-subtitle {
      font-size: 1.2rem;
      color: #94a3b8;
      margin: 0;
      font-weight: 300;
    }

    .section-subtitle.white {
      color: rgba(255, 255, 255, 0.9);
    }

    /* Features Section */
    .features-section {
      background: linear-gradient(to bottom, #0f172a 0%, #1e293b 100%);
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 2rem;
    }

    .feature-card {
      position: relative;
      text-align: center;
      padding: 3rem 2rem !important;
      transition: all 0.4s ease;
      border-radius: 20px !important;
      border: 1px solid rgba(56, 189, 248, 0.15);
      background: rgba(15, 23, 42, 0.8) !important;
      overflow: hidden;
    }

    .feature-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #38bdf8, #8b5cf6);
      transform: scaleX(0);
      transition: transform 0.4s ease;
    }

    .feature-card:hover::before {
      transform: scaleX(1);
    }

    .feature-card:hover {
      transform: translateY(-12px);
      box-shadow: 0 20px 40px rgba(56, 189, 248, 0.15) !important;
      border-color: rgba(56, 189, 248, 0.4);
    }

    .feature-icon-wrapper {
      width: 90px;
      height: 90px;
      margin: 0 auto 1.5rem;
      background: linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(139, 92, 246, 0.1));
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.4s ease;
    }

    .feature-card:hover .feature-icon-wrapper {
      transform: rotateY(180deg);
    }

    .feature-icon {
      font-size: 3rem;
      width: 3rem;
      height: 3rem;
    }

    .feature-icon.security { color: #667eea; }
    .feature-icon.verified { color: #4caf50; }
    .feature-icon.transparent { color: #2196f3; }
    .feature-icon.accessible { color: #ff9800; }
    .feature-icon.automated { color: #9c27b0; }
    .feature-icon.decentralized { color: #00bcd4; }

    .feature-card h3 {
      font-size: 1.4rem;
      margin: 1rem 0;
      color: #e2e8f0;
      font-weight: 700;
    }

    .feature-card p {
      color: #94a3b8;
      line-height: 1.7;
      margin-bottom: 1rem;
    }

    .feature-badge {
      display: inline-block;
      padding: 0.4rem 1rem;
      background: rgba(56, 189, 248, 0.1);
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      color: #38bdf8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* How It Works Section */
    .how-it-works-section {
      background: #0f172a;
    }

    .steps-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 3rem;
      position: relative;
    }

    .step {
      text-align: center;
      padding: 2rem;
      position: relative;
    }

    .step-number {
      position: absolute;
      top: -10px;
      right: 20px;
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, #38bdf8 0%, #8b5cf6 100%);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-weight: 700;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
      z-index: 2;
    }

    .step-icon-bg {
      width: 100px;
      height: 100px;
      margin: 0 auto 2rem;
      background: linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(139, 92, 246, 0.1));
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.4s ease;
    }

    .step:hover .step-icon-bg {
      transform: scale(1.1) rotate(10deg);
      box-shadow: 0 8px 25px rgba(56, 189, 248, 0.3);
    }

    .step-icon {
      font-size: 3rem;
      width: 3rem;
      height: 3rem;
      color: #38bdf8;
    }

    .step-content h3 {
      font-size: 1.4rem;
      margin-bottom: 1rem;
      color: #e2e8f0;
      font-weight: 700;
    }

    .step-content p {
      color: #94a3b8;
      line-height: 1.7;
    }

    .step-connector {
      position: absolute;
      top: 50%;
      right: -1.5rem;
      width: 3rem;
      height: 2px;
      background: linear-gradient(90deg, #38bdf8, transparent);
      transform: translateY(-50%);
    }

    /* Quick Actions Section */
    .quick-actions-section {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      position: relative;
      overflow: hidden;
    }

    .quick-actions-section::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: 
        radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 70% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 2rem;
      position: relative;
      z-index: 1;
    }

    .action-card {
      position: relative;
      padding: 0 !important;
      border-radius: 24px !important;
      background: rgba(15, 23, 42, 0.9) !important;
      overflow: hidden;
      transition: all 0.4s ease;
    }

    .action-card-bg {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 8px;
      background: linear-gradient(90deg, #38bdf8, #8b5cf6);
      transform: scaleX(0);
      transform-origin: left;
      transition: transform 0.4s ease;
    }

    .action-card:hover .action-card-bg {
      transform: scaleX(1);
    }

    .action-card:hover {
      transform: translateY(-15px);
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3) !important;
    }

    .action-content {
      padding: 3rem 2.5rem;
    }

    .icon-badge {
      width: 100px;
      height: 100px;
      margin: 0 auto 2rem;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.4s ease;
    }

    .action-card:hover .icon-badge {
      transform: scale(1.1) rotate(10deg);
    }

    .action-icon {
      font-size: 4rem;
      width: 4rem;
      height: 4rem;
    }

    .verifier-card .action-icon { color: #38bdf8; }
    .login-card .action-icon { color: #8b5cf6; }

    .action-card h3 {
      font-size: 2rem;
      margin-bottom: 1rem;
      color: #e2e8f0;
      font-weight: 700;
    }

    .action-card p {
      color: #94a3b8;
      margin-bottom: 1.5rem;
      line-height: 1.7;
    }

    .action-features {
      display: flex;
      flex-direction: column;
      gap: 0.8rem;
      margin-bottom: 2rem;
    }

    .action-features span {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #666;
      font-size: 0.95rem;
    }

    .action-features mat-icon {
      font-size: 1.2rem;
      width: 1.2rem;
      height: 1.2rem;
      color: #4caf50;
    }

    .action-card button {
      width: 100%;
      padding: 1rem 2rem !important;
      border-radius: 12px !important;
      font-weight: 600 !important;
      font-size: 1.1rem !important;
    }

    /* Technology Section */
    .technology-section {
      background: linear-gradient(to bottom, #1e293b 0%, #0f172a 100%);
    }

    .tech-stack {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
    }

    .tech-item {
      text-align: center;
      padding: 2rem;
      background: rgba(15, 23, 42, 0.8);
      border-radius: 16px;
      border: 1px solid rgba(56, 189, 248, 0.15);
      transition: all 0.3s ease;
    }

    .tech-item:hover {
      transform: translateY(-8px);
      border-color: rgba(56, 189, 248, 0.4);
      box-shadow: 0 12px 30px rgba(56, 189, 248, 0.15);
    }

    .tech-icon-wrapper {
      width: 80px;
      height: 80px;
      margin: 0 auto 1.5rem;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    }

    .tech-item:hover .tech-icon-wrapper {
      transform: rotateY(180deg);
    }

    .tech-icon-wrapper mat-icon {
      font-size: 2.5rem;
      width: 2.5rem;
      height: 2.5rem;
      color: #667eea;
    }

    .tech-item span {
      display: block;
      font-weight: 700;
      font-size: 1.1rem;
      color: #e2e8f0;
      margin-bottom: 0.5rem;
    }

    .tech-item p {
      color: #94a3b8;
      font-size: 0.95rem;
      margin: 0;
    }

    /* Footer */
    .footer {
      background: linear-gradient(135deg, #0a0e1a 0%, #0f172a 100%);
      color: white;
      padding: 4rem 0 1.5rem;
    }

    .footer-content {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 3rem;
      padding: 0 2rem 3rem;
    }

    .footer-logo {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .footer-logo mat-icon {
      font-size: 2.5rem;
      width: 2.5rem;
      height: 2.5rem;
      color: #ffd700;
    }

    .footer-section h4 {
      margin: 0 0 1.5rem 0;
      color: #ffd700;
      font-size: 1.2rem;
      font-weight: 700;
    }

    .footer-section p {
      color: #ecf0f1;
      line-height: 1.8;
      margin: 0.5rem 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .footer-section p mat-icon {
      font-size: 1.2rem;
      width: 1.2rem;
      height: 1.2rem;
      color: #4caf50;
    }

    .footer-section a {
      color: #ecf0f1;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0;
      transition: all 0.3s ease;
    }

    .footer-section a mat-icon {
      font-size: 1.2rem;
      width: 1.2rem;
      height: 1.2rem;
      color: #38bdf8;
      transition: all 0.3s ease;
    }

    .footer-section a:hover {
      color: #ffd700;
      transform: translateX(5px);
    }

    .footer-section a:hover mat-icon {
      color: #ffd700;
    }

    .footer-social {
      display: flex;
      gap: 0.5rem;
      margin-top: 1rem;
    }

    .footer-social button {
      color: #ecf0f1;
      transition: all 0.3s ease;
    }

    .footer-social button:hover {
      background: rgba(255, 215, 0, 0.2);
      color: #ffd700;
    }

    .footer-bottom {
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding: 2rem 2rem 0;
      text-align: center;
      color: #95a5a6;
    }

    .footer-bottom p {
      margin: 0.5rem 0;
      font-size: 0.95rem;
    }

    /* Responsive Design */
    @media (max-width: 1024px) {
      .actions-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .main-title {
        font-size: 2.8rem;
      }

      .subtitle {
        font-size: 1.6rem;
      }

      .hero-description {
        font-size: 1.1rem;
      }

      .cta-buttons {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
      }

      .stats-row {
        gap: 2rem;
      }

      .section-title {
        font-size: 2.2rem;
      }

      .features-grid {
        grid-template-columns: 1fr;
      }

      .steps-container {
        grid-template-columns: 1fr;
      }

      .step-connector {
        display: none;
      }

      .tech-stack {
        grid-template-columns: 1fr;
      }

      .footer-content {
        grid-template-columns: 1fr;
        gap: 2rem;
      }
    }

    @media (max-width: 480px) {
      .logo-section {
        flex-direction: column;
        gap: 1rem;
      }

      .main-title {
        font-size: 2.2rem;
      }

      .subtitle {
        font-size: 1.3rem;
      }

      .section-container {
        padding: 3rem 1.5rem;
      }
    }
  `]
})
export class LandingComponent {
  particles = Array.from({ length: 50 }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 5
  }));

  features = [
    { icon: 'security', class: 'security', title: 'Immutable Security', description: 'Records stored on blockchain cannot be altered or tampered with, ensuring lifetime authenticity', badge: 'Secure' },
    { icon: 'verified_user', class: 'verified', title: 'Instant Verification', description: 'Anyone can verify certificates instantly without contacting the institution', badge: 'Fast' },
    { icon: 'visibility', class: 'transparent', title: 'Full Transparency', description: 'Complete audit trail of all academic records with timestamp verification', badge: 'Transparent' },
    { icon: 'public', class: 'accessible', title: 'Global Access', description: 'Access your records from anywhere in the world, 24/7', badge: 'Accessible' },
    { icon: 'settings_suggest', class: 'automated', title: 'Automated Workflow', description: 'Streamlined approval process with role-based access control', badge: 'Efficient' },
    { icon: 'hub', class: 'decentralized', title: 'Decentralized Storage', description: 'No single point of failure - distributed ledger technology ensures reliability', badge: 'Reliable' }
  ];

  steps = [
    { icon: 'create', title: 'Record Creation', description: 'Departments create academic records with validated course information' },
    { icon: 'admin_panel_settings', title: 'Admin Approval', description: 'Authorized administrators review and approve records on the blockchain' },
    { icon: 'storage', title: 'Blockchain Storage', description: 'Approved records are immutably stored on Hyperledger Fabric network' },
    { icon: 'verified', title: 'Public Verification', description: 'Anyone can verify certificates using our public verification portal' }
  ];

  techStack = [
    { icon: 'storage', name: 'Hyperledger Fabric 2.5', description: 'Enterprise blockchain framework' },
    { icon: 'code', name: 'Smart Contracts', description: 'Automated business logic' },
    { icon: 'cloud', name: 'Distributed Ledger', description: 'Decentralized data storage' },
    { icon: 'lock', name: 'Cryptographic Security', description: 'Military-grade encryption' }
  ];

  constructor(private router: Router) { }
}

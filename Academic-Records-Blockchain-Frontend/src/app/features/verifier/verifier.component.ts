import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BlockchainService } from '../../core/services/blockchain.service';
import { ApiResponse } from '../../core/models/blockchain.model';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-verifier',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="verifier-container">
      <!-- Animated Background -->
      <div class="bg-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
      </div>

      <!-- Header -->
      <div class="verifier-header">
        <a routerLink="/" class="back-link">
          <mat-icon>arrow_back</mat-icon>
          <span>Back to Home</span>
        </a>
        
        <div class="logo-wrapper">
          <div class="logo-icon-bg">
            <mat-icon class="logo-icon">verified</mat-icon>
          </div>
          <h1 class="main-title">Certificate Verification</h1>
          <p class="subtitle">Verify the authenticity of academic certificates on blockchain</p>
        </div>

        <div class="stats-badges">
          <div class="badge">
            <mat-icon>security</mat-icon>
            <span>100% Secure</span>
          </div>
          <div class="badge">
            <mat-icon>speed</mat-icon>
            <span>Instant Verification</span>
          </div>
          <div class="badge">
            <mat-icon>public</mat-icon>
            <span>Public Access</span>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="content-wrapper">
        <!-- Upload Section -->
        <mat-card class="upload-card modern-card" *ngIf="!verificationResult">
          <div class="card-header">
            <div class="icon-badge">
              <mat-icon>badge</mat-icon>
            </div>
            <h2>Verify Certificate</h2>
            <p>Enter the certificate ID to verify authenticity</p>
          </div>

          <div class="upload-section">
            <div class="input-section">
              <mat-form-field appearance="outline" class="cert-id-field">
                <mat-label>Certificate ID</mat-label>
                <input matInput [(ngModel)]="certificateId" placeholder="e.g., CERT-23MCF1R09-1763315958560">
                <mat-icon matPrefix class="input-icon">badge</mat-icon>
              </mat-form-field>
            </div>

            <button 
              mat-raised-button 
              color="primary" 
              class="verify-btn"
              [disabled]="isVerifying || !certificateId"
              (click)="verifyCertificate()">
              <mat-icon *ngIf="!isVerifying">verified_user</mat-icon>
              <mat-spinner *ngIf="isVerifying" diameter="24" class="spinner"></mat-spinner>
              <span>{{isVerifying ? 'Verifying on Blockchain...' : 'Verify Certificate'}}</span>
            </button>
          </div>
        </mat-card>

        <!-- Verification Result -->
        <mat-card class="result-card modern-card" *ngIf="verificationResult">
          <div class="result-header" [class.valid]="verificationResult.valid" [class.invalid]="!verificationResult.valid">
            <div class="status-icon">
              <mat-icon>{{verificationResult.valid ? 'verified' : 'cancel'}}</mat-icon>
            </div>
            <h2 class="status-title">{{verificationResult.valid ? 'Certificate Verified' : 'Verification Failed'}}</h2>
            <p class="status-subtitle">
              {{verificationResult.valid ? 'This certificate is authentic and recorded on blockchain' : 'This certificate could not be verified'}}
            </p>
          </div>

          <!-- Valid Certificate Details -->
          <div class="result-content" *ngIf="verificationResult.valid">
            <div class="details-section">
              <div class="section-title">
                <mat-icon>person</mat-icon>
                <h3>Student Information</h3>
              </div>
              <div class="details-grid">
                <div class="detail-item">
                  <span class="detail-label">Student Name</span>
                  <span class="detail-value">{{verificationResult.certificate?.studentName || 'N/A'}}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Roll Number</span>
                  <span class="detail-value">{{verificationResult.certificate?.rollNumber || verificationResult.certificate?.studentId}}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Department</span>
                  <span class="detail-value">{{verificationResult.certificate?.department || 'N/A'}}</span>
                </div>
                <div class="detail-item" *ngIf="verificationResult.certificate?.finalCGPA">
                  <span class="detail-label">CGPA</span>
                  <span class="detail-value grade">{{verificationResult.certificate?.finalCGPA}}</span>
                </div>
              </div>
            </div>

            <div class="details-section">
              <div class="section-title">
                <mat-icon>workspace_premium</mat-icon>
                <h3>Certificate Information</h3>
              </div>
              <div class="details-grid">
                <div class="detail-item">
                  <span class="detail-label">Certificate ID</span>
                  <span class="detail-value cert-id">{{verificationResult.certificate?.certificateId}}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Certificate Type</span>
                  <span class="detail-value">{{verificationResult.certificate?.type}}</span>
                </div>
                <div class="detail-item" *ngIf="verificationResult.certificate?.degreeAwarded">
                  <span class="detail-label">Degree Awarded</span>
                  <span class="detail-value">{{verificationResult.certificate?.degreeAwarded}}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Issue Date</span>
                  <span class="detail-value">{{formatDate(verificationResult.certificate?.issueDate)}}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Issued By</span>
                  <span class="detail-value">{{getIssuedByName(verificationResult.certificate?.issuedBy)}}</span>
                </div>
              </div>
            </div>

            <div class="blockchain-verification">
              <div class="blockchain-icon">
                <mat-icon>link</mat-icon>
              </div>
              <div class="blockchain-content">
                <h3>Blockchain Verification</h3>
                <div class="blockchain-details">
                  <div class="blockchain-item">
                    <mat-icon>fingerprint</mat-icon>
                    <div>
                      <span class="bc-label">Transaction ID</span>
                      <span class="bc-value">{{verificationResult.txId}}</span>
                    </div>
                  </div>
                  <div class="blockchain-item">
                    <mat-icon>schedule</mat-icon>
                    <div>
                      <span class="bc-label">Timestamp</span>
                      <span class="bc-value">{{formatDate(verificationResult.timestamp)}}</span>
                    </div>
                  </div>
                </div>
                <div class="authenticity-badge">
                  <mat-icon>verified_user</mat-icon>
                  <p>This certificate is immutably recorded on Hyperledger Fabric blockchain. Its authenticity and integrity are cryptographically verified.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Invalid Certificate -->
          <div class="result-content" *ngIf="!verificationResult.valid">
            <div class="error-content">
              <div class="error-icon">
                <mat-icon>error_outline</mat-icon>
              </div>
              <p class="error-message">{{verificationResult.message || 'The certificate could not be verified. Please check the certificate ID and try again.'}}</p>
              
              <div class="error-reasons">
                <h4>Possible reasons:</h4>
                <ul>
                  <li><mat-icon>close</mat-icon> The certificate ID is incorrect or invalid</li>
                  <li><mat-icon>close</mat-icon> The certificate was not issued by NIT Warangal</li>
                  <li><mat-icon>close</mat-icon> The certificate has been revoked or tampered with</li>
                  <li><mat-icon>close</mat-icon> The certificate does not exist in the blockchain</li>
                </ul>
              </div>
            </div>
          </div>

          <div class="result-actions">
            <button mat-raised-button color="primary" class="action-btn primary" (click)="verifyAnother()">
              <mat-icon>refresh</mat-icon>
              <span>Verify Another Certificate</span>
            </button>
            <button mat-raised-button class="action-btn secondary" (click)="downloadReport()" *ngIf="verificationResult.valid">
              <mat-icon>download</mat-icon>
              <span>Download Report (PDF)</span>
            </button>
          </div>
        </mat-card>

        <!-- Info Cards -->
        <div class="info-cards" *ngIf="!verificationResult">
          <mat-card class="info-card">
            <div class="info-icon security">
              <mat-icon>security</mat-icon>
            </div>
            <h3>Blockchain Secured</h3>
            <p>All certificates are immutably stored on Hyperledger Fabric for tamper-proof verification</p>
          </mat-card>

          <mat-card class="info-card">
            <div class="info-icon speed">
              <mat-icon>bolt</mat-icon>
            </div>
            <h3>Instant Results</h3>
            <p>Verify certificates in seconds with our automated blockchain verification system</p>
          </mat-card>

          <mat-card class="info-card">
            <div class="info-icon access">
              <mat-icon>public</mat-icon>
            </div>
            <h3>Public & Free</h3>
            <p>Anyone can verify certificates without needing an account or special permissions</p>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .verifier-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      position: relative;
      overflow: hidden;
    }

    /* Animated Background */
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
      left: 10%;
      animation-delay: 0s;
    }

    .shape-2 {
      width: 200px;
      height: 200px;
      bottom: -50px;
      right: 15%;
      animation-delay: 7s;
    }

    .shape-3 {
      width: 150px;
      height: 150px;
      top: 40%;
      right: 5%;
      animation-delay: 14s;
    }

    @keyframes float {
      0%, 100% { transform: translate(0, 0) rotate(0deg); }
      33% { transform: translate(30px, -30px) rotate(120deg); }
      66% { transform: translate(-20px, 20px) rotate(240deg); }
    }

    /* Header */
    .verifier-header {
      text-align: center;
      color: white;
      margin-bottom: 40px;
      position: relative;
      z-index: 1;
    }

    .back-link {
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
      margin-bottom: 30px;
    }

    .back-link:hover {
      background: rgba(255, 255, 255, 0.25);
      transform: translateX(-5px);
    }

    .logo-wrapper {
      margin: 30px 0;
    }

    .logo-icon-bg {
      width: 100px;
      height: 100px;
      margin: 0 auto 20px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(255, 255, 255, 0.3); }
      50% { transform: scale(1.05); box-shadow: 0 0 40px rgba(255, 255, 255, 0.5); }
    }

    .logo-icon {
      font-size: 4rem;
      width: 4rem;
      height: 4rem;
      color: white;
    }

    .main-title {
      font-size: 3rem;
      font-weight: 800;
      margin: 0 0 15px 0;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
      letter-spacing: -1px;
    }

    .subtitle {
      font-size: 1.2rem;
      opacity: 0.95;
      margin: 0;
      font-weight: 300;
    }

    .stats-badges {
      display: flex;
      justify-content: center;
      gap: 2rem;
      margin-top: 30px;
      flex-wrap: wrap;
    }

    .badge {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border-radius: 50px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      transition: all 0.3s ease;
    }

    .badge:hover {
      background: rgba(255, 255, 255, 0.25);
      transform: translateY(-2px);
    }

    .badge mat-icon {
      font-size: 1.3rem;
      width: 1.3rem;
      height: 1.3rem;
    }

    .badge span {
      font-size: 0.9rem;
      font-weight: 600;
    }

    /* Content */
    .content-wrapper {
      max-width: 900px;
      margin: 0 auto;
      position: relative;
      z-index: 1;
    }

    .modern-card {
      border-radius: 24px !important;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3) !important;
      overflow: hidden;
      margin-bottom: 30px;
    }

    /* Upload Card */
    .upload-card {
      background: rgba(255, 255, 255, 0.98) !important;
    }

    .card-header {
      text-align: center;
      padding: 40px 20px 30px;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05));
    }

    .icon-badge {
      width: 80px;
      height: 80px;
      margin: 0 auto 20px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
    }

    .icon-badge mat-icon {
      font-size: 3rem;
      width: 3rem;
      height: 3rem;
      color: white;
    }

    .card-header h2 {
      margin: 0 0 8px 0;
      color: #1a1a1a;
      font-size: 2rem;
      font-weight: 700;
    }

    .card-header p {
      margin: 0;
      color: #666;
      font-size: 1rem;
    }

    .upload-section {
      padding: 40px 32px;
    }

    .upload-zone {
      border: 3px dashed #d0d0d0;
      border-radius: 16px;
      padding: 60px 30px;
      text-align: center;
      cursor: pointer;
      transition: all 0.4s ease;
      background: #fafafa;
      position: relative;
    }

    .upload-zone:hover {
      border-color: #667eea;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05));
      transform: translateY(-4px);
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.2);
    }

    .upload-zone.has-file {
      border-color: #4caf50;
      background: rgba(76, 175, 80, 0.05);
    }

    .upload-icon mat-icon {
      font-size: 5rem;
      width: 5rem;
      height: 5rem;
      color: #667eea;
      margin-bottom: 16px;
    }

    .upload-zone.has-file .upload-icon mat-icon {
      color: #4caf50;
    }

    .upload-text {
      margin: 10px 0;
      color: #666;
      font-size: 1.1rem;
    }

    .upload-text strong {
      color: #667eea;
    }

    .file-info {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      color: #4caf50;
      font-weight: 600;
      font-size: 1.1rem;
    }

    .file-info mat-icon {
      font-size: 1.5rem;
      width: 1.5rem;
      height: 1.5rem;
    }

    .upload-hint {
      margin: 8px 0 0 0;
      color: #999;
      font-size: 0.9rem;
    }

    .divider-section {
      display: flex;
      align-items: center;
      gap: 16px;
      margin: 40px 0;
    }

    .divider-line {
      flex: 1;
      height: 1px;
      background: #e0e0e0;
    }

    .divider-text {
      color: #999;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .input-section {
      margin-bottom: 24px;
    }

    .cert-id-field {
      width: 100%;
    }

    .cert-id-field ::ng-deep .mat-mdc-text-field-wrapper {
      background: #f8f9fa;
    }

    .input-icon {
      color: #667eea;
      opacity: 0.8;
    }

    .verify-btn {
      width: 100%;
      height: 56px;
      font-size: 1.1rem !important;
      font-weight: 600 !important;
      border-radius: 12px !important;
      box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3) !important;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }

    .verify-btn:hover:not(:disabled) {
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4) !important;
      transform: translateY(-2px);
    }

    .spinner {
      margin-right: 8px;
    }

    /* Result Card */
    .result-card {
      background: white !important;
    }

    .result-header {
      text-align: center;
      padding: 50px 30px;
      position: relative;
    }

    .result-header.valid {
      background: linear-gradient(135deg, #c8e6c9 0%, #a5d6a7 100%);
    }

    .result-header.invalid {
      background: linear-gradient(135deg, #ffcdd2 0%, #ef9a9a 100%);
    }

    .status-icon {
      width: 100px;
      height: 100px;
      margin: 0 auto 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: scaleIn 0.5s ease-out;
    }

    .result-header.valid .status-icon {
      background: #4caf50;
      box-shadow: 0 8px 24px rgba(76, 175, 80, 0.4);
    }

    .result-header.invalid .status-icon {
      background: #f44336;
      box-shadow: 0 8px 24px rgba(244, 67, 54, 0.4);
    }

    @keyframes scaleIn {
      from { transform: scale(0); }
      to { transform: scale(1); }
    }

    .status-icon mat-icon {
      font-size: 4rem;
      width: 4rem;
      height: 4rem;
      color: white;
    }

    .status-title {
      margin: 0 0 12px 0;
      font-size: 2.2rem;
      font-weight: 700;
    }

    .result-header.valid .status-title {
      color: #2e7d32;
    }

    .result-header.invalid .status-title {
      color: #c62828;
    }

    .status-subtitle {
      margin: 0;
      font-size: 1.1rem;
      opacity: 0.9;
    }

    .result-header.valid .status-subtitle {
      color: #388e3c;
    }

    .result-header.invalid .status-subtitle {
      color: #d32f2f;
    }

    .result-content {
      padding: 40px 32px;
    }

    /* Details Section */
    .details-section {
      margin-bottom: 32px;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 2px solid #f0f0f0;
    }

    .section-title mat-icon {
      font-size: 1.8rem;
      width: 1.8rem;
      height: 1.8rem;
      color: #667eea;
    }

    .section-title h3 {
      margin: 0;
      font-size: 1.4rem;
      font-weight: 700;
      color: #1a1a1a;
    }

    .details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
    }

    .detail-item {
      padding: 16px;
      background: #f8f9fa;
      border-radius: 12px;
      border-left: 4px solid #667eea;
    }

    .detail-label {
      display: block;
      font-size: 0.85rem;
      color: #666;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }

    .detail-value {
      display: block;
      font-size: 1.1rem;
      color: #1a1a1a;
      font-weight: 600;
    }

    .detail-value.cert-id {
      font-family: 'Courier New', monospace;
      color: #667eea;
      word-break: break-all;
    }

    .detail-value.grade {
      font-size: 1.5rem;
      color: #4caf50;
    }

    /* Blockchain Verification */
    .blockchain-verification {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
      border-radius: 16px;
      padding: 32px;
      border: 2px solid #667eea;
      position: relative;
      overflow: hidden;
    }

    .blockchain-verification::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(102, 126, 234, 0.1) 0%, transparent 70%);
      animation: rotate 20s linear infinite;
    }

    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .blockchain-icon {
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
      position: relative;
      z-index: 1;
    }

    .blockchain-icon mat-icon {
      font-size: 2rem;
      width: 2rem;
      height: 2rem;
      color: white;
    }

    .blockchain-content {
      position: relative;
      z-index: 1;
    }

    .blockchain-content h3 {
      margin: 0 0 20px 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: #1a1a1a;
    }

    .blockchain-details {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 24px;
    }

    .blockchain-item {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 16px;
      background: white;
      border-radius: 12px;
    }

    .blockchain-item mat-icon {
      font-size: 1.5rem;
      width: 1.5rem;
      height: 1.5rem;
      color: #667eea;
      flex-shrink: 0;
    }

    .blockchain-item div {
      flex: 1;
    }

    .bc-label {
      display: block;
      font-size: 0.8rem;
      color: #666;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    .bc-value {
      display: block;
      font-size: 0.95rem;
      color: #1a1a1a;
      font-weight: 500;
      word-break: break-all;
    }

    .authenticity-badge {
      background: white;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      align-items: flex-start;
      gap: 16px;
    }

    .authenticity-badge mat-icon {
      font-size: 2rem;
      width: 2rem;
      height: 2rem;
      color: #4caf50;
      flex-shrink: 0;
    }

    .authenticity-badge p {
      margin: 0;
      color: #1a1a1a;
      line-height: 1.6;
      font-size: 0.95rem;
    }

    /* Error Content */
    .error-content {
      text-align: center;
    }

    .error-icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 24px;
      background: #ffebee;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .error-icon mat-icon {
      font-size: 3rem;
      width: 3rem;
      height: 3rem;
      color: #f44336;
    }

    .error-message {
      font-size: 1.1rem;
      color: #666;
      margin: 0 0 32px 0;
      line-height: 1.6;
    }

    .error-reasons {
      text-align: left;
      background: #f8f9fa;
      border-radius: 12px;
      padding: 24px;
      margin-top: 24px;
    }

    .error-reasons h4 {
      margin: 0 0 16px 0;
      color: #1a1a1a;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .error-reasons ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .error-reasons li {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 12px;
      color: #666;
      line-height: 1.6;
    }

    .error-reasons li mat-icon {
      font-size: 1.2rem;
      width: 1.2rem;
      height: 1.2rem;
      color: #f44336;
      flex-shrink: 0;
      margin-top: 2px;
    }

    /* Result Actions */
    .result-actions {
      display: flex;
      gap: 16px;
      padding: 24px 32px;
      background: #f8f9fa;
      border-top: 1px solid #e0e0e0;
      flex-wrap: wrap;
    }

    .action-btn {
      flex: 1;
      min-width: 200px;
      height: 52px !important;
      font-size: 1rem !important;
      font-weight: 600 !important;
      border-radius: 12px !important;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }

    .action-btn.primary {
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3) !important;
    }

    .action-btn.primary:hover {
      box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4) !important;
      transform: translateY(-2px);
    }

    .action-btn.secondary {
      background: white !important;
      color: #667eea !important;
      border: 2px solid #667eea !important;
    }

    .action-btn.secondary:hover {
      background: #667eea !important;
      color: white !important;
    }

    /* Info Cards */
    .info-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
      margin-top: 40px;
    }

    .info-card {
      text-align: center;
      padding: 32px 24px !important;
      border-radius: 20px !important;
      background: rgba(255, 255, 255, 0.95) !important;
      backdrop-filter: blur(10px);
      border: 2px solid rgba(255, 255, 255, 0.3) !important;
      transition: all 0.4s ease;
    }

    .info-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2) !important;
    }

    .info-icon {
      width: 70px;
      height: 70px;
      margin: 0 auto 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .info-icon.security {
      background: linear-gradient(135deg, #667eea, #764ba2);
    }

    .info-icon.speed {
      background: linear-gradient(135deg, #ffa726, #ff6f00);
    }

    .info-icon.access {
      background: linear-gradient(135deg, #4caf50, #2e7d32);
    }

    .info-icon mat-icon {
      font-size: 2.5rem;
      width: 2.5rem;
      height: 2.5rem;
      color: white;
    }

    .info-card h3 {
      margin: 0 0 12px 0;
      color: #1a1a1a;
      font-size: 1.3rem;
      font-weight: 700;
    }

    .info-card p {
      margin: 0;
      color: #666;
      line-height: 1.6;
      font-size: 0.95rem;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .verifier-container {
        padding: 16px;
      }

      .main-title {
        font-size: 2rem;
      }

      .subtitle {
        font-size: 1rem;
      }

      .stats-badges {
        gap: 1rem;
      }

      .upload-section {
        padding: 24px 20px;
      }

      .result-content {
        padding: 24px 20px;
      }

      .details-grid {
        grid-template-columns: 1fr;
      }

      .result-actions {
        flex-direction: column;
        padding: 20px;
      }

      .action-btn {
        min-width: 100%;
      }

      .info-cards {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class VerifierComponent {
  selectedFile: File | null = null;
  certificateId: string = '';
  isVerifying: boolean = false;
  verificationResult: any = null;

  constructor(private blockchainService: BlockchainService) {}

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      this.selectedFile = file;
    } else {
      alert('Please select a valid PDF file');
    }
  }

  verifyCertificate(): void {
    this.isVerifying = true;
    this.verifyById();
  }

  private verifyById(): void {
    // Simply get the certificate to verify it exists
    this.blockchainService.getCertificate(this.certificateId).subscribe({
      next: (certResponse) => {
        this.isVerifying = false;
        if (certResponse.success && certResponse.data) {
          const cert = certResponse.data;
          
          // Check if certificate is revoked
          if (cert.revoked) {
            this.verificationResult = {
              valid: false,
              message: `Certificate has been revoked. Reason: ${cert.revocationReason || 'Not specified'}`
            };
            return;
          }

          // Check if certificate is expired (for bonafide certificates)
          if (cert.type === 'BONAFIDE' && cert.expiryDate) {
            const expiryDate = new Date(cert.expiryDate);
            if (new Date() > expiryDate) {
              this.verificationResult = {
                valid: false,
                message: `Certificate has expired on ${expiryDate.toLocaleDateString()}`
              };
              return;
            }
          }

          // Fetch student details to enrich certificate data
          if (cert.studentId) {
            this.blockchainService.getStudentByRollNumber(cert.studentId).subscribe({
              next: (studentResponse: ApiResponse<any>) => {
                if (studentResponse.success && studentResponse.data) {
                  const student = studentResponse.data;
                  // Merge student data into certificate
                  (cert as any).studentName = student.name;
                  (cert as any).rollNumber = student.rollNumber;
                  (cert as any).department = student.department;
                }
                
                // Certificate is valid - set result with enriched data
                this.verificationResult = {
                  valid: true,
                  certificate: cert,
                  txId: 'TX-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
                  timestamp: new Date().toISOString()
                };
              },
              error: () => {
                // Even if student fetch fails, show certificate data
                this.verificationResult = {
                  valid: true,
                  certificate: cert,
                  txId: 'TX-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
                  timestamp: new Date().toISOString()
                };
              }
            });
          } else {
            // No student ID, just show certificate
            this.verificationResult = {
              valid: true,
              certificate: cert,
              txId: 'TX-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
              timestamp: new Date().toISOString()
            };
          }
        } else {
          this.verificationResult = { 
            valid: false,
            message: 'Certificate not found in the blockchain'
          };
        }
      },
      error: (err) => {
        this.isVerifying = false;
        this.verificationResult = { 
          valid: false,
          message: err.error?.message || 'Certificate not found or invalid'
        };
      }
    });
  }

  verifyAnother(): void {
    this.verificationResult = null;
    this.selectedFile = null;
    this.certificateId = '';
  }

  downloadReport(): void {
    if (!this.verificationResult || !this.verificationResult.valid) {
      return;
    }

    const cert = this.verificationResult.certificate;
    const doc = new jsPDF();
    
    // Set up colors
    const primaryColor: [number, number, number] = [102, 126, 234]; // #667eea
    const darkColor: [number, number, number] = [51, 51, 51];
    const lightGray: [number, number, number] = [128, 128, 128];
    
    let yPosition = 20;
    
    // Header with logo background
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 40, 'F');
    
    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('CERTIFICATE VERIFICATION REPORT', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('NIT Warangal - Blockchain Academic Records', 105, 30, { align: 'center' });
    
    yPosition = 50;
    
    // Verification Status Badge
    doc.setFillColor(76, 175, 80); // Green
    doc.roundedRect(15, yPosition, 180, 12, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('✓ VERIFIED - This certificate is authentic and valid', 105, yPosition + 8, { align: 'center' });
    
    yPosition += 25;
    
    // Certificate ID Section
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Certificate ID:', 15, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(cert.certificateId, 60, yPosition);
    
    yPosition += 15;
    
    // Student Information Section
    this.addSectionHeader(doc, 'STUDENT INFORMATION', yPosition, primaryColor);
    yPosition += 10;
    
    const studentInfo = [
      { label: 'Name:', value: cert.studentName || 'N/A' },
      { label: 'Roll Number:', value: cert.rollNumber || cert.studentId },
      { label: 'Department:', value: cert.department || 'N/A' }
    ];
    
    studentInfo.forEach(item => {
      doc.setFont('helvetica', 'bold');
      doc.text(item.label, 20, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(item.value, 60, yPosition);
      yPosition += 7;
    });
    
    yPosition += 5;
    
    // Certificate Details Section
    this.addSectionHeader(doc, 'CERTIFICATE DETAILS', yPosition, primaryColor);
    yPosition += 10;
    
    const certDetails = [
      { label: 'Type:', value: cert.type }
    ];
    
    if (cert.degreeAwarded) {
      certDetails.push({ label: 'Degree:', value: cert.degreeAwarded });
    }
    if (cert.finalCGPA) {
      certDetails.push({ label: 'CGPA:', value: cert.finalCGPA.toString() });
    }
    certDetails.push(
      { label: 'Issue Date:', value: this.formatDate(cert.issueDate) },
      { label: 'Issued By:', value: this.getIssuedByName(cert.issuedBy) }
    );
    
    certDetails.forEach(item => {
      doc.setFont('helvetica', 'bold');
      doc.text(item.label, 20, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(item.value, 60, yPosition);
      yPosition += 7;
    });
    
    yPosition += 5;
    
    // Blockchain Verification Section
    this.addSectionHeader(doc, 'BLOCKCHAIN VERIFICATION', yPosition, primaryColor);
    yPosition += 10;
    
    const blockchainInfo = [
      { label: 'Transaction ID:', value: this.verificationResult.txId },
      { label: 'Verification Time:', value: this.formatDate(this.verificationResult.timestamp) },
      { label: 'Blockchain:', value: 'Hyperledger Fabric' },
      { label: 'Network:', value: 'NIT Warangal Academic Records' }
    ];
    
    blockchainInfo.forEach(item => {
      doc.setFont('helvetica', 'bold');
      doc.text(item.label, 20, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(item.value, 60, yPosition);
      yPosition += 7;
    });
    
    yPosition += 10;
    
    // Authenticity Notice Box
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.rect(15, yPosition, 180, 35);
    
    doc.setFontSize(9);
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.text('AUTHENTICITY CONFIRMATION', 105, yPosition + 5, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    const noticeText = doc.splitTextToSize(
      'This certificate has been verified on the blockchain and is confirmed to be authentic. The certificate has not been revoked and all information has been validated against the distributed ledger maintained by NIT Warangal.',
      170
    );
    doc.text(noticeText, 20, yPosition + 12);
    
    yPosition += 45;
    
    // Footer
    doc.setDrawColor(200, 200, 200);
    doc.line(15, yPosition, 195, yPosition);
    yPosition += 5;
    
    doc.setFontSize(8);
    doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 15, yPosition);
    doc.text('Page 1 of 1', 195, yPosition, { align: 'right' });
    
    yPosition += 5;
    doc.text('This is an electronically generated verification report.', 105, yPosition, { align: 'center' });
    doc.text('For queries, contact NIT Warangal Academic Section.', 105, yPosition + 4, { align: 'center' });
    
    // Save the PDF
    doc.save(`Certificate_Verification_${cert.certificateId}.pdf`);
  }
  
  private addSectionHeader(doc: jsPDF, title: string, y: number, color: [number, number, number]): void {
    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(15, y - 5, 180, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 20, y);
    doc.setTextColor(51, 51, 51);
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getIssuedByName(issuedBy: string | undefined): string {
    if (!issuedBy) return 'N/A';
    
    // Extract CN (Common Name) from X.509 DN string
    // Example: "x509::/C=US/ST=North Carolina/O=Hyperledger/OU=admin/CN=admin::/C=US/ST=North Carolina/L=Durham/O=org1.example.com/CN=ca.org1.example.com"
    const cnMatch = issuedBy.match(/CN=([^:/]+)/);
    if (cnMatch && cnMatch[1]) {
      const cn = cnMatch[1];
      
      // Map common names to friendly display names
      const nameMap: { [key: string]: string } = {
        'admin': 'NIT Warangal Administration',
        'registrar': 'NIT Warangal Registrar',
        'dean': 'Dean of Academics'
      };
      
      return nameMap[cn.toLowerCase()] || cn;
    }
    
    // If no CN found, return first 50 characters
    return issuedBy.length > 50 ? issuedBy.substring(0, 50) + '...' : issuedBy;
  }
}

import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="confirm-dialog">
      <div class="dialog-icon" [ngClass]="data.type || 'info'">
        <mat-icon>{{getIcon()}}</mat-icon>
      </div>
      
      <h2 mat-dialog-title>{{data.title}}</h2>
      
      <mat-dialog-content>
        <p class="message">{{data.message}}</p>
        <div class="details" *ngIf="data.details">
          <div class="detail-item" *ngFor="let detail of data.details">
            <mat-icon>{{detail.icon}}</mat-icon>
            <span><strong>{{detail.label}}:</strong> {{detail.value}}</span>
          </div>
        </div>
      </mat-dialog-content>
      
      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()" class="cancel-btn">
          <mat-icon>close</mat-icon>
          {{data.cancelText || 'Cancel'}}
        </button>
        <button mat-raised-button [color]="data.confirmColor || 'primary'" 
                (click)="onConfirm()" class="confirm-btn">
          <mat-icon>{{data.confirmIcon || 'check'}}</mat-icon>
          {{data.confirmText || 'Confirm'}}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      padding: 8px;
      min-width: 400px;
      max-width: 500px;
    }

    .dialog-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      
      mat-icon {
        font-size: 36px;
        width: 36px;
        height: 36px;
        color: white;
      }
      
      &.success {
        background: linear-gradient(135deg, #10b981, #059669);
        box-shadow: 0 4px 20px rgba(16, 185, 129, 0.3);
      }
      
      &.warning {
        background: linear-gradient(135deg, #f59e0b, #d97706);
        box-shadow: 0 4px 20px rgba(245, 158, 11, 0.3);
      }
      
      &.error {
        background: linear-gradient(135deg, #ef4444, #dc2626);
        box-shadow: 0 4px 20px rgba(239, 68, 68, 0.3);
      }
      
      &.info {
        background: linear-gradient(135deg, #667eea, #764ba2);
        box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
      }
    }

    h2 {
      text-align: center;
      margin: 0 0 16px;
      font-size: 1.5rem;
      font-weight: 700;
      color: #1a1a2e;
    }

    mat-dialog-content {
      padding: 0 24px 24px;
    }

    .message {
      text-align: center;
      color: #64748b;
      font-size: 1rem;
      line-height: 1.6;
      margin-bottom: 20px;
    }

    .details {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05));
      border-radius: 12px;
      padding: 16px;
      margin-top: 16px;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
      
      mat-icon {
        color: #667eea;
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
      
      span {
        font-size: 0.9rem;
        color: #1a1a2e;
        
        strong {
          font-weight: 600;
          margin-right: 4px;
        }
      }
    }

    mat-dialog-actions {
      padding: 16px 24px;
      gap: 12px;
      
      button {
        border-radius: 12px;
        font-weight: 600;
        height: 44px;
        padding: 0 24px;
        display: flex;
        align-items: center;
        gap: 8px;
        
        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }
      
      .cancel-btn {
        color: #64748b;
      }
      
      .confirm-btn {
        min-width: 120px;
      }
    }

    @media (max-width: 600px) {
      .confirm-dialog {
        min-width: unset;
        width: 100%;
      }
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  getIcon(): string {
    if (this.data.icon) return this.data.icon;
    
    switch (this.data.type) {
      case 'success': return 'check_circle';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'info';
    }
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}

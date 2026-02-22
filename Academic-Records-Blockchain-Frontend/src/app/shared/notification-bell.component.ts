import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificationService, Notification } from '../core/services/notification.service';

@Component({
    selector: 'app-notification-bell',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="notif-wrapper">
      <button class="bell-btn" (click)="togglePanel()" [class.has-unread]="unreadCount > 0">
        🔔
        <span class="badge" *ngIf="unreadCount > 0">{{ unreadCount }}</span>
      </button>

      <div class="notif-panel" *ngIf="panelOpen" (clickOutside)="panelOpen=false">
        <div class="panel-header">
          <span>Notifications</span>
          <button class="mark-read" (click)="markAllRead()" *ngIf="unreadCount > 0">Mark all read</button>
        </div>
        <div class="notif-list">
          <div *ngIf="notifications.length === 0" class="empty-notif">
            No notifications yet
          </div>
          <div class="notif-item" *ngFor="let n of notifications" [class.unread]="!n.read">
            <div class="notif-icon">
              {{ n.type === 'certificate_issued' ? '🎓' : n.type === 'rejection' ? '↩️' : '✅' }}
            </div>
            <div class="notif-body">
              <div class="notif-message">{{ n.message }}</div>
              <div class="notif-time">{{ n.timestamp | date:'short' }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .notif-wrapper { position: relative; }
    .bell-btn {
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 10px; padding: 8px 14px;
      font-size: 18px; cursor: pointer; position: relative;
      transition: all 0.2s;
    }
    .bell-btn:hover { background: rgba(255,255,255,0.2); }
    .bell-btn.has-unread { animation: ringBell 1s ease-in-out; }
    @keyframes ringBell {
      0%,100% { transform: rotate(0); }
      20% { transform: rotate(-15deg); }
      40% { transform: rotate(15deg); }
      60% { transform: rotate(-10deg); }
      80% { transform: rotate(10deg); }
    }
    .badge {
      position: absolute; top: -6px; right: -6px;
      background: #ef4444; color: #fff;
      border-radius: 10px; font-size: 11px;
      padding: 2px 6px; font-weight: 700;
    }

    .notif-panel {
      position: absolute; top: calc(100% + 8px); right: 0;
      width: 340px; background: #1e1b4b;
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 14px; z-index: 1000;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
      overflow: hidden;
    }
    .panel-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 14px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      font-size: 14px; font-weight: 600;
    }
    .mark-read {
      background: none; border: none; color: #a78bfa;
      font-size: 12px; cursor: pointer;
    }

    .notif-list { max-height: 360px; overflow-y: auto; }
    .empty-notif {
      text-align: center; padding: 32px;
      color: rgba(255,255,255,0.4); font-size: 13px;
    }
    .notif-item {
      display: flex; gap: 12px; padding: 12px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      transition: background 0.2s;
    }
    .notif-item:hover { background: rgba(255,255,255,0.05); }
    .notif-item.unread { background: rgba(124,58,237,0.08); }
    .notif-icon { font-size: 20px; flex-shrink: 0; }
    .notif-message { font-size: 13px; color: rgba(255,255,255,0.9); margin-bottom: 4px; }
    .notif-time { font-size: 11px; color: rgba(255,255,255,0.4); }
  `]
})
export class NotificationBellComponent implements OnInit, OnDestroy {
    notifications: Notification[] = [];
    unreadCount = 0;
    panelOpen = false;
    private sub?: Subscription;

    constructor(private notifService: NotificationService) { }

    ngOnInit() {
        this.notifications = this.notifService.getAll();
        this.unreadCount = this.notifService.getUnreadCount();

        this.sub = this.notifService.notifications$.subscribe(notif => {
            this.notifications = this.notifService.getAll();
            this.unreadCount = this.notifService.getUnreadCount();
        });
    }

    togglePanel() {
        this.panelOpen = !this.panelOpen;
    }

    markAllRead() {
        this.notifService.markAllRead();
        this.unreadCount = 0;
    }

    ngOnDestroy() { this.sub?.unsubscribe(); }
}

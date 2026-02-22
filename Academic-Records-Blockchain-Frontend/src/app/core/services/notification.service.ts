/**
 * Angular Notification Service
 * Connects to the backend Socket.io server and exposes
 * an Observable that components can subscribe to for real-time alerts.
 */

import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { APP_CONFIG } from '../config/app.config';

export interface Notification {
    type: 'approval_step' | 'certificate_issued' | 'rejection' | 'info';
    message: string;
    recordId?: string;
    certId?: string;
    status?: string;
    stepLabel?: string;
    approvedBy?: string;
    timestamp: string;
    read?: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {
    private socket: Socket | null = null;
    private notificationSubject = new Subject<Notification>();
    private notifications: Notification[] = [];

    /** Observable all components can subscribe to */
    notifications$ = this.notificationSubject.asObservable();

    connect(userId: string) {
        if (this.socket?.connected) return;

        const baseUrl = APP_CONFIG.api.baseUrl.replace('/api', '').replace('/v1', '');
        this.socket = io(baseUrl, {
            query: { userId },
            transports: ['websocket', 'polling']
        });

        this.socket.on('connect', () => {
            console.log('[Socket.io] Connected for user:', userId);
        });

        this.socket.on('approval_update', (data: any) => {
            const notif: Notification = { ...data, read: false, timestamp: data.timestamp || new Date().toISOString() };
            this.notifications.unshift(notif);
            this.notificationSubject.next(notif);
        });

        this.socket.on('certificate_issued', (data: any) => {
            const notif: Notification = { ...data, type: 'certificate_issued', read: false };
            this.notifications.unshift(notif);
            this.notificationSubject.next(notif);
        });

        this.socket.on('disconnect', () => console.log('[Socket.io] Disconnected'));
    }

    disconnect() {
        this.socket?.disconnect();
        this.socket = null;
    }

    getAll(): Notification[] {
        return this.notifications;
    }

    getUnreadCount(): number {
        return this.notifications.filter(n => !n.read).length;
    }

    markAllRead() {
        this.notifications.forEach(n => n.read = true);
    }

    ngOnDestroy() {
        this.disconnect();
    }
}

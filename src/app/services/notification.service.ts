import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { Notification, NotificationType } from '../models/notification.models';

@Injectable({ providedIn: 'root' })
export class NotificationService {

  private readonly BASE = `${environment.apiUrl}/notifications`;
  private ws: WebSocket | null = null;

  newNotification$ = new Subject<Notification>();
  unreadCount      = signal(0);
  isAvailable      = signal(true);

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.BASE}/`).pipe(
      tap((notifs) => {
        this.isAvailable.set(true);
        this.unreadCount.set(notifs.filter(n => !n.is_read).length);
      }),
      catchError(err => {
        this.isAvailable.set(false);
        return throwError(() => err);
      })
    );
  }

  markAsRead(id: number): Observable<any> {
    return this.http.post(`${this.BASE}/${id}/read/`, {});
  }

  connectNotifications() {
    const token = this.authService.getAccessToken();
    const wsUrl = `${environment.wsUrl}/ws/notifications/?token=${token}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'notification') {
            // Le backend envoie directement les données de la notification
            // Format: { type: 'notification', notification_type: '...', title: '...', message: '...', timestamp: '...' }
            const notification: Notification = {
              id: 0, // Sera mis à jour lors du fetch
              type: data.notification_type,
              title: data.title,
              message: data.message,
              is_read: false,
              created_at: data.timestamp,
              related_object_id: data.related_object_id,
              related_object_type: data.related_object_type
            };
            this.newNotification$.next(notification);
            this.unreadCount.update(n => n + 1);
          }
        } catch (e) {
          console.error('Notification WS parse error:', e);
        }
      };

      this.ws.onerror = () => {
        this.isAvailable.set(false);
      };

    } catch {
      this.isAvailable.set(false);
    }
  }

  disconnectNotifications() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

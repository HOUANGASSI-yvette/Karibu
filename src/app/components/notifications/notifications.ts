import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../shared/navbar/navbar';
import { NotificationService, Notification } from '../../services/notification.service';
import { ToastService } from '../../shared/toast.service';
import { Subscription } from 'rxjs';
import { LucideAngularModule, Bell, MessageSquare, Calendar, CheckCheck, WifiOff, RefreshCw } from 'lucide-angular';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, NavbarComponent, LucideAngularModule],
  templateUrl: './notifications.html',
})
export class NotificationsComponent implements OnInit, OnDestroy {

  readonly BellIcon     = Bell;
  readonly MessageIcon  = MessageSquare;
  readonly CalendarIcon = Calendar;
  readonly CheckAllIcon = CheckCheck;
  readonly OfflineIcon  = WifiOff;
  readonly RetryIcon    = RefreshCw;

  notifications: Notification[] = [];
  isLoading  = true;
  hasError   = false;
  private sub?: Subscription;

  constructor(
    public notifService: NotificationService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.loadNotifications();
    this.notifService.connectNotifications();
    this.sub = this.notifService.newNotification$.subscribe(notif => {
      this.notifications.unshift(notif);
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    this.notifService.disconnectNotifications();
  }

  loadNotifications() {
    this.isLoading = true;
    this.hasError  = false;

    this.notifService.getNotifications().subscribe({
      next: (notifs) => {
        this.notifications = notifs;
        this.isLoading     = false;
      },
      error: () => {
        this.isLoading = false;
        this.hasError  = true;
      }
    });
  }

  markAsRead(notif: Notification) {
    if (notif.is_read) return;
    this.notifService.markAsRead(notif.id).subscribe({
      next: () => {
        notif.is_read = true;
        this.notifService.unreadCount.update(n => Math.max(0, n - 1));
      },
      error: () => this.toast.error('Impossible de marquer comme lu.')
    });
  }

  markAllAsRead() {
    this.notifications.filter(n => !n.is_read).forEach(n => this.markAsRead(n));
    this.toast.success('Toutes les notifications marquées comme lues.');
  }

  getIcon(type: string) {
    return { new_message: this.MessageIcon, booking_request: this.CalendarIcon }[type] || this.BellIcon;
  }

  getTypeLabel(type: string): string {
    return {
      new_message:       'Nouveau message',
      booking_request:   'Demande de réservation',
      booking_confirmed: 'Réservation confirmée',
      booking_canceled:  'Réservation annulée',
    }[type] || 'Notification';
  }

  get unreadCount(): number {
    return this.notifications.filter(n => !n.is_read).length;
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  }
}

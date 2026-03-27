import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../../shared/navbar/navbar';
import { NotificationService, Notification } from '../../services/notification.service';
import { ToastService } from '../../shared/toast.service';
import { Subscription } from 'rxjs';
import { LucideAngularModule, Bell, MessageSquare, Calendar, CheckCheck, WifiOff, RefreshCw } from 'lucide-angular';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, LucideAngularModule],
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
    private toast: ToastService,
    private cdr: ChangeDetectorRef,   // ✅ FIX : injecté
  ) {}

  ngOnInit() {
    this.loadNotifications();
    this.notifService.connectNotifications();

    // ✅ FIX : detectChanges après chaque nouvelle notif WS
    this.sub = this.notifService.newNotification$.subscribe(notif => {
      this.notifications = [notif, ...this.notifications];  // nouveau tableau = change detection sûre
      this.cdr.detectChanges();
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
        this.cdr.detectChanges();   // ✅ FIX
      },
      error: () => {
        this.isLoading = false;
        this.hasError  = true;
        this.cdr.detectChanges();   // ✅ FIX
      }
    });
  }

  markAsRead(notif: Notification) {
    if (notif.is_read) return;
    this.notifService.markAsRead(notif.id).subscribe({
      next: () => {
        // ✅ FIX : on crée un nouvel objet pour déclencher la détection
        this.notifications = this.notifications.map(n =>
          n.id === notif.id ? { ...n, is_read: true } : n
        );
        this.notifService.unreadCount.update(n => Math.max(0, n - 1));
        this.cdr.detectChanges();
      },
      error: () => this.toast.error('Impossible de marquer comme lu.')
    });
  }

  markAllAsRead() {
    const unread = this.notifications.filter(n => !n.is_read);
    if (!unread.length) return;
    unread.forEach(n => this.markAsRead(n));
    this.toast.success('Toutes les notifications marquées comme lues.');
  }

  getIcon(type: string) {
    return { new_message: this.MessageIcon, booking_request: this.CalendarIcon }[type] || this.BellIcon;
  }

  getTypeLabel(type: string): string {
    return ({
      new_message:       'Nouveau message',
      booking_request:   'Demande de réservation',
      booking_confirmed: 'Réservation confirmée',
      booking_canceled:  'Réservation annulée',
    } as any)[type] || 'Notification';
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

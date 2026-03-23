import { Component, OnInit, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/toast/toast';
import { AuthService } from './services/auth.service';
import { NotificationService } from './services/notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent],
  template: `
    <router-outlet />
    <app-toast />
  `
})
export class AppComponent implements OnInit {

  constructor(
    private authService: AuthService,
    private notifService: NotificationService
  ) {
    // effect() doit être dans le constructeur avec les signals Angular
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.initNotifications();
      } else {
        this.notifService.disconnectNotifications();
      }
    });
  }

  ngOnInit() {
    // Connexion initiale si déjà connecté au démarrage
    if (this.authService.isLoggedIn()) {
      this.initNotifications();
    }
  }

  private initNotifications() {
    this.notifService.connectNotifications();
    this.notifService.getNotifications().subscribe({
      next: (notifs) => {
        this.notifService.unreadCount.set(notifs.filter(n => !n.is_read).length);
      },
      error: () => {}
    });
  }
}

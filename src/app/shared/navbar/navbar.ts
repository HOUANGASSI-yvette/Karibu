import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef, effect } from '@angular/core';
import { RouterLink, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription, filter } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import {
  LucideAngularModule,
  Bell, LogOut, Menu, X,
  Building2, MessageSquare, LayoutDashboard,
  Home, Search, ShieldCheck, User, ChevronDown,
} from 'lucide-angular';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, CommonModule, LucideAngularModule],
  templateUrl: './navbar.html',
})
export class NavbarComponent implements OnInit, OnDestroy {
  @Input() variant: 'public' | 'dashboard' = 'public';
  @Input() pageTitle = '';

  mobileMenuOpen = false;
  userMenuOpen   = false;

  readonly BellIcon      = Bell;
  readonly LogOutIcon    = LogOut;
  readonly MenuIcon      = Menu;
  readonly XIcon         = X;
  readonly BuildingIcon  = Building2;
  readonly MessageIcon   = MessageSquare;
  readonly DashboardIcon = LayoutDashboard;
  readonly HomeIcon      = Home;
  readonly SearchIcon    = Search;
  readonly ShieldIcon    = ShieldCheck;
  readonly UserIcon      = User;
  readonly ChevronDown   = ChevronDown;

  private routerSub?: Subscription;

  constructor(
    public  authService: AuthService,
    public  notificationService: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {
    effect(() => {
      this.authService.currentUser();
      this.cdr.detectChanges();
    });

    // Réagit aux changements du compteur de notifs non lues
    effect(() => {
      this.notificationService.unreadCount();
      this.cdr.detectChanges();
    });
  }

  ngOnInit() {
    this.routerSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        if (this.authService.isLoggedIn()) {
          this.authService.refreshCurrentUser();
        }
      });

    // Charger le compte de notifs non lues au démarrage
    if (this.authService.isLoggedIn()) {
      this.notificationService.getNotifications().subscribe();
      this.notificationService.connectNotifications();
    }
  }

  ngOnDestroy() {
    this.routerSub?.unsubscribe();
    this.notificationService.disconnectNotifications();
  }

  get currentUser()    { return this.authService.currentUser(); }
  get role(): string   { return this.currentUser?.role ?? ''; }
  get isProprietaire() { return this.role === 'proprietaire'; }
  get isLocataire()    { return this.role === 'locataire'; }
  get isAdmin()        { return this.role === 'admin'; }

  get proprietaireStatut(): string {
    return this.currentUser?.proprietaire_profile?.statut_verification ?? 'en_attente';
  }

  get isVerified(): boolean {
    return this.proprietaireStatut === 'verifie';
  }

  get unreadNotifCount(): number {
    return this.notificationService.unreadCount();
  }

  get userInitials(): string {
    const u = this.currentUser;
    if (!u) return '?';
    const f = u.first_name?.charAt(0) || u.username?.charAt(0) || '';
    const l = u.last_name?.charAt(0) || '';
    return (f + l).toUpperCase() || u.username?.substring(0, 2).toUpperCase() || '?';
  }

  get userName(): string {
    const u = this.currentUser;
    if (!u) return '';
    if (u.first_name && u.last_name) return `${u.first_name} ${u.last_name.charAt(0)}.`;
    return u.username || '';
  }

  get userRoleLabel(): string {
    return (
      { proprietaire: 'Propriétaire', locataire: 'Locataire', admin: 'Administrateur' } as any
    )[this.role] ?? '';
  }

  logout() {
    this.authService.clearTokens();
    this.notificationService.disconnectNotifications();
    this.router.navigate(['/login']);
  }

  toggleMobileMenu() { this.mobileMenuOpen = !this.mobileMenuOpen; }
  toggleUserMenu()   { this.userMenuOpen   = !this.userMenuOpen; }
  closeUserMenu()    { this.userMenuOpen   = false; }
}

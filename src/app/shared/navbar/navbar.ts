import { Component, Input } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import {
  LucideAngularModule,
  Home, Bell, LogOut, Menu, X,
  Building2, MessageSquare, User
} from 'lucide-angular';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, CommonModule, LucideAngularModule],
  templateUrl: './navbar.html',
})
export class NavbarComponent {
  @Input() variant: 'public' | 'dashboard' = 'public';
  @Input() pageTitle = '';

  mobileMenuOpen = false;

  readonly HomeIcon       = Home;
  readonly BellIcon       = Bell;
  readonly LogOutIcon     = LogOut;
  readonly MenuIcon       = Menu;
  readonly XIcon          = X;
  readonly BuildingIcon   = Building2;
  readonly MessageIcon    = MessageSquare;
  readonly UserIcon       = User;

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  get currentUser() {
    return this.authService.getCurrentUser();
  }

  get userInitials(): string {
    const user = this.currentUser;
    if (!user) return '?';
    const first = user.first_name?.charAt(0) || user.username?.charAt(0) || '';
    const last  = user.last_name?.charAt(0)  || '';
    return (first + last).toUpperCase() || user.username?.substring(0, 2).toUpperCase() || '?';
  }

  get userName(): string {
    const user = this.currentUser;
    if (!user) return '';
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name.charAt(0)}.`;
    }
    return user.username || '';
  }

  get userRole(): string {
    const role = this.currentUser?.role;
    if (role === 'proprietaire') return 'Propriétaire';
    if (role === 'locataire')    return 'Locataire';
    if (role === 'admin')        return 'Administrateur';
    return '';
  }

  logout() {
    this.authService.clearTokens();
    this.router.navigate(['/login']);
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }
}

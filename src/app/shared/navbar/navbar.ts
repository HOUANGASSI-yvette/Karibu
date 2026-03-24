import { Component, Input, computed, signal,  } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
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
export class NavbarComponent {
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

  constructor(public authService: AuthService, private router: Router) {}


  get currentUser() { return this.authService.currentUser(); }

  get role(): string       { return this.currentUser?.role ?? ''; }
  get isProprietaire()     { return this.role === 'proprietaire'; }
  get isLocataire()        { return this.role === 'locataire'; }
  get isAdmin()            { return this.role === 'admin'; }

  get proprietaireStatut() {
    return this.currentUser?.proprietaire_profile?.statut_verification ?? 'en_attente';
  }
  get isVerified()         { return this.proprietaireStatut === 'valide'; }

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
    return ({ proprietaire: 'Propriétaire', locataire: 'Locataire', admin: 'Administrateur' } as any)[this.role] ?? '';
  }

  logout() {
    this.authService.clearTokens();
    this.router.navigate(['/login']);
  }

  toggleMobileMenu() { this.mobileMenuOpen = !this.mobileMenuOpen; }
  toggleUserMenu()   { this.userMenuOpen   = !this.userMenuOpen; }
  closeUserMenu()    { this.userMenuOpen   = false; }
}

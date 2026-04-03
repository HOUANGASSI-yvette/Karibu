import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../shared/toast.service';
import { DashboardNavbarComponent } from '../dashboard/dashboard-navbar/dashboard-navbar';
import { TenantSidebarComponent, TenantSection } from './tenant-sidebar/tenant-sidebar';
import { TenantOverviewComponent } from './sections/tenant-overview/tenant-overview';
import { MyPaymentsComponent } from '../tenant/my-payments/my-payments.component';
import { MyApplicationsComponent } from '../tenant/my-applications/my-applications.component';
import { MaintenanceRequestsComponent } from '../tenant/maintenance-requests/maintenance-requests.component';

@Component({
  selector: 'app-tenant-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    DashboardNavbarComponent,
    TenantSidebarComponent,
    TenantOverviewComponent,
    MyPaymentsComponent,
    MyApplicationsComponent,
    MaintenanceRequestsComponent,
  ],
  templateUrl: './tenant-dashboard.html',
})
export class TenantDashboardComponent implements OnInit {

  activeSection: TenantSection = 'overview';

  constructor(
    public authService: AuthService,
    private router: Router,
    private toast: ToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    // Load tenant dashboard data
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  get currentUser() { return this.authService.getCurrentUser(); }
  get userInitials() {
    const u = this.currentUser;
    if (!u) return '?';
    return ((u.first_name?.charAt(0) || u.username?.charAt(0) || '')
      + (u.last_name?.charAt(0) || '')).toUpperCase() || '?';
  }
  get userName() {
    const u = this.currentUser;
    if (!u) return '';
    return (u.first_name && u.last_name)
      ? `${u.first_name} ${u.last_name.charAt(0)}.`
      : u.username || '';
  }
  get userRole() {
    return 'Locataire';
  }

  logout() {
    this.authService.clearTokens();
    void this.router.navigate(['/login']);
  }

  onSectionChange(section: TenantSection) {
    this.activeSection = section;
    this.cdr.detectChanges();
  }
}
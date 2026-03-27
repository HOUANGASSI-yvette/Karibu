import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../shared/toast.service';
import { DashboardNavbarComponent } from './dashboard-navbar/dashboard-navbar';
import { DashboardSidebarComponent, DashboardSection } from './dashboard-sidebar/dashboard-sidebar';
import { OverviewSectionComponent } from './sections/overview/overview';
import { PropertiesSectionComponent } from './sections/properties-section/properties-section';
import { TenantsSectionComponent } from './sections/tenants-section/tenants-section';
import { PaymentsSectionComponent } from './sections/payments-section/payments-section';
import { MessagesSectionComponent } from './sections/messages-section/messages-section';
import { RequestsSectionComponent } from './sections/requests-section/requests-section';
import { AdminUsersSectionComponent } from './sections/admin-users-section/admin-users-section';
import { AdminDocumentsSectionComponent } from './sections/admin-documents-section/admin-documents-section';
import { AdminDisputesSectionComponent } from './sections/admin-disputes-section/admin-disputes-section';

export interface OwnerStats {
  totalRevenue: number; revenueEvolution: number;
  propertiesCount: number; rentedCount: number; occupancyRate: number;
  pendingRequests: number; unreadMessages: number;
}
export interface OwnerProperty {
  id: string; title: string; city: string; district: string;
  type: string; price: number; status: 'rented' | 'available' | 'soon';
  tenantName?: string; coverPhoto: string;
}
export interface Tenant {
  id: string; firstName: string; lastName: string; email: string; phone: string;
  propertyId: string; propertyTitle: string; rentAmount: number;
  leaseStart: string; leaseEnd: string; status: 'active' | 'late' | 'leaving';
}
export interface Payment {
  id: string; tenantId: string; tenantName: string; propertyTitle: string;
  amount: number; month: string; status: 'paid' | 'pending' | 'late'; paidAt?: string;
}
export interface DashboardMessage {
  id: string; senderId: string; senderName: string; senderInitials: string;
  preview: string; date: string; read: boolean; propertyTitle?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    DashboardNavbarComponent,
    DashboardSidebarComponent,
    OverviewSectionComponent,
    PropertiesSectionComponent,
    TenantsSectionComponent,
    PaymentsSectionComponent,
    MessagesSectionComponent,
    RequestsSectionComponent,
    AdminUsersSectionComponent,
    AdminDocumentsSectionComponent,
    AdminDisputesSectionComponent
  ],
  templateUrl: './dashboard.html',
})
export class DashboardComponent implements OnInit {

  activeSection: DashboardSection = 'overview';
  isLoading = false;   // Les sections chargent leurs propres données via API

  // Ces données sont gardées pour la sidebar et l'overview
  // mais elles seront alimentées par les sections elles-mêmes
  stats: OwnerStats = {
    totalRevenue: 0, revenueEvolution: 0, propertiesCount: 0,
    rentedCount: 0, occupancyRate: 0, pendingRequests: 0, unreadMessages: 0
  };
  properties: OwnerProperty[] = [];
  tenants:    Tenant[]         = [];
  payments:   Payment[]        = [];
  messages:   DashboardMessage[] = [];

  constructor(
    public authService: AuthService,
    private router: Router,
    private toast: ToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    // Plus de mock data — chaque section charge ses propres données
  }

  get currentUser()  { return this.authService.getCurrentUser(); }

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
    const r = this.currentUser?.role;
    return r === 'proprietaire' ? 'Propriétaire'
      : r === 'locataire'  ? 'Locataire'
        : r === 'admin'      ? 'Administrateur' : '';
  }

  // Valeurs dynamiques pour la sidebar — mises à jour par les sections enfants
  sidebarPropertiesCount = 0;
  sidebarTenantsCount    = 0;
  sidebarUnreadCount     = 0;
  sidebarPendingCount    = 0;

  get unreadCount()  { return this.sidebarUnreadCount; }
  get pendingCount() { return this.sidebarPendingCount; }

  logout() {
    this.authService.clearTokens();
    void this.router.navigate(['/login']);
  }

  onPropertiesCountChange(count: number): void {
    this.sidebarPropertiesCount = count;
    this.stats = { ...this.stats, propertiesCount: count };
    this.cdr.detectChanges();
  }

  onSectionChange(section: DashboardSection) {
    this.activeSection = section;
  }

  onRequestHandled(event: { id: string; action: 'accepted' | 'rejected' }) {
    this.toast.success(event.action === 'accepted' ? 'Demande acceptée' : 'Demande refusée');
  }

  onMessageRead(_id: string) {}

  onQuittanceDownload(_paymentId: string) {
    this.toast.success('Quittance générée et téléchargée');
  }
}

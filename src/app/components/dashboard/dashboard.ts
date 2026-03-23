import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';          // ← RouterLink retiré (inutilisé ici)
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
export interface ReservationRequest {
  id: string; tenantName: string; tenantInitials: string; propertyTitle: string;
  propertyId: string; visitDate?: string; message?: string;
  createdAt: string; status: 'pending' | 'accepted' | 'rejected';
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
  ],
  templateUrl: './dashboard.html',
})
export class DashboardComponent implements OnInit {

  activeSection: DashboardSection = 'overview';
  isLoading = true;

  stats: OwnerStats = {
    totalRevenue: 0, revenueEvolution: 0, propertiesCount: 0,
    rentedCount: 0, occupancyRate: 0, pendingRequests: 0, unreadMessages: 0
  };
  properties: OwnerProperty[]   = [];
  tenants:    Tenant[]           = [];
  payments:   Payment[]          = [];
  messages:   DashboardMessage[] = [];
  requests:   ReservationRequest[] = [];

  constructor(
    public authService: AuthService,
    private router: Router,
    private toast: ToastService,
  ) {}

  ngOnInit() { this.loadDashboard(); }

  loadDashboard() {
    this.isLoading = true;
    setTimeout(() => {
      this.stats      = MOCK_STATS;
      this.properties = MOCK_PROPERTIES;
      this.tenants    = MOCK_TENANTS;
      this.payments   = MOCK_PAYMENTS;
      this.messages   = MOCK_MESSAGES;
      this.requests   = MOCK_REQUESTS;
      this.isLoading  = false;
    }, 600);
  }

  // Getters utilisés par DashboardNavbarComponent via @Input()
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
      : r === 'locataire'    ? 'Locataire'
        : r === 'admin'        ? 'Administrateur' : '';
  }

  get unreadCount()  { return this.messages.filter(m => !m.read).length; }
  get pendingCount() { return this.requests.filter(r => r.status === 'pending').length; }

  logout() {
    this.authService.clearTokens();
    void this.router.navigate(['/login']); // ← void pour ignorer la Promise proprement
  }

  onSectionChange(section: DashboardSection) { this.activeSection = section; }

  onRequestHandled(event: { id: string; action: 'accepted' | 'rejected' }) {
    const req = this.requests.find(r => r.id === event.id);
    if (req) { req.status = event.action; }
    this.toast.success(event.action === 'accepted' ? 'Demande acceptée' : 'Demande refusée');
  }

  onMessageRead(id: string) {
    const msg = this.messages.find(m => m.id === id);
    if (msg) msg.read = true;
  }

  onQuittanceDownload(_paymentId: string) { // ← préfixe _ = intentionnellement inutilisé
    this.toast.success('Quittance générée et téléchargée');
  }
}

// ── MOCK DATA ──────────────────────────────────────────────────────────────────
/* spell-checker: disable */
const MOCK_STATS: OwnerStats = {
  totalRevenue: 295000, revenueEvolution: 8, propertiesCount: 4,
  rentedCount: 3, occupancyRate: 75, pendingRequests: 2, unreadMessages: 3,
};
const MOCK_PROPERTIES: OwnerProperty[] = [
  { id: '1', title: 'Studio Moderne',     city: 'Lomé',    district: 'Tokoin',      type: 'Studio',      price: 85000,  status: 'rented',    tenantName: 'Sophie Mensah', coverPhoto: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400' },
  { id: '2', title: 'T2 Lumineux',        city: 'Kara',    district: 'Kpéléwogou', type: 'Appartement', price: 65000,  status: 'rented',    tenantName: 'Karim Bamba',   coverPhoto: 'https://images.unsplash.com/photo-1555636222-cae831e670b3?w=400' },
  { id: '3', title: 'Maison avec jardin', city: 'Kpalimé', district: 'Centre',      type: 'Maison',      price: 120000, status: 'rented',    tenantName: 'Marie Lawson',  coverPhoto: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400' },
  { id: '4', title: 'Loft Atypique',      city: 'Sokodé',  district: 'Marché',      type: 'Appartement', price: 75000,  status: 'available',                              coverPhoto: 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=400' },
];
const MOCK_TENANTS: Tenant[] = [
  { id: 't1', firstName: 'Sophie', lastName: 'Mensah', email: 'sophie.m@email.com', phone: '+228 90 11 22 33', propertyId: '1', propertyTitle: 'Studio Moderne',     rentAmount: 85000,  leaseStart: '2025-09-01', leaseEnd: '2026-08-31', status: 'active' },
  { id: 't2', firstName: 'Karim',  lastName: 'Bamba',  email: 'karim.b@email.com',  phone: '+228 91 44 55 66', propertyId: '2', propertyTitle: 'T2 Lumineux',        rentAmount: 65000,  leaseStart: '2025-10-01', leaseEnd: '2026-09-30', status: 'late'   },
  { id: 't3', firstName: 'Marie',  lastName: 'Lawson', email: 'marie.l@email.com',  phone: '+228 93 77 88 99', propertyId: '3', propertyTitle: 'Maison avec jardin', rentAmount: 120000, leaseStart: '2025-06-01', leaseEnd: '2026-05-31', status: 'active' },
];
const MOCK_PAYMENTS: Payment[] = [
  { id: 'p1', tenantId: 't1', tenantName: 'Sophie Mensah', propertyTitle: 'Studio Moderne',     amount: 85000,  month: 'Mars 2026',    status: 'paid',    paidAt: '2026-03-02' },
  { id: 'p2', tenantId: 't2', tenantName: 'Karim Bamba',   propertyTitle: 'T2 Lumineux',        amount: 65000,  month: 'Mars 2026',    status: 'pending' },
  { id: 'p3', tenantId: 't3', tenantName: 'Marie Lawson',  propertyTitle: 'Maison avec jardin', amount: 120000, month: 'Mars 2026',    status: 'paid',    paidAt: '2026-03-01' },
  { id: 'p4', tenantId: 't1', tenantName: 'Sophie Mensah', propertyTitle: 'Studio Moderne',     amount: 85000,  month: 'Février 2026', status: 'paid',    paidAt: '2026-02-03' },
  { id: 'p5', tenantId: 't2', tenantName: 'Karim Bamba',   propertyTitle: 'T2 Lumineux',        amount: 65000,  month: 'Février 2026', status: 'late' },
];
const MOCK_MESSAGES: DashboardMessage[] = [
  { id: 'm1', senderId: 't2', senderName: 'Karim Bamba',   senderInitials: 'KB', preview: 'Bonjour, léger retard pour le loyer ce mois-ci...', date: '2026-03-14T10:30:00Z', read: false, propertyTitle: 'T2 Lumineux'    },
  { id: 'm2', senderId: 't1', senderName: 'Sophie Mensah', senderInitials: 'SM', preview: 'Le robinet de la cuisine fuit depuis hier soir...',  date: '2026-03-13T16:00:00Z', read: false, propertyTitle: 'Studio Moderne' },
  { id: 'm3', senderId: 'u5', senderName: 'Yawa Attiogbe', senderInitials: 'YA', preview: 'Je suis intéressée par votre loft à Sokode...',      date: '2026-03-12T09:15:00Z', read: false                              },
  { id: 'm4', senderId: 't3', senderName: 'Marie Lawson',  senderInitials: 'ML', preview: 'Merci pour la réparation rapide !',                   date: '2026-03-10T14:00:00Z', read: true,  propertyTitle: 'Maison jardin'  },
];
const MOCK_REQUESTS: ReservationRequest[] = [
  { id: 'r1', tenantName: 'Yawa Attiogbe', tenantInitials: 'YA', propertyTitle: 'Loft Atypique',  propertyId: '4', visitDate: '2026-03-20', message: 'Je travaille a Sokode, cherche logement pour avril.', createdAt: '2026-03-12T09:15:00Z', status: 'pending'  },
  { id: 'r2', tenantName: 'Essi Koudolo',  tenantInitials: 'EK', propertyTitle: 'Loft Atypique',  propertyId: '4', visitDate: '2026-03-22', message: 'Etudiant en master, très sérieux.',                  createdAt: '2026-03-13T11:00:00Z', status: 'pending'  },
  { id: 'r3', tenantName: 'Paul Aziagbe',  tenantInitials: 'PA', propertyTitle: 'Studio Moderne', propertyId: '1',                          message: 'Intéressé par un renouvellement anticipé.',          createdAt: '2026-03-10T08:00:00Z', status: 'accepted' },
];
/* spell-checker: enable */

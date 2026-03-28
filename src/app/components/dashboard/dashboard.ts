import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../shared/toast.service';
import { ChatService } from '../../services/chat.service';
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
import { environment } from '../../../environments/environment';

export interface OwnerStats {
  totalRevenue:     number;
  revenueEvolution: number;
  propertiesCount:  number;
  rentedCount:      number;
  occupancyRate:    number;
  pendingRequests:  number;
  unreadMessages:   number;
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
    AdminDisputesSectionComponent,
  ],
  templateUrl: './dashboard.html',
})
export class DashboardComponent implements OnInit {

  private http  = inject(HttpClient);
  private chat  = inject(ChatService);
  private base  = environment.apiUrl.replace(/\/$/, '');

  activeSection: DashboardSection = 'overview';

  // roomId à pré-sélectionner quand on navigue vers messages
  targetRoomId: number | null = null;

  stats: OwnerStats = {
    totalRevenue: 0, revenueEvolution: 0, propertiesCount: 0,
    rentedCount: 0, occupancyRate: 0, pendingRequests: 0, unreadMessages: 0,
  };

  properties: OwnerProperty[] = [];
  tenants:    Tenant[]         = [];
  payments:   Payment[]        = [];
  messages:   DashboardMessage[] = [];

  sidebarPropertiesCount = 0;
  sidebarTenantsCount    = 0;
  sidebarUnreadCount     = 0;
  sidebarPendingCount    = 0;

  constructor(
    public  authService: AuthService,
    private router:      Router,
    private toast:       ToastService,
    private cdr:         ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.loadDashboardStats();
  }

  // ── KPIs overview ─────────────────────────────────────────────────────────

  loadDashboardStats() {
    const userId = this.authService.getCurrentUser()?.id;

    forkJoin({
      baux:       this.http.get<any[]>(`${this.base}/bails/`).pipe(catchError(() => of([]))),
      properties: this.http.get<any[]>(`${this.base}/properties/`).pipe(catchError(() => of([]))),
      paiements:  this.http.get<any>(`${this.base}/bails/paiements/mes-paiements/`).pipe(catchError(() => of({ paiements: [], totaux: {} }))),
      rooms:      this.chat.getRooms().pipe(catchError(() => of([]))),
      requests:   this.http.get<any[]>(`${this.base}/reservations/`).pipe(catchError(() => of([]))),
    }).subscribe(({ baux, properties, paiements, rooms, requests }) => {

      // Baux actifs du proprio
      const bauxActifs = (baux as any[]).filter(b =>
        b.proprietaire === userId && ['actif', 'signe'].includes(b.statut)
      );

      // Propriétés du proprio
      const myProps = (properties as any[]).filter(p => p.owner === userId);
      const rented  = myProps.filter(p => !p.available).length;
      const total   = myProps.length;

      // Revenus ce mois (paiements confirmés du mois courant)
      const now       = new Date();
      const moisCourant = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const listePaie = (paiements as any).paiements ?? [];
      const revenusMois = listePaie
        .filter((p: any) => p.statut === 'confirme' && (p.mois_concerne ?? '').startsWith(moisCourant))
        .reduce((s: number, p: any) => s + (p.montant ?? 0), 0);

      // Mois précédent pour l'évolution
      const prev      = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const moisPrec  = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
      const revenusPrec = listePaie
        .filter((p: any) => p.statut === 'confirme' && (p.mois_concerne ?? '').startsWith(moisPrec))
        .reduce((s: number, p: any) => s + (p.montant ?? 0), 0);
      const evolution = revenusPrec > 0
        ? Math.round(((revenusMois - revenusPrec) / revenusPrec) * 100)
        : 0;

      // Unread messages
      const unread = (rooms as any[]).reduce((s, r) => s + (r.unread_count ?? 0), 0);

      // Demandes en attente
      const pending = (requests as any[]).filter(r => r.statut === 'en_attente').length;

      this.stats = {
        totalRevenue:     revenusMois,
        revenueEvolution: evolution,
        propertiesCount:  total,
        rentedCount:      rented,
        occupancyRate:    total > 0 ? Math.round((rented / total) * 100) : 0,
        pendingRequests:  pending,
        unreadMessages:   unread,
      };

      // Sidebar
      this.sidebarPropertiesCount = total;
      this.sidebarTenantsCount    = bauxActifs.length;
      this.sidebarUnreadCount     = unread;
      this.sidebarPendingCount    = pending;

      // Overview : dernières propriétés
      this.properties = myProps.slice(0, 4).map(p => ({
        id:          String(p.id),
        title:       p.title ?? '—',
        city:        p.city  ?? '',
        district:    p.district ?? '',
        type:        p.type  ?? '',
        price:       p.price ?? 0,
        status:      p.available ? 'available' : 'rented',
        coverPhoto:  p.cover_photo ?? p.photos?.[0]?.url ?? '',
      }));

      // Overview : derniers paiements
      this.payments = listePaie.slice(0, 3).map((p: any) => ({
        id:            String(p.id),
        tenantId:      String(p.bail),
        tenantName:    p.bail_info?.locataire ?? '—',
        propertyTitle: p.bail_info?.logement  ?? '—',
        amount:        p.montant ?? 0,
        month:         p.mois_concerne ?? '',
        status:        p.statut === 'confirme' ? 'paid'
          : p.statut === 'en_retard' ? 'late' : 'pending',
      }));

      this.cdr.detectChanges();
    });
  }

  // ── Navigation ────────────────────────────────────────────────────────────

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
      : r === 'locataire'   ? 'Locataire'
        : r === 'admin'       ? 'Administrateur' : '';
  }

  get unreadCount()  { return this.sidebarUnreadCount; }
  get pendingCount() { return this.sidebarPendingCount; }

  logout() {
    this.authService.clearTokens();
    void this.router.navigate(['/login']);
  }

  onSectionChange(section: DashboardSection) {
    this.activeSection = section;
    this.cdr.detectChanges();
  }

  onPropertiesCountChange(count: number) {
    this.sidebarPropertiesCount = count;
    this.stats = { ...this.stats, propertiesCount: count };
    this.cdr.detectChanges();
  }

  /**
   * Appelé par tenants-section quand l'utilisateur clique "Contacter".
   * On switche vers la section messages EN PASSANT le roomId
   * pour que messages-section ouvre directement la bonne room.
   */
  onNavigateToChat(roomId: number) {
    this.targetRoomId  = roomId;
    this.activeSection = 'messages';
    this.cdr.detectChanges();
  }

  onRequestHandled(event: { id: string; action: 'accepted' | 'rejected' }) {
    this.toast.success(event.action === 'accepted' ? 'Demande acceptée' : 'Demande refusée');
    // Recharge les stats sidebar
    this.loadDashboardStats();
  }

  onMessageRead(_id: string) {}
  onQuittanceDownload(_paymentId: string) {
    this.toast.success('Quittance générée et téléchargée');
  }
}

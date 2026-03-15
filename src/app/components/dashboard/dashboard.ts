import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// ============================================================
// COMPOSANT : DashboardComponent  —  route: /dashboard
// ============================================================
// ⚠️ INTÉGRATION API :
//   this.dashboardService.getStats()       → GET /owner/stats
//   this.dashboardService.getProperties()  → GET /owner/properties
//   this.dashboardService.getTenants()     → GET /owner/tenants
//   this.dashboardService.getPayments()    → GET /owner/payments
//   this.dashboardService.getMessages()    → GET /owner/messages
//   this.dashboardService.getRequests()    → GET /owner/reservation-requests
// ============================================================

export interface OwnerStats {
  totalRevenue: number;
  revenueEvolution: number;
  propertiesCount: number;
  rentedCount: number;
  occupancyRate: number;
  pendingRequests: number;
  unreadMessages: number;
}

export interface OwnerProperty {
  id: string;
  title: string;
  city: string;
  district: string;
  type: string;
  price: number;
  status: 'rented' | 'available' | 'soon';
  tenantName?: string;
  coverPhoto: string;
}

export interface Tenant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  propertyId: string;
  propertyTitle: string;
  rentAmount: number;
  leaseStart: string;
  leaseEnd: string;
  status: 'active' | 'late' | 'leaving';
}

export interface Payment {
  id: string;
  tenantId: string;
  tenantName: string;
  propertyTitle: string;
  amount: number;
  month: string;
  status: 'paid' | 'pending' | 'late';
  paidAt?: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderInitials: string;
  preview: string;
  date: string;
  read: boolean;
  propertyTitle?: string;
}

export interface ReservationRequest {
  id: string;
  tenantName: string;
  tenantInitials: string;
  propertyTitle: string;
  propertyId: string;
  visitDate?: string;
  message?: string;
  createdAt: string;
  status: 'pending' | 'accepted' | 'rejected';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './dashboard.html',
})
export class DashboardComponent implements OnInit {

  activeSection: 'overview' | 'properties' | 'tenants' | 'payments' | 'messages' | 'requests' = 'overview';
  isLoading = true;

  // ✅ FIX 1 : initialisé avec des zéros → supprime TS2532 "possibly undefined"
  stats: OwnerStats = {
    totalRevenue: 0,
    revenueEvolution: 0,
    propertiesCount: 0,
    rentedCount: 0,
    occupancyRate: 0,
    pendingRequests: 0,
    unreadMessages: 0,
  };

  properties: OwnerProperty[] = [];
  tenants: Tenant[] = [];
  payments: Payment[] = [];
  messages: Message[] = [];
  requests: ReservationRequest[] = [];

  showQuittanceModal = false;
  selectedPaymentId = '';
  toastMessage = '';
  showToast = false;

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.isLoading = true;

    // ── MODE MOCK ──────────────────────────────────────────
    // ⚠️ Remplacer par des appels API réels via un DashboardService
    setTimeout(() => {
      this.stats      = MOCK_STATS;
      this.properties = MOCK_PROPERTIES;
      this.tenants    = MOCK_TENANTS;
      this.payments   = MOCK_PAYMENTS;
      this.messages   = MOCK_MESSAGES;
      this.requests   = MOCK_REQUESTS;
      this.isLoading  = false;
    }, 600);
    // ── FIN MOCK ───────────────────────────────────────────
  }

  setSection(section: typeof this.activeSection) {
    this.activeSection = section;
  }

  // ⚠️ API: PATCH /owner/reservation-requests/:id
  handleRequest(requestId: string, action: 'accepted' | 'rejected') {
    const req = this.requests.find(r => r.id === requestId);
    if (req) {
      req.status = action;
      this.showToastMessage(action === 'accepted' ? '✓ Demande acceptée' : 'Demande refusée');
      this.stats.pendingRequests = this.requests.filter(r => r.status === 'pending').length;
    }
    // ── API RÉELLE ──
    // this.dashboardService.updateRequest(requestId, action).subscribe(() => this.loadDashboard());
  }

  // ⚠️ API: PATCH /owner/messages/:id  { read: true }
  markAsRead(messageId: string) {
    const msg = this.messages.find(m => m.id === messageId);
    if (msg && !msg.read) {
      msg.read = true;
      this.stats.unreadMessages = Math.max(0, this.stats.unreadMessages - 1);
    }
  }

  // ⚠️ API: GET /owner/payments/:id/receipt → PDF
  openQuittance(paymentId: string) {
    this.selectedPaymentId = paymentId;
    this.showQuittanceModal = true;
  }

  downloadQuittance() {
    this.showToastMessage('✓ Quittance générée et téléchargée');
    this.showQuittanceModal = false;
    // ── API RÉELLE ──
    // this.dashboardService.downloadReceipt(this.selectedPaymentId).subscribe(blob => {
    //   const url = URL.createObjectURL(blob);
    //   const a = document.createElement('a'); a.href = url; a.download = 'quittance.pdf'; a.click();
    // });
  }

  showToastMessage(msg: string) {
    this.toastMessage = msg;
    this.showToast = true;
    setTimeout(() => this.showToast = false, 3000);
  }

  // ✅ FIX 2 : méthode déplacée DANS la classe (était en dehors par erreur)
  countPayments(status: string): number {
    return this.payments.filter(p => p.status === status).length;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR').format(price);
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      rented: 'Loué', available: 'Disponible', soon: 'Bientôt libre',
      active: 'Actif', late: 'En retard', leaving: 'Départ prochain',
      paid: 'Payé', pending: 'En attente',
    };
    return labels[status] ?? status;
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      rented:    'bg-green-50  text-green-700  border-green-200',
      available: 'bg-amber-50  text-amber-700  border-amber-200',
      soon:      'bg-stone-100 text-stone-600  border-stone-300',
      active:    'bg-green-50  text-green-700  border-green-200',
      late:      'bg-red-50    text-red-700    border-red-200',
      leaving:   'bg-orange-50 text-orange-700 border-orange-200',
      paid:      'bg-green-50  text-green-700  border-green-200',
      pending:   'bg-amber-50  text-amber-700  border-amber-200',
    };
    return classes[status] ?? 'bg-stone-100 text-stone-600 border-stone-200';
  }

  getPaymentForModal(): Payment | undefined {
    return this.payments.find(p => p.id === this.selectedPaymentId);
  }

  get unreadCount(): number {
    return this.messages.filter(m => !m.read).length;
  }

  get pendingCount(): number {
    return this.requests.filter(r => r.status === 'pending').length;
  }
}

// ============================================================
// DONNÉES MOCK  —  ⚠️ Supprimer ce bloc lors de l'intégration API
// ============================================================

const MOCK_STATS: OwnerStats = {
  totalRevenue: 295000,
  revenueEvolution: 8,
  propertiesCount: 4,
  rentedCount: 3,
  occupancyRate: 75,
  pendingRequests: 2,
  unreadMessages: 3,
};

const MOCK_PROPERTIES: OwnerProperty[] = [
  { id: '1', title: 'Studio Moderne',     city: 'Lomé',    district: 'Tokoin',      type: 'Studio',      price: 85000,  status: 'rented',    tenantName: 'Sophie Mensah', coverPhoto: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400' },
  { id: '2', title: 'T2 Lumineux',        city: 'Kara',    district: 'Kpéléwogou', type: 'Appartement', price: 65000,  status: 'rented',    tenantName: 'Karim Bamba',   coverPhoto: 'https://images.unsplash.com/photo-1555636222-cae831e670b3?w=400' },
  { id: '3', title: 'Maison avec jardin', city: 'Kpalimé', district: 'Centre',      type: 'Maison',      price: 120000, status: 'rented',    tenantName: 'Marie Lawson',  coverPhoto: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400' },
  { id: '4', title: 'Loft Atypique',      city: 'Sokodé',  district: 'Marché',      type: 'Appartement', price: 75000,  status: 'available',                              coverPhoto: 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=400' },
];

const MOCK_TENANTS: Tenant[] = [
  { id: 't1', firstName: 'Sophie', lastName: 'Mensah', email: 'sophie.m@email.com', phone: '+228 90 11 22 33', propertyId: '1', propertyTitle: 'Studio Moderne – Lomé',        rentAmount: 85000,  leaseStart: '2025-09-01', leaseEnd: '2026-08-31', status: 'active' },
  { id: 't2', firstName: 'Karim',  lastName: 'Bamba',  email: 'karim.b@email.com',  phone: '+228 91 44 55 66', propertyId: '2', propertyTitle: 'T2 Lumineux – Kara',          rentAmount: 65000,  leaseStart: '2025-10-01', leaseEnd: '2026-09-30', status: 'late'   },
  { id: 't3', firstName: 'Marie',  lastName: 'Lawson', email: 'marie.l@email.com',  phone: '+228 93 77 88 99', propertyId: '3', propertyTitle: 'Maison avec jardin – Kpalimé', rentAmount: 120000, leaseStart: '2025-06-01', leaseEnd: '2026-05-31', status: 'active' },
];

const MOCK_PAYMENTS: Payment[] = [
  { id: 'p1', tenantId: 't1', tenantName: 'Sophie Mensah', propertyTitle: 'Studio Moderne',     amount: 85000,  month: 'Mars 2026',    status: 'paid',    paidAt: '2026-03-02' },
  { id: 'p2', tenantId: 't2', tenantName: 'Karim Bamba',   propertyTitle: 'T2 Lumineux',        amount: 65000,  month: 'Mars 2026',    status: 'pending' },
  { id: 'p3', tenantId: 't3', tenantName: 'Marie Lawson',  propertyTitle: 'Maison avec jardin', amount: 120000, month: 'Mars 2026',    status: 'paid',    paidAt: '2026-03-01' },
  { id: 'p4', tenantId: 't1', tenantName: 'Sophie Mensah', propertyTitle: 'Studio Moderne',     amount: 85000,  month: 'Février 2026', status: 'paid',    paidAt: '2026-02-03' },
  { id: 'p5', tenantId: 't2', tenantName: 'Karim Bamba',   propertyTitle: 'T2 Lumineux',        amount: 65000,  month: 'Février 2026', status: 'late' },
];

const MOCK_MESSAGES: Message[] = [
  { id: 'm1', senderId: 't2', senderName: 'Karim Bamba',   senderInitials: 'KB', preview: "Bonjour, je voulais vous informer que j'aurai un léger retard pour le loyer ce mois-ci...", date: '2026-03-14T10:30:00Z', read: false, propertyTitle: 'T2 Lumineux' },
  { id: 'm2', senderId: 't1', senderName: 'Sophie Mensah', senderInitials: 'SM', preview: "Le robinet de la cuisine fuit depuis hier soir, pourriez-vous envoyer quelqu'un ?",          date: '2026-03-13T16:00:00Z', read: false, propertyTitle: 'Studio Moderne' },
  { id: 'm3', senderId: 'u5', senderName: 'Yawa Attiogbé', senderInitials: 'YA', preview: "Bonjour, je suis très intéressée par votre loft à Sokodé, est-il encore disponible ?",      date: '2026-03-12T09:15:00Z', read: false },
  { id: 'm4', senderId: 't3', senderName: 'Marie Lawson',  senderInitials: 'ML', preview: "Merci pour la réparation rapide ! Tout fonctionne parfaitement maintenant.",                 date: '2026-03-10T14:00:00Z', read: true,  propertyTitle: 'Maison avec jardin' },
];

const MOCK_REQUESTS: ReservationRequest[] = [
  { id: 'r1', tenantName: 'Yawa Attiogbé', tenantInitials: 'YA', propertyTitle: 'Loft Atypique – Sokodé', propertyId: '4', visitDate: '2026-03-20', message: "Bonjour, je travaille à Sokodé et cherche un logement pour avril.",       createdAt: '2026-03-12T09:15:00Z', status: 'pending'  },
  { id: 'r2', tenantName: 'Essi Koudolo',  tenantInitials: 'EK', propertyTitle: 'Loft Atypique – Sokodé', propertyId: '4', visitDate: '2026-03-22', message: "Étudiant en master, très sérieux. Références disponibles sur demande.", createdAt: '2026-03-13T11:00:00Z', status: 'pending'  },
  { id: 'r3', tenantName: 'Paul Aziagbe',  tenantInitials: 'PA', propertyTitle: 'Studio Moderne – Lomé',  propertyId: '1',                           message: "Intéressé par un éventuel renouvellement anticipé.",                  createdAt: '2026-03-10T08:00:00Z', status: 'accepted' },
];
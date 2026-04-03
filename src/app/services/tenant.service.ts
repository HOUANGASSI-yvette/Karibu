import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface TenantOverview {
  tenant_name: string;
  property_address?: string;
  current_lease?: {
    id: number;
    start_date: string;
    end_date: string;
    monthly_rent: number;
    status: string;
  };
  next_payment?: {
    amount: number;
    due_date: string;
    status: 'pending' | 'overdue' | 'paid';
  };
  recent_applications: {
    id: number;
    property: string;
    status: string;
    submitted_date: string;
  }[];
  recent_notifications: {
    id: number;
    message: string;
    date: string;
    read: boolean;
  }[];
  maintenance_requests?: {
    total: number;
    pending: number;
  };
}

export interface TenantPayment {
  id: number;
  amount: number;
  due_date: string;
  paid_date?: string;
  status: 'pending' | 'paid' | 'overdue';
  month: string;
  receipt_url?: string;
}

export interface TenantApplication {
  id: number;
  property: {
    id: number;
    title: string;
    address: string;
  };
  status: 'pending' | 'accepted' | 'rejected';
  submitted_date: string;
  message?: string;
}

export interface MaintenanceRequest {
  id: number;
  title: string;
  description: string;
  status: 'submitted' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  created_date: string;
  assigned_to?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TenantService {
  private readonly apiUrl = `${environment.apiUrl}`;

  // Signals pour l'état
  overview = signal<TenantOverview | null>(null);
  isLoadingOverview = signal(false);

  payments = signal<TenantPayment[]>([]);
  isLoadingPayments = signal(false);

  applications = signal<TenantApplication[]>([]);
  isLoadingApplications = signal(false);

  maintenanceRequests = signal<MaintenanceRequest[]>([]);
  isLoadingMaintenance = signal(false);

  constructor(private http: HttpClient) {}

  // Overview - données générales du locataire
  loadOverview(): Observable<TenantOverview> {
    this.isLoadingOverview.set(true);
    return this.http.get<TenantOverview>(`${this.apiUrl}/bails/tenant/overview/`).pipe(
      map((response: TenantOverview) => {
        this.overview.set(response);
        this.isLoadingOverview.set(false);
        return response;
      }),
      catchError(() => {
        this.isLoadingOverview.set(false);
        // Fallback data si l'API échoue
        const fallbackData: TenantOverview = {
          tenant_name: 'Utilisateur',
          property_address: undefined,
          current_lease: undefined,
          next_payment: undefined,
          recent_applications: [],
          recent_notifications: [],
          maintenance_requests: {
            total: 0,
            pending: 0
          }
        };
        this.overview.set(fallbackData);
        return of(fallbackData);
      })
    );
  }

  // Paiements - utilise l'endpoint mes-paiements
  loadPayments(): Observable<TenantPayment[]> {
    this.isLoadingPayments.set(true);
    return this.http.get<any>(`${this.apiUrl}/bails/paiements/mes-paiements/`).pipe(
      map((response: any) => {
        // Transformer la réponse backend en format TenantPayment
        const payments = response.data || [];
        const transformedPayments = payments.map((payment: any) => ({
          id: payment.id,
          amount: payment.montant,
          due_date: payment.mois_concerne || payment.created_at,
          paid_date: payment.statut === 'paye' ? payment.paye_le : null,
          status: this.mapPaymentStatus(payment.statut),
          month: payment.mois_concerne || 'N/A',
          receipt_url: payment.quittance_url
        }));
        this.payments.set(transformedPayments);
        this.isLoadingPayments.set(false);
        return transformedPayments;
      }),
      catchError(() => {
        this.isLoadingPayments.set(false);
        return of([]);
      })
    );
  }

  // Applications - utilise l'endpoint reservations avec ?sent=true
  loadApplications(): Observable<TenantApplication[]> {
    this.isLoadingApplications.set(true);
    return this.http.get<any>(`${this.apiUrl}/reservations/?sent=true`).pipe(
      map((response: any) => {
        const applications = response.results || response;
        const transformedApps = applications.map((app: any) => ({
          id: app.id,
          property: {
            id: app.property?.id || app.property_id,
            title: app.property?.title || 'Propriété',
            address: app.property?.address || app.property?.location || 'Adresse non disponible'
          },
          status: this.mapReservationStatus(app.status),
          submitted_date: app.created_at,
          message: app.message
        }));
        this.applications.set(transformedApps);
        this.isLoadingApplications.set(false);
        return transformedApps;
      }),
      catchError(() => {
        this.isLoadingApplications.set(false);
        return of([]);
      })
    );
  }

  // Maintenance requests - à créer si nécessaire
  loadMaintenanceRequests(): Observable<MaintenanceRequest[]> {
    this.isLoadingMaintenance.set(true);
    // Endpoint à déterminer
    return new Observable(observer => {
      setTimeout(() => {
        const mockData: MaintenanceRequest[] = [
          {
            id: 1,
            title: 'Fuite dans la salle de bain',
            description: 'Il y a une fuite sous le lavabo',
            status: 'submitted',
            priority: 'high',
            created_date: '2024-03-20'
          }
        ];
        this.maintenanceRequests.set(mockData);
        this.isLoadingMaintenance.set(false);
        observer.next(mockData);
        observer.complete();
      }, 500);
    });
  }

  private mapPaymentStatus(backendStatus: string): 'pending' | 'paid' | 'overdue' {
    switch (backendStatus) {
      case 'paye':
      case 'confirme':
        return 'paid';
      case 'en_attente':
      case 'pending':
        return 'pending';
      case 'en_retard':
      case 'overdue':
        return 'overdue';
      default:
        return 'pending';
    }
  }

  private mapReservationStatus(backendStatus: string): 'pending' | 'accepted' | 'rejected' {
    switch (backendStatus) {
      case 'accepted':
      case 'acceptee':
        return 'accepted';
      case 'rejected':
      case 'rejetee':
        return 'rejected';
      case 'pending':
      case 'en_attente':
      default:
        return 'pending';
    }
  }
}
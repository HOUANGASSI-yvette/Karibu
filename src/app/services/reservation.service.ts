import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ReservationItem {
  id:             number;
  property_title: string;
  property_id:    number;
  owner_name:     string;
  owner_id:       number;       // ← non optionnel : toujours retourné par le serializer
  tenant_name:    string;       // ← non optionnel
  tenant_id:      number;       // ← non optionnel — c'était la cause du bug bouton invisible
  visit_date?:    string;
  message?:       string;
  status:         'pending' | 'accepted' | 'rejected';
  created_at:     string;
  bail_id:        number | null; // ← null si pas encore généré, jamais undefined
}

@Injectable({ providedIn: 'root' })
export class ReservationService {
  private readonly base = `${environment.apiUrl}/reservations`;

  constructor(private http: HttpClient) {}

  /** Demandes reçues — propriétaire */
  getReceivedRequests(): Observable<ReservationItem[]> {
    return this.http.get<ReservationItem[]>(`${this.base}/?received=true`);
  }

  /** Demandes envoyées — locataire */
  getSentRequests(): Observable<ReservationItem[]> {
    return this.http.get<ReservationItem[]>(`${this.base}/?sent=true`);
  }

  /** Accepter ou refuser une demande (propriétaire) */
  updateStatus(id: number, status: 'accepted' | 'rejected'): Observable<ReservationItem> {
    return this.http.patch<ReservationItem>(`${this.base}/${id}/`, { status });
  }

  /** Créer une demande (locataire depuis la page détail) */
  createRequest(data: {
    property_id: number | string;
    visit_date?: string;
    message?: string;
  }): Observable<ReservationItem> {
    return this.http.post<ReservationItem>(`${this.base}/`, data);
  }
}

// services/property.service.ts
import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import {
  Property,
  PropertyCreatePayload,
  PropertyFilters,
  ReservationRequest,
} from '../models/property.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PropertyService {

  private readonly BASE = `${environment.apiUrl}/properties`;

  isLoading = signal(false);

  constructor(private http: HttpClient) {}

  // ── Liste avec filtres ─────────────────────────────────
  // Anciennement getProperties() — conservé pour compatibilité
  getProperties(filters?: PropertyFilters): Observable<Property[]> {
    const params: Record<string, string> = {};
    if (filters?.city)                    params['city']      = filters.city;
    if (filters?.type)                    params['type']      = filters.type;
    if (filters?.priceMin)                params['min_price'] = String(filters.priceMin);
    if (filters?.priceMax)                params['max_price'] = String(filters.priceMax);
    if (filters?.min_price)               params['min_price'] = String(filters.min_price);
    if (filters?.max_price)               params['max_price'] = String(filters.max_price);
    if (filters?.available !== undefined) params['available'] = String(filters.available);
    return this.http.get<Property[]>(`${this.BASE}/`, { params });
  }

  // Alias utilisé dans publish-property
  list(filters?: PropertyFilters): Observable<Property[]> {
    return this.getProperties(filters);
  }

  // ── Détail par ID ──────────────────────────────────────
  // Anciennement getPropertyById(id: string) — conservé
  getPropertyById(id: string | number): Observable<Property> {
    return this.http.get<Property>(`${this.BASE}/${id}/`);
  }

  // Alias court
  get(id: string | number): Observable<Property> {
    return this.getPropertyById(id);
  }

  // ── Mes propriétés ─────────────────────────────────────
  mine(): Observable<Property[]> {
    return this.http.get<Property[]>(`${this.BASE}/mine/`);
  }

  // ── Villes disponibles ─────────────────────────────────
  getCities(): Observable<string[]> {
    return this.http.get<string[]>('/api/cities/');
  }

  // ── Création ───────────────────────────────────────────
  create(payload: PropertyCreatePayload, photos: File[]): Observable<Property> {
    const fd = this.buildFormData(payload as unknown as Record<string, unknown>, photos);
    return this.http.post<Property>(`${this.BASE}/`, fd);
  }

  // ── Modification partielle ─────────────────────────────
  update(
    id: string | number,
    payload: Partial<PropertyCreatePayload>,
    newPhotos?: File[]
  ): Observable<Property> {
    const fd = this.buildFormData(payload as Record<string, unknown>, newPhotos ?? []);
    return this.http.patch<Property>(`${this.BASE}/${id}/`, fd);
  }

  // ── Désactivation logique ──────────────────────────────
  deactivate(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/${id}/`);
  }

  // ── Suppression photo ──────────────────────────────────
  deletePhoto(propertyId: string | number, photoId: string | number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/${propertyId}/photos/${photoId}/`);
  }

  // ── Réservation ────────────────────────────────────────
  createReservation(
    data: ReservationRequest
  ): Observable<{ success: boolean; reservationId?: string }> {
    return this.http.post<{ success: boolean; reservationId?: string }>(
      '/api/reservations/', data
    );
  }

  // ── Helper FormData (camelCase → snake_case) ───────────
  private buildFormData(data: Record<string, unknown>, photos: File[]): FormData {
    const fd = new FormData();
    const fieldMap: Record<string, string> = {
      chargesIncluded: 'charges_included',
      availableFrom:   'available_from',
    };
    for (const [key, val] of Object.entries(data)) {
      if (val === undefined || val === null) continue;
      const apiKey = fieldMap[key] ?? key;
      fd.append(apiKey, Array.isArray(val) ? JSON.stringify(val) : String(val));
    }
    photos.forEach(file => fd.append('photos', file, file.name));
    return fd;
  }
}

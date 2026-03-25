  import { Injectable, signal } from '@angular/core';
  import { HttpClient } from '@angular/common/http';
  import { Observable, of } from 'rxjs';
  import { tap, catchError } from 'rxjs/operators';
  import {
    Property,
    PropertyCreatePayload,
    PropertyFilters,
    ReservationRequest,
    normalizePropertyType
  } from '../models/property.model';
  import { environment } from '../../environments/environment';

  @Injectable({ providedIn: 'root' })
  export class PropertyService {

    private readonly BASE = `${environment.apiUrl}/properties`;

    // Signal indiquant si on charge les propriétés
    isLoading = signal(false);

    // Signal centralisé des propriétés (état partagé)
    properties = signal<Property[]>([]);

    constructor(private http: HttpClient) {}

    // ── Liste avec filtres ─────────────────────────────────
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
    getPropertyById(id: string | number): Observable<Property> {
      return this.http.get<Property>(`${this.BASE}/${id}/`);
    }

    // Alias court
    get(id: string | number): Observable<Property> {
      return this.getPropertyById(id);
    }

    // ── Mes propriétés (appel direct API) ──────────────────
    mine(): Observable<Property[]> {
      return this.http.get<Property[]>(`${this.BASE}/mine/`);
    }

    // ── Charge et met à jour le signal properties (cache) ──
    loadMine(): void {
      this.isLoading.set(true);
      this.mine().pipe(
        tap(props => {
          this.properties.set(props ?? []);
          this.isLoading.set(false);
        }),
        catchError(err => {
          // en cas d'erreur on émet un tableau vide pour éviter undefined dans les composants
          this.properties.set([]);
          this.isLoading.set(false);
          return of([] as Property[]);
        })
      ).subscribe();
    }

    // ── Force refresh et retourne l'observable si besoin d'enchaîner ──
    refreshMine(): Observable<Property[]> {
      this.isLoading.set(true);
      return this.mine().pipe(
        tap(props => {
          this.properties.set(props ?? []);
          this.isLoading.set(false);
        }),
        catchError(err => {
          this.properties.set([]);
          this.isLoading.set(false);
          return of([] as Property[]);
        })
      );
    }

    // ── Met à jour localement une propriété dans le signal (après édition) ──
    updateLocalProperty(updated: Property) {
      const current = this.properties();
      const idx = current.findIndex(p => String(p.id) === String(updated.id));
      if (idx === -1) {
        // si nouvelle propriété, l'ajouter en tête
        this.properties.set([updated, ...current]);
      } else {
        const copy = [...current];
        copy[idx] = { ...copy[idx], ...updated };
        this.properties.set(copy);
      }
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

    private buildFormData(data: Record<string, unknown>, photos: File[]): FormData {
      const fd = new FormData();
      const fieldMap: Record<string, string> = {
        chargesIncluded: 'charges_included',
        availableFrom:   'available_from',
      };
      for (const [key, val] of Object.entries(data)) {
        if (val === undefined || val === null) continue;
        const apiKey = fieldMap[key] ?? key;

        if (typeof val === 'boolean') {
          fd.append(apiKey, val ? 'true' : 'false');
        } else if (Array.isArray(val)) {
          if (val.length > 0) {
            fd.append(apiKey, JSON.stringify(val));
          }
        } else {
          // ← normaliser le type ici
          const finalVal = apiKey === 'type' ? normalizePropertyType(String(val)) : String(val);
          fd.append(apiKey, finalVal);
        }
      }
      photos.forEach(file => fd.append('photos', file, file.name));
      return fd;
    }


  }

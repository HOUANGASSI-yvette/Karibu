import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';


export interface Property {
  id:               number;
  owner:            number;
  owner_name:       string;
  title:            string;
  description:      string;
  type:             string;
  price:            number;
  charges_included: boolean;
  city:             string;
  district:         string;
  address?:         string;
  surface:          number;
  rooms:            number;
  bedrooms:         number;
  bathrooms:        number;
  amenities:        { id: number; name: string }[];
  photos:           { id: number; url: string; order: number }[];  // ← url pas image
  cover_photo?:     string;   // ← champ retourné par ton serializer
  available:        boolean;
  available_from?:  string;
  is_active:        boolean;
  created_at:       string;
  updated_at:       string;
}
export interface PropertyFilters {
  city?:      string;
  type?:      string;
  min_price?: number;
  max_price?: number;
  available?: boolean;
}

@Injectable({ providedIn: 'root' })
export class PropertyService {

  private readonly BASE = `${environment.apiUrl}/properties`;
  isLoading   = signal(false);
  isAvailable = signal(true);

  constructor(private http: HttpClient) {}

  // GET /api/properties/
  getProperties(filters?: PropertyFilters): Observable<Property[]> {
    let params = new HttpParams();
    if (filters?.city)                    params = params.set('city',      filters.city);
    if (filters?.type)                    params = params.set('type',      filters.type);
    if (filters?.min_price)               params = params.set('min_price', filters.min_price);
    if (filters?.max_price)               params = params.set('max_price', filters.max_price);
    if (filters?.available !== undefined) params = params.set('available', String(filters.available));

    this.isLoading.set(true);
    return this.http.get<Property[]>(`${this.BASE}/`, { params }).pipe(
      tap(() => {
        this.isLoading.set(false);
        this.isAvailable.set(true);
      }),
      catchError(err => {
        this.isLoading.set(false);
        this.isAvailable.set(false);
        return throwError(() => err);
      })
    );
  }

  // GET /api/properties/:id/
  getPropertyById(id: number): Observable<Property> {
    return this.http.get<Property>(`${this.BASE}/${id}/`);
  }

  // GET /api/properties/mine/
  getMyProperties(): Observable<Property[]> {
    return this.http.get<Property[]>(`${this.BASE}/mine/`);
  }

  // POST /api/properties/
  createProperty(data: FormData): Observable<Property> {
    return this.http.post<Property>(`${this.BASE}/`, data);
  }

  // PATCH /api/properties/:id/
  updateProperty(id: number, data: FormData): Observable<Property> {
    return this.http.patch<Property>(`${this.BASE}/${id}/`, data);
  }

  // DELETE /api/properties/:id/
  deleteProperty(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/${id}/`);
  }

  // DELETE /api/properties/:id/photos/:photoId/
  deletePhoto(propertyId: number, photoId: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/${propertyId}/photos/${photoId}/`);
  }
}

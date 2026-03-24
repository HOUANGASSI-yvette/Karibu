// models/property.model.ts

// ── Types ──────────────────────────────────────────────────

export type PropertyType =
  | 'apartment' | 'house' | 'studio' | 'villa'
  | 'office'    | 'land'  | 'commercial'
  // Anciennes valeurs françaises conservées pour compatibilité mock
  | 'appartement' | 'maison' | 'chambre';

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  apartment:  'Appartement',
  house:      'Maison',
  studio:     'Studio',
  villa:      'Villa',
  office:     'Bureau',
  land:       'Terrain',
  commercial: 'Local commercial',
  // Aliases français
  appartement: 'Appartement',
  maison:      'Maison',
  chambre:     'Chambre',
};

// ── Sous-types retournés par le backend ───────────────────

export interface PropertyPhoto {
  id: number;
  url: string;
  order: number;
  uploaded_at: string;
}

export interface PropertyAmenity {
  id: number;
  name: string;
}

// ── Modèle principal ──────────────────────────────────────
// Accepte à la fois :
//   - les réponses du backend Django (id: number, amenities: PropertyAmenity[], photos: PropertyPhoto[])
//   - les données mock (id: string, amenities: string[], photos: string[])

export interface Property {
  id: number | string;
  owner?: number;
  owner_name?: string;

  // Champs communs mock ↔ backend
  title: string;
  type: string;
  city: string;
  district: string;
  address?: string;
  description: string;
  surface: number;
  rooms: number;
  bedrooms: number;
  bathrooms: number;
  price: number;
  available: boolean;
  available_from?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;

  // Backend : snake_case
  charges_included?: boolean;

  // Mock : camelCase (rétrocompatibilité)
  chargesIncluded?: boolean;
  availableFrom?: string;
  ownerId?: string;
  ownerName?: string;
  ownerPhone?: string;
  createdAt?: string;
  updatedAt?: string;
  coverPhoto?: string;
  cover_photo?: string | null;

  // Équipements : string[] (mock) OU PropertyAmenity[] (backend)
  amenities: string[] | PropertyAmenity[];

  // Photos : string[] (mock) OU PropertyPhoto[] (backend)
  photos: string[] | PropertyPhoto[];
}

// ── Helpers pour lire amenities/photos indifféremment ─────

export function getAmenityNames(amenities: Property['amenities']): string[] {
  if (!amenities?.length) return [];
  return typeof amenities[0] === 'string'
    ? (amenities as string[])
    : (amenities as PropertyAmenity[]).map(a => a.name);
}

export function getPhotoUrls(photos: Property['photos']): string[] {
  if (!photos?.length) return [];
  return typeof photos[0] === 'string'
    ? (photos as string[])
    : (photos as PropertyPhoto[]).map(p => p.url);
}

export function getCoverPhoto(property: Property): string {
  return (
    property.cover_photo ??
    property.coverPhoto ??
    getPhotoUrls(property.photos)[0] ??
    ''
  );
}

// ── Payload création (front → backend) ───────────────────

export interface PropertyCreatePayload {
  title: string;
  type: string;
  city: string;
  district: string;
  address?: string;
  description: string;
  surface: number;
  rooms: number;
  bedrooms: number;
  bathrooms: number;
  price: number;
  chargesIncluded: boolean;
  available: boolean;
  availableFrom?: string;
  amenities: string[];
}

// ── Filtres de recherche ──────────────────────────────────

export interface PropertyFilters {
  city?: string;
  type?: string;
  priceMin?: number;
  priceMax?: number;
  min_price?: number;
  max_price?: number;
  roomsMin?: number;
  surfaceMin?: number;
  available?: boolean;
  search?: string;
}

// ── Réservation ───────────────────────────────────────────

export interface ReservationRequest {
  propertyId: string | number;
  tenantId?: string;
  visitDate?: string;
  message?: string;
}

// ── Preview photo locale (avant upload) ──────────────────

export interface PhotoPreview {
  file: File;
  url: string;
  name: string;
  size: string;
}

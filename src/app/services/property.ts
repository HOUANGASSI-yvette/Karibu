import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { Property, PropertyFilters, ReservationRequest } from '../models/property.model';

// ============================================================
// SERVICE : PropertyService
// ============================================================
// Centralise TOUS les appels API liés aux propriétés.
// Actuellement en mode MOCK (données fictives).
//
// ⚠️  ÉTAPES D'INTÉGRATION API :
//  1. Remplacer BASE_URL par l'URL de votre API
//  2. Ajouter HttpClientModule dans app.config.ts
//  3. Dans chaque méthode, remplacer le bloc "// MOCK"
//     par le bloc "// API RÉELLE" (déjà écrit ci-dessous)
//  4. Adapter les noms de champs si nécessaire (voir property.model.ts)
// ============================================================

@Injectable({ providedIn: 'root' })
export class PropertyService {

  // ⚠️ API: remplacer par votre URL de base
  // Ex: 'https://api.karibu.tg/v1'  ou  'http://localhost:3000/api'
  private readonly BASE_URL = 'https://api.karibu.tg/v1';

  // Signal pour suivre le chargement global (utilisable dans les composants)
  isLoading = signal(false);

  constructor(private http: HttpClient) {}

  // ----------------------------------------------------------
  // RÉCUPÉRER LA LISTE DES PROPRIÉTÉS (avec filtres)
  // ----------------------------------------------------------
  // ⚠️ API: endpoint attendu → GET /properties?city=Lomé&priceMax=100000...
  getProperties(filters?: PropertyFilters): Observable<Property[]> {

    // ── MODE MOCK (supprimer ce bloc lors de l'intégration) ──
    return of(MOCK_PROPERTIES.filter(p => {
      if (filters?.city && p.city !== filters.city) return false;
      if (filters?.type && p.type !== filters.type) return false;
      if (filters?.priceMin && p.price < filters.priceMin) return false;
      if (filters?.priceMax && p.price > filters.priceMax) return false;
      if (filters?.roomsMin && p.rooms < filters.roomsMin) return false;
      if (filters?.available !== undefined && p.available !== filters.available) return false;
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        return p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      }
      return true;
    })).pipe(delay(400)); // Simule la latence réseau
    // ── FIN MOCK ──

    // ── API RÉELLE (décommenter lors de l'intégration) ──
    // let params = new HttpParams();
    // if (filters?.city)     params = params.set('city', filters.city);
    // if (filters?.type)     params = params.set('type', filters.type);
    // if (filters?.priceMin) params = params.set('priceMin', filters.priceMin);
    // if (filters?.priceMax) params = params.set('priceMax', filters.priceMax);
    // if (filters?.roomsMin) params = params.set('roomsMin', filters.roomsMin);
    // if (filters?.available !== undefined) params = params.set('available', filters.available);
    // if (filters?.search)   params = params.set('search', filters.search);
    // return this.http.get<Property[]>(`${this.BASE_URL}/properties`, { params });
    // ── FIN API RÉELLE ──
  }

  // ----------------------------------------------------------
  // RÉCUPÉRER UNE PROPRIÉTÉ PAR SON ID
  // ----------------------------------------------------------
  // ⚠️ API: endpoint attendu → GET /properties/:id
  getPropertyById(id: string): Observable<Property | undefined> {

    // ── MODE MOCK ──
    const found = MOCK_PROPERTIES.find(p => p.id === id);
    return of(found).pipe(delay(300));
    // ── FIN MOCK ──

    // ── API RÉELLE ──
    // return this.http.get<Property>(`${this.BASE_URL}/properties/${id}`);
    // ── FIN API RÉELLE ──
  }

  // ----------------------------------------------------------
  // RÉCUPÉRER LES VILLES DISPONIBLES (pour le filtre)
  // ----------------------------------------------------------
  // ⚠️ API: endpoint attendu → GET /cities  ou extrait des propriétés
  getCities(): Observable<string[]> {

    // ── MODE MOCK ──
    const cities = [...new Set(MOCK_PROPERTIES.map(p => p.city))].sort();
    return of(cities).pipe(delay(100));
    // ── FIN MOCK ──

    // ── API RÉELLE ──
    // return this.http.get<string[]>(`${this.BASE_URL}/cities`);
    // ── FIN API RÉELLE ──
  }

  // ----------------------------------------------------------
  // ENVOYER UNE DEMANDE DE RÉSERVATION
  // ----------------------------------------------------------
  // ⚠️ API: endpoint attendu → POST /reservations
  //     Retourne l'objet réservation créé avec un ID
  createReservation(data: ReservationRequest): Observable<{ success: boolean; reservationId?: string }> {

    // ── MODE MOCK ──
    console.log('[MOCK] Réservation envoyée:', data);
    return of({ success: true, reservationId: 'mock-res-001' }).pipe(delay(800));
    // ── FIN MOCK ──

    // ── API RÉELLE ──
    // return this.http.post<{ success: boolean; reservationId: string }>(
    //   `${this.BASE_URL}/reservations`, data
    // );
    // ── FIN API RÉELLE ──
  }
}

// ============================================================
// DONNÉES MOCK
// ============================================================
// ⚠️ Supprimer ce bloc entier une fois l'API intégrée.
//    Ces données servent uniquement au développement frontend.
// ============================================================
const MOCK_PROPERTIES: Property[] = [
  {
    id: '1',
    title: 'Studio moderne centre Lomé',
    description: 'Beau studio entièrement meublé au cœur de Lomé. Cuisine équipée, salle de bain privée, climatisation et connexion WiFi inclus. Idéal pour étudiant ou jeune actif. Gardien sur place 24h/24. À 5 min à pied du marché de Kégué.',
    type: 'studio',
    price: 85000,
    chargesIncluded: true,
    city: 'Lomé',
    district: 'Tokoin',
    address: 'Rue des Fleurs, Tokoin',
    surface: 28,
    rooms: 1,
    bedrooms: 1,
    bathrooms: 1,
    amenities: ['WiFi', 'Climatisation', 'Meublé', 'Gardien', 'Eau courante'],
    photos: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
    ],
    coverPhoto: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    available: true,
    ownerId: 'owner-1',
    ownerName: 'Koffi Mensah',
    ownerPhone: '+228 90 12 34 56',
    createdAt: '2026-02-10T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
  },
  {
    id: '2',
    title: 'T2 lumineux avec terrasse – Kara',
    description: 'Appartement 2 pièces très lumineux avec grande terrasse privée. Quartier calme et résidentiel. Cuisine ouverte américaine, parking privé inclus. Propriétaire disponible et réactif. Proche écoles et commerces.',
    type: 'appartement',
    price: 65000,
    chargesIncluded: false,
    city: 'Kara',
    district: 'Kpéléwogou',
    surface: 45,
    rooms: 2,
    bedrooms: 1,
    bathrooms: 1,
    amenities: ['Parking', 'Terrasse', 'Cuisine équipée', 'Eau courante', 'Électricité'],
    photos: [
      'https://images.unsplash.com/photo-1555636222-cae831e670b3?w=800',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
    ],
    coverPhoto: 'https://images.unsplash.com/photo-1555636222-cae831e670b3?w=800',
    available: true,
    ownerId: 'owner-2',
    ownerName: 'Ama Kludze',
    ownerPhone: '+228 91 23 45 67',
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-02-20T08:00:00Z',
  },
  {
    id: '3',
    title: 'Maison familiale avec jardin – Kpalimé',
    description: 'Grande maison familiale de 4 pièces avec jardin arboré et piscine privée. Cuisine équipée, 2 salles de bain, parking pour 2 voitures. Environnement verdoyant, au calme. Parfaite pour famille ou expatriés.',
    type: 'maison',
    price: 120000,
    chargesIncluded: false,
    city: 'Kpalimé',
    district: 'Kpalimé Centre',
    surface: 95,
    rooms: 4,
    bedrooms: 3,
    bathrooms: 2,
    amenities: ['Jardin', 'Piscine', 'Parking', 'Gardien', 'Climatisation', 'Groupe électrogène'],
    photos: [
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
      'https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=800',
    ],
    coverPhoto: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
    available: true,
    ownerId: 'owner-3',
    ownerName: 'Pierre Kokou',
    ownerPhone: '+228 93 34 56 78',
    createdAt: '2026-01-05T09:00:00Z',
    updatedAt: '2026-03-05T09:00:00Z',
  },
  {
    id: '4',
    title: 'Loft atypique – Sokodé',
    description: 'Loft design au style industriel, très spacieux. Plafonds hauts, grandes fenêtres. Bureau intégré idéal pour télétravail. Cuisine américaine ouverte. Situé dans quartier dynamique proche du marché central.',
    type: 'appartement',
    price: 75000,
    chargesIncluded: true,
    city: 'Sokodé',
    district: 'Marché Central',
    surface: 60,
    rooms: 2,
    bedrooms: 1,
    bathrooms: 1,
    amenities: ['WiFi', 'Meublé', 'Climatisation', 'Bureau', 'Eau courante'],
    photos: [
      'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    ],
    coverPhoto: 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800',
    available: false,
    availableFrom: '2026-05-01',
    ownerId: 'owner-4',
    ownerName: 'Yawa Attiogbé',
    createdAt: '2026-02-01T11:00:00Z',
    updatedAt: '2026-02-28T11:00:00Z',
  },
  {
    id: '5',
    title: 'Villa standing vue mer – Lomé',
    description: 'Magnifique villa haut standing avec vue sur l\'Atlantique. Piscine privée, jardin paysager, 4 chambres avec salles de bain ensuite. Sécurité 24h/24, générateur, eau de forage. Quartier résidentiel prisé.',
    type: 'villa',
    price: 350000,
    chargesIncluded: false,
    city: 'Lomé',
    district: 'Bè Kpota',
    surface: 200,
    rooms: 6,
    bedrooms: 4,
    bathrooms: 4,
    amenities: ['Piscine', 'Jardin', 'Parking', 'Gardien', 'Groupe électrogène', 'Climatisation', 'WiFi', 'Vue mer'],
    photos: [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
    ],
    coverPhoto: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
    available: true,
    ownerId: 'owner-5',
    ownerName: 'Jean-Luc Donou',
    ownerPhone: '+228 99 45 67 89',
    createdAt: '2026-01-20T14:00:00Z',
    updatedAt: '2026-03-10T14:00:00Z',
  },
  {
    id: '6',
    title: 'Studio meublé étudiant – Lomé',
    description: 'Studio compact et fonctionnel, idéal pour étudiant. Proche de l\'Université de Lomé. Tout équipé : lit, bureau, réfrigérateur. Accès internet. Contrat flexible possible. Gardien dans l\'immeuble.',
    type: 'studio',
    price: 45000,
    chargesIncluded: true,
    city: 'Lomé',
    district: 'Université',
    surface: 20,
    rooms: 1,
    bedrooms: 1,
    bathrooms: 1,
    amenities: ['WiFi', 'Meublé', 'Gardien', 'Eau courante'],
    photos: [
      'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800',
    ],
    coverPhoto: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800',
    available: true,
    ownerId: 'owner-6',
    ownerName: 'Sœur Marie Akakpo',
    createdAt: '2026-03-01T07:00:00Z',
    updatedAt: '2026-03-01T07:00:00Z',
  },
];
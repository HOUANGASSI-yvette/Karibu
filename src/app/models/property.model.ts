// ============================================================
// MODÈLE DE DONNÉES : Property
// ============================================================
// Ce fichier définit la structure exacte d'un appartement
// tel que retourné par l'API backend.
//
// ⚠️  LORS DE L'INTÉGRATION API :
//     Adapter les noms des champs pour qu'ils correspondent
//     exactement à la réponse JSON de votre API.
//     Ex: si l'API retourne "monthly_price" → renommer `price`
// ============================================================

export interface Property {
  // --- Identifiant unique ---
  // ⚠️ API: champ "id" ou "_id" selon votre backend (MongoDB → "_id")
  id: string;

  // --- Informations principales ---
  title: string;           // Titre de l'annonce  (ex: "Studio lumineux centre-ville")
  description: string;     // Description complète du bien
  type: PropertyType;      // Type de bien (voir enum ci-dessous)

  // --- Prix ---
  // ⚠️ API: vérifier l'unité (FCFA, EUR...) et si charges comprises
  price: number;           // Loyer mensuel en FCFA
  chargesIncluded: boolean; // true = charges comprises

  // --- Localisation ---
  // ⚠️ API: certaines API retournent un objet imbriqué "location: { city, district, ... }"
  city: string;            // Ville  (ex: "Lomé")
  district: string;        // Quartier  (ex: "Tokoin")
  address?: string;        // Adresse complète (optionnelle)
  // ⚠️ API: coordonnées GPS pour carte
  lat?: number;
  lng?: number;

  // --- Caractéristiques ---
  surface: number;         // Surface en m²
  rooms: number;           // Nombre de pièces
  bedrooms: number;        // Nombre de chambres
  bathrooms: number;       // Nombre de salles de bain

  // --- Équipements ---
  // ⚠️ API: peut être un tableau de strings ou d'objets { id, label }
  amenities: string[];     // Ex: ["WiFi", "Climatisation", "Parking", "Gardien"]

  // --- Photos ---
  // ⚠️ API: peut être des URLs absolues ("https://...") ou relatives ("/uploads/...")
  //     Si relatives → préfixer avec la BASE_URL de l'API
  photos: string[];        // Tableau d'URLs des photos
  coverPhoto: string;      // Photo principale (première carte)

  // --- Disponibilité ---
  available: boolean;      // true = disponible immédiatement
  availableFrom?: string;  // ISO date si disponible à partir d'une date  (ex: "2026-04-01")

  // --- Propriétaire ---
  // ⚠️ API: peut être un objet imbriqué "owner: { id, name, phone... }"
  ownerId: string;
  ownerName: string;
  ownerPhone?: string;

  // --- Métadonnées ---
  createdAt: string;       // ISO date de publication
  updatedAt: string;       // ISO date de dernière modification
}

// Types de biens disponibles
// ⚠️ API: adapter les valeurs si l'API utilise d'autres labels
export type PropertyType = 'studio' | 'appartement' | 'maison' | 'villa' | 'chambre';

// Libellés affichables pour chaque type
export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  studio: 'Studio',
  appartement: 'Appartement',
  maison: 'Maison',
  villa: 'Villa',
  chambre: 'Chambre',
};

// ============================================================
// MODÈLE : Filtres de recherche
// ============================================================
// Paramètres envoyés à l'API pour filtrer les résultats.
// ⚠️ API: adapter les noms des query params selon la doc API
//     Ex: "priceMin" → "price_min", "city" → "location"
// ============================================================
export interface PropertyFilters {
  city?: string;       // Filtre par ville          → ?city=Lomé
  type?: PropertyType; // Filtre par type            → ?type=studio
  priceMin?: number;   // Prix minimum               → ?priceMin=50000
  priceMax?: number;   // Prix maximum               → ?priceMax=150000
  roomsMin?: number;   // Nombre de pièces minimum   → ?roomsMin=2
  surfaceMin?: number; // Surface minimum en m²      → ?surfaceMin=30
  available?: boolean; // Disponible uniquement       → ?available=true
  search?: string;     // Recherche texte libre       → ?search=piscine
}

// ============================================================
// MODÈLE : Réservation
// ============================================================
// Données envoyées à l'API lors d'une demande de réservation
// ⚠️ API: adapter selon ce qu'attend votre endpoint POST /reservations
// ============================================================
export interface ReservationRequest {
  propertyId: string;
  tenantId: string;     // ID de l'utilisateur connecté
  visitDate?: string;   // ISO date souhaitée pour visite
  message?: string;     // Message optionnel au propriétaire
}
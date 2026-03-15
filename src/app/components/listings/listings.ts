import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Property, PropertyFilters } from '../../models/property.model';
import { PropertyService } from '../../services/property';
import { FilterBarComponent } from './filter-bar/filter-bar';
import { PropertyCardComponent } from './property-card/property-card';

// ============================================================
// COMPOSANT : ListingsComponent  —  route: /listings
// ============================================================
// Page principale de recherche de logements pour le locataire.
// Charge la liste des propriétés via PropertyService,
// applique les filtres et affiche les résultats en grille.
//
// Flux de données :
//   API → PropertyService.getProperties(filters)
//       → this.properties (affiché via PropertyCardComponent)
//
// ⚠️ INTÉGRATION API :
//   Aucun changement à faire ici. Tout se passe dans :
//   → property.service.ts  (activer le bloc "API RÉELLE")
//   → property.model.ts    (adapter les noms de champs)
// ============================================================

@Component({
  selector: 'app-listings',
  standalone: true,
  imports: [RouterLink, CommonModule, FilterBarComponent, PropertyCardComponent],
  templateUrl: './listings.html',
})
export class ListingsComponent implements OnInit {

  // Liste des propriétés affichées
  properties: Property[] = [];

  // État de chargement (affiche le skeleton loader)
  isLoading = true;

  // Message d'erreur si l'API échoue
  // ⚠️ API: intercepter les erreurs HTTP ici
  errorMessage = '';

  // Filtres actifs (transmis par FilterBarComponent)
  currentFilters: PropertyFilters = {};

  // Mode d'affichage : grille ou liste
  viewMode: 'grid' | 'list' = 'grid';

  constructor(private propertyService: PropertyService) {}

  ngOnInit() {
    // Chargement initial sans filtre → toutes les propriétés
    this.loadProperties();
  }

  // ----------------------------------------------------------
  // Charger les propriétés (avec ou sans filtres)
  // ----------------------------------------------------------
  loadProperties(filters?: PropertyFilters) {
    this.isLoading = true;
    this.errorMessage = '';

    // ⚠️ API: PropertyService.getProperties() appellera l'API réelle
    //         une fois le bloc "API RÉELLE" décommenté dans le service
    this.propertyService.getProperties(filters).subscribe({
      next: (data) => {
        this.properties = data;
        this.isLoading = false;
      },
      error: (err) => {
        // ⚠️ API: adapter le message selon les codes d'erreur HTTP
        //         ex: 401 → rediriger vers login
        //             503 → "Serveur temporairement indisponible"
        console.error('Erreur chargement propriétés:', err);
        this.errorMessage = 'Impossible de charger les annonces. Veuillez réessayer.';
        this.isLoading = false;
      }
    });
  }

  // ----------------------------------------------------------
  // Récepteur des changements de filtres (depuis FilterBarComponent)
  // ----------------------------------------------------------
  onFiltersChange(filters: PropertyFilters) {
    this.currentFilters = filters;
    this.loadProperties(filters);
  }

  // Tableau de squelettes pour le skeleton loader (6 cartes)
  get skeletons() { return Array(6); }
}
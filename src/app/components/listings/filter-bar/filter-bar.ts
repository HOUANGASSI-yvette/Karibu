import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PropertyFilters, PropertyType, PROPERTY_TYPE_LABELS } from '../../../models/property.model';
import { PropertyService } from '../../../services/property';

// ============================================================
// COMPOSANT : FilterBarComponent
// ============================================================
// Barre de filtres pour la page de listings.
// Émet un événement (filtersChange) chaque fois que l'utilisateur
// modifie un filtre. La page parente (ListingsComponent) reçoit
// ces filtres et appelle l'API via PropertyService.
//
// ⚠️ API: les valeurs des filtres sont directement passées
//    à PropertyService.getProperties(filters) → envoyées en
//    query params à l'API. Adapter les noms dans property.model.ts
// ============================================================

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './filter-bar.html',
})
export class FilterBarComponent implements OnInit {

  // Nombre de résultats affiché dans la barre (reçu du parent)
  @Input() resultCount = 0;

  // Événement émis vers ListingsComponent à chaque changement de filtre
  @Output() filtersChange = new EventEmitter<PropertyFilters>();

  // Villes disponibles chargées depuis le service
  // ⚠️ API: vient de PropertyService.getCities() → GET /cities
  cities: string[] = [];

  // Types de biens pour le select
  propertyTypes = Object.entries(PROPERTY_TYPE_LABELS) as [PropertyType, string][];

  // Tranches de prix prédéfinies
  priceRanges = [
    { label: 'Tous les prix', min: undefined, max: undefined },
    { label: 'Moins de 50 000 CFA', min: undefined, max: 50000 },
    { label: '50 000 – 100 000 CFA', min: 50000, max: 100000 },
    { label: '100 000 – 200 000 CFA', min: 100000, max: 200000 },
    { label: 'Plus de 200 000 CFA', min: 200000, max: undefined },
  ];

  // État local des filtres sélectionnés
  filters: PropertyFilters = {};

  // Filtre de recherche texte libre
  searchQuery = '';

  // Tranche de prix sélectionnée (index dans priceRanges)
  selectedPriceIndex = 0;

  // Contrôle l'affichage du panneau mobile
  showMobileFilters = false;

  constructor(private propertyService: PropertyService) {}

  ngOnInit() {
    // Charger les villes disponibles
    // ⚠️ API: remplacé automatiquement si PropertyService.getCities()
    //        appelle l'API réelle
    this.propertyService.getCities().subscribe(cities => {
      this.cities = cities;
    });
  }

  // Appelé à chaque changement de filtre → émet vers le parent
  onFilterChange() {
    // Appliquer la tranche de prix sélectionnée
    const range = this.priceRanges[this.selectedPriceIndex];
    this.filters.priceMin = range.min;
    this.filters.priceMax = range.max;
    this.filters.search = this.searchQuery || undefined;

    // Émettre les filtres vers ListingsComponent
    this.filtersChange.emit({ ...this.filters });
  }

  // Réinitialiser tous les filtres
  resetFilters() {
    this.filters = {};
    this.searchQuery = '';
    this.selectedPriceIndex = 0;
    this.filtersChange.emit({});
  }

  // Compter le nombre de filtres actifs (pour le badge mobile)
  get activeFilterCount(): number {
    let count = 0;
    if (this.filters.city) count++;
    if (this.filters.type) count++;
    if (this.selectedPriceIndex > 0) count++;
    if (this.filters.roomsMin) count++;
    if (this.searchQuery) count++;
    return count;
  }
}
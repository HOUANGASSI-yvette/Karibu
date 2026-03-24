import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PropertyService } from '../../../services/property.service';
import { PropertyFilters } from '../../../models/property.model';

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './filter-bar.html',
})
export class FilterBarComponent implements OnInit {

  @Input() resultCount = 0;
  @Input() isLoading   = false;  // ✅ fix TS2339
  @Output() filtersChange = new EventEmitter<PropertyFilters>();

  cities: string[] = [];

  propertyTypes: { value: string; label: string }[] = [
    { value: 'apartment',  label: 'Appartement' },
    { value: 'house',      label: 'Maison' },
    { value: 'studio',     label: 'Studio' },
    { value: 'villa',      label: 'Villa' },
    { value: 'office',     label: 'Bureau' },
    { value: 'land',       label: 'Terrain' },
    { value: 'commercial', label: 'Local commercial' },
  ];

  priceRanges = [
    { label: 'Tous les prix',     min: undefined as number | undefined, max: undefined as number | undefined },
    { label: 'Moins de 50 000',   min: undefined,  max: 50000  },
    { label: '50 000 – 100 000',  min: 50000,      max: 100000 },
    { label: '100 000 – 200 000', min: 100000,     max: 200000 },
    { label: 'Plus de 200 000',   min: 200000,     max: undefined },
  ];

  selectedCity       = '';
  selectedType       = '';
  selectedPriceIndex = 0;
  availableOnly      = false;
  showMobileFilters  = false;

  constructor(private propertyService: PropertyService) {}

  ngOnInit() {
    this.propertyService.getProperties().subscribe({
      next: (data: any) => {
        const props = Array.isArray(data) ? data : (data?.results ?? []);
        // ✅ fix TS2322 — cast explicite en string[]
        this.cities = [...new Set<string>(props.map((p: any) => String(p.city)))].sort();
      },
      error: () => {}
    });
  }

  onFilterChange() {
    const range = this.priceRanges[this.selectedPriceIndex];
    const filters: PropertyFilters = {};

    if (this.selectedCity)       filters.city      = this.selectedCity;
    if (this.selectedType)       filters.type      = this.selectedType;
    if (range.min !== undefined) filters.min_price = range.min;
    if (range.max !== undefined) filters.max_price = range.max;
    if (this.availableOnly)      filters.available = true;

    this.filtersChange.emit(filters);
  }

  resetFilters() {
    this.selectedCity       = '';
    this.selectedType       = '';
    this.selectedPriceIndex = 0;
    this.availableOnly      = false;
    this.filtersChange.emit({});
  }

  get activeFilterCount(): number {
    let count = 0;
    if (this.selectedCity)           count++;
    if (this.selectedType)           count++;
    if (this.selectedPriceIndex > 0) count++;
    if (this.availableOnly)          count++;
    return count;
  }
}

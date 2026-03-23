import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../shared/navbar/navbar';
import { PropertyService, Property, PropertyFilters } from '../../services/property.service';
import { PropertyCardComponent } from './property-card/property-card';
import { FilterBarComponent } from './filter-bar/filter-bar';
import { LucideAngularModule, WifiOff, RefreshCw, Home } from 'lucide-angular';

@Component({
  selector: 'app-listings',
  standalone: true,
  imports: [CommonModule, NavbarComponent, PropertyCardComponent, FilterBarComponent, LucideAngularModule],
  templateUrl: './listings.html',
  changeDetection: ChangeDetectionStrategy.Default,
})
export class ListingsComponent implements OnInit {

  readonly OfflineIcon = WifiOff;
  readonly RetryIcon   = RefreshCw;
  readonly HomeIcon    = Home;

  properties:     Property[] = [];
  isLoading       = true;
  errorMessage    = '';
  currentFilters: PropertyFilters = {};
  viewMode: 'grid' | 'list' = 'grid';

  constructor(
    public propertyService: PropertyService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadProperties();
  }

  loadProperties(filters?: PropertyFilters) {
    this.isLoading    = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.propertyService.getProperties(filters).subscribe({
      next: (data: any) => {
        this.properties = Array.isArray(data) ? data : (data?.results ?? []);
        this.isLoading  = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading    = false;
        this.errorMessage = err.status === 0
          ? 'Serveur inaccessible. Vérifiez votre connexion.'
          : err.status === 503
            ? 'Service temporairement indisponible.'
            : 'Impossible de charger les annonces.';
        this.cdr.detectChanges();
      }
    });
  }

  onFiltersChange(filters: PropertyFilters) {
    this.currentFilters = filters;
    this.loadProperties(filters);
  }

  get skeletons() { return Array(6); }
}

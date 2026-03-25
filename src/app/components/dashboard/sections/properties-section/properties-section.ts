// properties-section.component.ts
import { Component, OnInit, ViewChild, inject, Output, EventEmitter, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PropertyService } from '../../../../services/property.service';
import { Property, getCoverPhoto } from '../../../../models/property.model';
import { EditPropertyPanelComponent } from './edit-property-panel.component/edit-property-panel.component';

@Component({
  selector: 'app-properties-section',
  standalone: true,
  imports: [CommonModule, RouterLink, EditPropertyPanelComponent],
  templateUrl: './properties-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertiesSectionComponent implements OnInit {

  @ViewChild('editPanel') editPanel!: EditPropertyPanelComponent;
  @Output() countChange = new EventEmitter<number>();

  private propertyService = inject(PropertyService);
  private cdr             = inject(ChangeDetectorRef);

  properties: Property[] = [];
  isLoading = true;
  errorMsg  = '';

  ngOnInit(): void {
    this.loadProperties();
  }

  loadProperties(): void {
    this.isLoading = true;
    this.errorMsg  = '';
    this.cdr.markForCheck();

    this.propertyService.mine().subscribe({
      next: (data) => {
        this.properties = data;
        this.isLoading  = false;
        this.countChange.emit(data.length);
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMsg  = 'Impossible de charger vos biens.';
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  openEdit(property: Property): void {
    this.editPanel.open(property);
  }

  onSaved(updated: Property): void {
    const idx = this.properties.findIndex(p => p.id === updated.id);
    if (idx !== -1) {
      this.properties = [...this.properties];
      this.properties[idx] = updated;
      this.cdr.markForCheck();
    }
  }

  formatPrice(n: number): string {
    return n.toLocaleString('fr-FR');
  }

  getPropertyCover(p: Property): string {
    return getCoverPhoto(p) || 'assets/placeholder-property.jpg';
  }

  getStatusClass(p: Property): string {
    if (!p.available)     return 'bg-green-50 text-green-700 border-green-200';
    if (p.available_from) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-blue-50 text-blue-700 border-blue-200';
  }

  getStatusLabel(p: Property): string {
    if (!p.available)     return 'Loué';
    if (p.available_from) return 'Bientôt';
    return 'Disponible';
  }

  getTypeLabel(type: string): string {
    const map: Record<string, string> = {
      apartment: 'Appartement', house: 'Maison', studio: 'Studio',
      villa: 'Villa', office: 'Bureau', land: 'Terrain', commercial: 'Local comm.',
    };
    return map[type] ?? type;
  }
}

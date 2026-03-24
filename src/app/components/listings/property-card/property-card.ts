import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  Property,
  PropertyAmenity,
  getPhotoUrls,
  getAmenityNames,
  getCoverPhoto,
} from '../../../models/property.model';

@Component({
  selector: 'app-property-card',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './property-card.html',
})
export class PropertyCardComponent {

  @Input() property!: Property;

  typeLabels: Record<string, string> = {
    apartment:   'Appartement',
    house:       'Maison',
    studio:      'Studio',
    villa:       'Villa',
    office:      'Bureau',
    land:        'Terrain',
    commercial:  'Local commercial',
    appartement: 'Appartement',
    maison:      'Maison',
    chambre:     'Chambre',
  };

  // ── Getters normalisés — le template ne voit que des types simples ──

  get coverPhotoUrl(): string {
    return (
      getCoverPhoto(this.property) ||
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800'
    );
  }

  get photoCount(): number {
    return getPhotoUrls(this.property.photos).length;
  }

  // Toujours PropertyAmenity[] — jamais string[]
  get amenitiesPreview(): PropertyAmenity[] {
    return this._normalizedAmenities.slice(0, 3);
  }

  get extraAmenitiesCount(): number {
    const total = this._normalizedAmenities.length;
    return total > 3 ? total - 3 : 0;
  }

  // Convertit string[] → PropertyAmenity[] pour que le template
  // puisse toujours utiliser amenity.id et amenity.name
  private get _normalizedAmenities(): PropertyAmenity[] {
    if (!this.property?.amenities?.length) return [];
    if (typeof this.property.amenities[0] === 'string') {
      return (this.property.amenities as string[]).map((name, i) => ({
        id: i,
        name,
      }));
    }
    return this.property.amenities as PropertyAmenity[];
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR').format(price);
  }

  onImageError(event: Event) {
    (event.target as HTMLImageElement).src =
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800';
  }
}

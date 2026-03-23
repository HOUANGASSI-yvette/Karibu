import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Property } from '../../../services/property.service';

@Component({
  selector: 'app-property-card',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './property-card.html',
})
export class PropertyCardComponent {

  @Input() property!: Property;

  typeLabels: Record<string, string> = {
    apartment:  'Appartement',
    house:      'Maison',
    studio:     'Studio',
    villa:      'Villa',
    office:     'Bureau',
    land:       'Terrain',
    commercial: 'Local commercial',
  };


  get coverPhotoUrl(): string {
    if (this.property?.cover_photo) return this.property.cover_photo;
    if (this.property?.photos?.length > 0) return this.property.photos[0].url;
    return 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800';
  }


  get photoCount(): number {
    return this.property?.photos?.length ?? 0;
  }


  get amenitiesPreview(): { id: number; name: string }[] {
    return this.property?.amenities?.slice(0, 3) ?? [];
  }

  get extraAmenitiesCount(): number {
    const total = this.property?.amenities?.length ?? 0;
    return total > 3 ? total - 3 : 0;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR').format(price);
  }

  onImageError(event: Event) {
    (event.target as HTMLImageElement).src =
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800';
  }
}

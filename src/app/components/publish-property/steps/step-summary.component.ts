import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PropertyType, PROPERTY_TYPE_LABELS, PhotoPreview } from '../../../models/property.model';

@Component({
  selector: 'app-step-summary',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './step-summary.component.html',
})
export class StepSummaryComponent {
  @Input({ required: true }) form!: {
    title: string; type: PropertyType | ''; city: string; district: string; address: string;
    surface: number; rooms: number; bedrooms: number; bathrooms: number; amenities: string[];
    price: number; chargesIncluded: boolean; available: boolean; availableFrom: string;
  };
  @Input({ required: true }) photos!: PhotoPreview[];
  @Input() propertyTypes: [PropertyType, string][] = [];
  @Input() errorMessage = '';

  @Output() editStep = new EventEmitter<number>();

  getTypeLabel(type: PropertyType | ''): string {
    if (!type) return '—';
    return PROPERTY_TYPE_LABELS[type] ?? type;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR').format(price);
  }
}

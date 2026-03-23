
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OwnerProperty } from '../../dashboard';

@Component({
  selector: 'app-properties-section',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './properties-section.html',
})
export class PropertiesSectionComponent {
  @Input() properties: OwnerProperty[] = [];

  formatPrice(n: number) { return n.toLocaleString('fr-FR'); }

  getStatusClass(status: string) {
    const map: Record<string, string> = {
      rented:    'bg-green-50 text-green-700 border-green-200',
      available: 'bg-blue-50 text-blue-700 border-blue-200',
      soon:      'bg-amber-50 text-amber-700 border-amber-200',
    };
    return map[status] ?? '';
  }

  getStatusLabel(status: string) {
    const map: Record<string, string> = {
      rented: 'Loué', available: 'Disponible', soon: 'Bientôt',
    };
    return map[status] ?? status;
  }
}

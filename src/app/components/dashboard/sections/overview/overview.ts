import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OwnerStats, OwnerProperty, Payment } from '../../dashboard';
import { DashboardSection } from '../../dashboard-sidebar/dashboard-sidebar';

@Component({
  selector: 'app-overview-section',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './overview.html',
})
export class OverviewSectionComponent {
  @Input() stats!: OwnerStats;
  @Input() properties: OwnerProperty[] = [];
  @Input() payments: Payment[] = [];
  @Input() unreadCount = 0;
  @Input() pendingCount = 0;
  @Output() sectionChange = new EventEmitter<DashboardSection>();

  setSection(s: DashboardSection) { this.sectionChange.emit(s); }

  formatPrice(n: number) { return n.toLocaleString('fr-FR'); }

  getStatusClass(status: string) {
    const map: Record<string, string> = {
      rented:  'bg-green-50 text-green-700 border-green-200',
      available: 'bg-blue-50 text-blue-700 border-blue-200',
      soon:    'bg-amber-50 text-amber-700 border-amber-200',
      paid:    'bg-green-50 text-green-700 border-green-200',
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
      late:    'bg-red-50 text-red-700 border-red-200',
      active:  'bg-green-50 text-green-700 border-green-200',
      leaving: 'bg-stone-50 text-stone-600 border-stone-200',
    };
    return map[status] ?? '';
  }

  getStatusLabel(status: string) {
    const map: Record<string, string> = {
      rented: 'Loué', available: 'Disponible', soon: 'Bientôt',
      paid: 'Payé', pending: 'En attente', late: 'En retard',
      active: 'Actif', leaving: 'Partant',
    };
    return map[status] ?? status;
  }
}


import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Tenant } from '../../dashboard';
import { DashboardSection } from '../../dashboard-sidebar/dashboard-sidebar';

@Component({
  selector: 'app-tenants-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tenants-section.html',
})
export class TenantsSectionComponent {
  @Input() tenants: Tenant[] = [];
  @Output() sectionChange = new EventEmitter<DashboardSection>();

  setSection(s: DashboardSection) { this.sectionChange.emit(s); }
  formatPrice(n: number) { return n.toLocaleString('fr-FR'); }

  getStatusClass(status: string) {
    const map: Record<string, string> = {
      active:  'bg-green-50 text-green-700 border-green-200',
      late:    'bg-red-50 text-red-700 border-red-200',
      leaving: 'bg-stone-50 text-stone-600 border-stone-200',
    };
    return map[status] ?? '';
  }

  getStatusLabel(status: string) {
    const map: Record<string, string> = {
      active: 'Actif', late: 'En retard', leaving: 'Partant',
    };
    return map[status] ?? status;
  }
}

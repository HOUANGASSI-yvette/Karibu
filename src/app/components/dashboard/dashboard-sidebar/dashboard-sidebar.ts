import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export type DashboardSection = 'overview' | 'properties' | 'tenants' | 'payments' | 'messages' | 'requests';

@Component({
  selector: 'app-dashboard-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard-sidebar.html',
})
export class DashboardSidebarComponent {
  @Input() activeSection: DashboardSection = 'overview';
  @Input() propertiesCount = 0;
  @Input() tenantsCount = 0;
  @Input() unreadCount = 0;
  @Input() pendingCount = 0;
  @Output() sectionChange = new EventEmitter<DashboardSection>();

  setSection(s: DashboardSection) { this.sectionChange.emit(s); }
}

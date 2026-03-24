import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export type DashboardSection =
  | 'overview' | 'properties' | 'tenants' | 'payments' | 'messages' | 'requests'
  | 'admin-users' | 'admin-documents' | 'admin-proprietaires';


@Component({
  selector: 'app-dashboard-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard-sidebar.html',

  styles: [`
    :host ::ng-deep .sidebar::-webkit-scrollbar {
      width: 6px;
    }

    :host ::ng-deep .sidebar::-webkit-scrollbar-track {
      background: transparent;
    }

    :host ::ng-deep .sidebar::-webkit-scrollbar-thumb {
      background-color: rgba(120, 113, 108, 0.4);
      border-radius: 9999px;
    }

    :host ::ng-deep .sidebar::-webkit-scrollbar-thumb:hover {
      background-color: rgba(120, 113, 108, 0.7);
    }

    /* Firefox */
    :host ::ng-deep .sidebar {
      scrollbar-width: thin;
      scrollbar-color: rgba(120,113,108,0.5) transparent;
    }
  `]
})
export class DashboardSidebarComponent {
  @Input() activeSection: DashboardSection = 'overview';
  @Input() propertiesCount = 0;
  @Input() tenantsCount = 0;
  @Input() unreadCount = 0;
  @Input() pendingCount = 0;
  @Input() isAdmin = false;
  @Output() sectionChange = new EventEmitter<DashboardSection>();

  setSection(s: DashboardSection) { this.sectionChange.emit(s); }
}

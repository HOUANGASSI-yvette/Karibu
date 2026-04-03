import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type TenantSection = 'overview' | 'rental' | 'applications' | 'payments' | 'maintenance' | 'messages';

@Component({
  selector: 'app-tenant-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tenant-sidebar.html',
})
export class TenantSidebarComponent {
  @Input() activeSection: TenantSection = 'overview';
  @Output() sectionChange = new EventEmitter<TenantSection>();

  setSection(section: TenantSection) {
    this.sectionChange.emit(section);
  }
}
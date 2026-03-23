import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-navbar',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './dashboard-navbar.html',
})
export class DashboardNavbarComponent {
  @Input() activeSection = '';
  @Input() userInitials  = '';
  @Input() userName      = '';
  @Input() userRole      = '';
  @Input() unreadCount   = 0;
  @Output() logoutClick  = new EventEmitter<void>();
}

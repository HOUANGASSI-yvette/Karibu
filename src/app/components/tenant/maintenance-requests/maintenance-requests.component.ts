import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { TenantService, MaintenanceRequest } from '../../../services/tenant.service';

@Component({
  selector: 'app-maintenance-requests',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './maintenance-requests.component.html',
})
export class MaintenanceRequestsComponent implements OnInit {
  private tenantService = inject(TenantService);

  requests = this.tenantService.maintenanceRequests;
  isLoading = this.tenantService.isLoadingMaintenance;

  ngOnInit() {
    this.tenantService.loadMaintenanceRequests().subscribe();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'submitted':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'in_progress':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'completed':
        return 'bg-green-50 text-green-700 border border-green-200';
      default:
        return 'bg-stone-50 text-stone-700 border border-stone-200';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'submitted':
        return 'Envoyée';
      case 'in_progress':
        return 'En cours';
      case 'completed':
        return 'Terminée';
      default:
        return status;
    }
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'high':
        return 'bg-red-50 text-red-700 border border-red-200';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'low':
        return 'bg-green-50 text-green-700 border border-green-200';
      default:
        return 'bg-stone-50 text-stone-700 border border-stone-200';
    }
  }

  getPriorityText(priority: string): string {
    switch (priority) {
      case 'high':
        return 'Urgent';
      case 'medium':
        return 'Normal';
      case 'low':
        return 'Faible';
      default:
        return priority;
    }
  }
}

import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { TenantService, TenantApplication } from '../../../services/tenant.service';

@Component({
  selector: 'app-my-applications',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './my-applications.component.html',
})
export class MyApplicationsComponent implements OnInit {
  private tenantService = inject(TenantService);

  applications = this.tenantService.applications;
  isLoading = this.tenantService.isLoadingApplications;

  ngOnInit() {
    this.tenantService.loadApplications().subscribe();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'accepted':
        return 'bg-green-50 text-green-700 border border-green-200';
      case 'rejected':
        return 'bg-red-50 text-red-700 border border-red-200';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      default:
        return 'bg-stone-50 text-stone-700 border border-stone-200';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'accepted':
        return 'Acceptée';
      case 'rejected':
        return 'Rejetée';
      case 'pending':
        return 'En attente';
      default:
        return status;
    }
  }
}

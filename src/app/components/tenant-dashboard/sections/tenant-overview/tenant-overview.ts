import { Component, Output, EventEmitter, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TenantSection } from '../../tenant-sidebar/tenant-sidebar';
import { TenantService, TenantOverview } from '../../../../services/tenant.service';

@Component({
  selector: 'app-tenant-overview',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './tenant-overview.html',
})
export class TenantOverviewComponent implements OnInit {
  @Output() sectionChange = new EventEmitter<TenantSection>();

  private tenantService = inject(TenantService);
  
  overview = signal<TenantOverview | null>(null);
  isLoading = signal(false);

  Math = Math; // Pour utiliser Math dans le template

  ngOnInit() {
    this.loadOverview();
  }

  loadOverview() {
    this.tenantService.loadOverview().subscribe((data: TenantOverview) => {
      this.overview.set(data);
    });
  }

  setSection(section: TenantSection) {
    this.sectionChange.emit(section);
  }

  nextPaymentDays(): number | null {
    const overview = this.overview();
    if (!overview?.next_payment?.due_date) return null;
    
    const dueDate = new Date(overview.next_payment.due_date);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }
}
import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TenantService, TenantPayment } from '../../../services/tenant.service';

@Component({
  selector: 'app-my-payments',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule],
  templateUrl: './my-payments.component.html',
})
export class MyPaymentsComponent implements OnInit {
  private tenantService = inject(TenantService);

  payments = this.tenantService.payments;
  isLoading = this.tenantService.isLoadingPayments;

  yearFilter = '2024';
  statusFilter = 'all';

  Math = Math;

  ngOnInit() {
    this.tenantService.loadPayments().subscribe();
  }

  getDaysUntilDue(payment: TenantPayment): number {
    const dueDate = new Date(payment.due_date);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getStatusClass(payment: TenantPayment): string {
    switch (payment.status) {
      case 'paid':
        return 'bg-green-50 text-green-700 border border-green-200';
      case 'overdue':
        return 'bg-red-50 text-red-700 border border-red-200';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      default:
        return 'bg-stone-50 text-stone-700 border border-stone-200';
    }
  }

  getStatusText(payment: TenantPayment): string {
    switch (payment.status) {
      case 'paid':
        return 'Payé';
      case 'overdue':
        return 'En retard';
      case 'pending':
        return 'En attente';
      default:
        return payment.status;
    }
  }
}

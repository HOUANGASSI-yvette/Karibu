import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Payment } from '../../dashboard';

@Component({
  selector: 'app-payments-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payments-section.html',
})
export class PaymentsSectionComponent {
  @Input() payments: Payment[] = [];
  @Output() quittanceDownload = new EventEmitter<string>();

  showQuittanceModal = false;
  selectedPaymentId: string | null = null;

  formatPrice(n: number) { return n.toLocaleString('fr-FR'); }

  countPayments(status: string) {
    return this.payments.filter(p => p.status === status).length;
  }

  getStatusClass(status: string) {
    const map: Record<string, string> = {
      paid:    'bg-green-50 text-green-700 border-green-200',
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
      late:    'bg-red-50 text-red-700 border-red-200',
    };
    return map[status] ?? '';
  }

  getStatusLabel(status: string) {
    const map: Record<string, string> = {
      paid: 'Payé', pending: 'En attente', late: 'En retard',
    };
    return map[status] ?? status;
  }

  openQuittance(id: string) {
    this.selectedPaymentId = id;
    this.showQuittanceModal = true;
  }

  getPaymentForModal() {
    return this.payments.find(p => p.id === this.selectedPaymentId) ?? null;
  }

  downloadQuittance() {
    if (this.selectedPaymentId) {
      this.quittanceDownload.emit(this.selectedPaymentId);
    }
    this.showQuittanceModal = false;
  }
}

import { Component, OnInit, inject, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../services/auth.service';
import { EscrowPaymentService, Paiement, ArbitrerPayload } from '../../../../services/escrow-payment.service';
import { ToastService } from '../../../../shared/toast.service';
import {AdminArbitrageModalComponent} from './admin-arbitrage-modal.component';

@Component({
  selector: 'app-admin-disputes-section',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminArbitrageModalComponent], // <-- DatePipe removed
  templateUrl: './admin-disputes-section.html',
})
export class AdminDisputesSectionComponent implements OnInit {
  private auth   = inject(AuthService);
  private escrow = inject(EscrowPaymentService);
  private toast  = inject(ToastService);

  constructor(private cdr: ChangeDetectorRef) {}

  litiges     = signal<Paiement[]>([]);
  loading     = signal(true);
  error       = signal<string | null>(null);
  submitting  = signal(false);
  selected    = signal<Paiement | null>(null);
  commentaire = '';

  isAdmin = computed(() =>
    this.auth.currentUser()?.role === 'admin' || this.auth.currentUser()?.is_staff
  );

  ngOnInit() {
    if (!this.isAdmin()) return;
    this.charger();
  }

  // manuel (bouton Rafraîchir)
  charger() {
    this.loading.set(true);
    this.error.set(null);

    this.escrow.listerLitigesAdmin().subscribe({
      next: r => {
        this.litiges.set(r?.results || []);
        this.loading.set(false);
        // IMPORTANT : force update vue après mutation asynchrone
        this.cdr.detectChanges();
      },
      error: e => {
        this.error.set(e?.error?.detail ?? 'Erreur de chargement.');
        this.loading.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  selectionner(p: Paiement) {
    this.selected.set(p);
    this.commentaire = '';
    this.submitting.set(false);

    this.cdr.detectChanges();
  }

  fermer() {
    this.selected.set(null);
    this.commentaire = '';
    this.submitting.set(false);
    this.cdr.detectChanges();
  }

  handleArbitrage(event: { enFaveurProprietaire: boolean; commentaire?: string }) {
    // applique le commentaire envoyé par le modal, puis délègue à ta méthode existante
    this.commentaire = event.commentaire || '';
    this.arbitrer(event.enFaveurProprietaire);
  }


  arbitrer(enFaveurProprietaire: boolean) {
    const pay = this.selected();
    if (!pay) return;
    this.submitting.set(true);
    this.cdr.detectChanges();

    const payload: ArbitrerPayload = {
      en_faveur_proprietaire: enFaveurProprietaire,
      commentaire: this.commentaire || undefined,
    };

    this.escrow.arbitrerPaiement(pay.bail, pay.id, payload).subscribe({
      next: () => {
        this.fermer();
        this.charger();
        // utilise le ToastService existant
        this.toast.success(
          enFaveurProprietaire
            ? 'Arbitrage : paiement confirmé au propriétaire.'
            : 'Arbitrage : remboursement au locataire.'
        );
      },
      error: e => {
        this.submitting.set(false);
        this.cdr.detectChanges();
        this.toast.error(e?.error?.detail ?? 'Erreur arbitrage.');
      }
    });
  }

  fmt(n: number) {
    return new Intl.NumberFormat('fr-FR').format(n) + '\u202fFCFA';
  }

  trackById(_i: number, item: Paiement) {
    return item.id;
  }
}

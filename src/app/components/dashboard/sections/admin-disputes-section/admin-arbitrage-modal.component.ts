import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { Paiement } from '../../../../services/escrow-payment.service';

@Component({
  selector: 'app-admin-arbitrage-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4" (click)="close()">
      <div class="bg-white border border-stone-200 w-full max-w-sm shadow-xl" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <h3 class="text-sm font-medium text-stone-900">Arbitrage du litige</h3>
          <button (click)="close()" class="text-stone-400 hover:text-stone-700">✕</button>
        </div>

        <div class="p-6 space-y-4" *ngIf="pay">
          <div class="bg-stone-50 border border-stone-100 divide-y divide-stone-100 text-sm">
            <div class="flex justify-between px-4 py-2.5">
              <span class="text-stone-400">Période</span>
              <span class="font-medium">{{ (pay.mois_concerne + '-01') | date:'MMMM yyyy':'':'fr' }}</span>
            </div>
            <div class="flex justify-between px-4 py-2.5">
              <span class="text-stone-400">Montant</span>
              <span class="font-semibold text-stone-900">{{ fmt(pay.montant) }}</span>
            </div>
            <div *ngIf="pay.commission" class="flex justify-between px-4 py-2.5">
              <span class="text-stone-400">Net proprio</span>
              <span class="text-stone-700">{{ pay.commission.montant_net | number:'1.0-0' }} FCFA</span>
            </div>
          </div>

          <div>
            <label class="block text-xs text-stone-500 mb-1">Commentaire (optionnel)</label>
            <textarea [(ngModel)]="commentaire" rows="3"
                      placeholder="Motif de la décision…"
                      class="w-full border border-stone-200 px-3 py-2 text-sm text-stone-900 focus:outline-none focus:border-stone-500 resize-none"></textarea>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <button (click)="decide(true)" [disabled]="localSubmitting"
                    class="py-2.5 bg-stone-900 text-white text-xs font-medium hover:bg-stone-700 transition-colors disabled:opacity-40">
              <span *ngIf="localSubmitting" class="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
              Valider (proprio)
            </button>
            <button (click)="decide(false)" [disabled]="localSubmitting"
                    class="py-2.5 border border-stone-300 text-stone-700 text-xs font-medium hover:bg-stone-50 transition-colors disabled:opacity-40">
              Rembourser (locataire)
            </button>
          </div>

          <p class="text-[11px] text-stone-400 leading-relaxed text-center">
            « Valider » confirme le paiement au propriétaire.<br>
            « Rembourser » crédite le locataire et passe en statut <em>rembourse</em>.
          </p>
        </div>
      </div>
    </div>
  `
})
export class AdminArbitrageModalComponent {
  @Input() pay: Paiement | null = null;
  @Output() closeModal = new EventEmitter<void>();
  @Output() decideEvent = new EventEmitter<{ enFaveurProprietaire: boolean; commentaire?: string }>();

  commentaire = '';
  localSubmitting = false;

  close() {
    this.commentaire = '';
    this.localSubmitting = false;
    this.closeModal.emit();
  }

  decide(enFaveurProprietaire: boolean) {
    this.localSubmitting = true;
    this.decideEvent.emit({ enFaveurProprietaire, commentaire: this.commentaire || undefined });
    // parent will close modal and clear localSubmitting by re-rendering (or you can listen parent confirm to explicitly clear)
  }

  fmt(n: number) {
    return new Intl.NumberFormat('fr-FR').format(n) + '\u202fFCFA';
  }
}

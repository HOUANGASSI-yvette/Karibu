// src/app/components/dashboard/sections/payments-section/payments-section.ts
import {
  Component, Input, OnChanges, OnInit, SimpleChanges,
  inject, signal, computed
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../services/auth.service';
import {
  EscrowPaymentService,
  Paiement,
  SimulerPaiementPayload,
} from '../../../../services/escrow-payment.service';
import { environment } from '../../../../../environments/environment';

type ModalType =
  | 'payer'
  | 'confirmer'
  | 'quittance'
  | 'quittance-email'
  | 'releve-email'
  | null;

@Component({
  selector: 'app-payments-section',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './payments-section.html',
})
export class PaymentsSectionComponent implements OnInit, OnChanges {

  @Input() bailId!: number;

  private auth   = inject(AuthService);
  public escrow = inject(EscrowPaymentService);

  readonly METHOD_OPTIONS = [
    ['flooz', 'Flooz'],
    ['tmoney', 'T-Money'],
    ['wave', 'Wave'],
    ['especes', 'Espèces'],
  ] as const;

  // ── Données ──────────────────────────────────────────────────────────────
  paiements  = signal<Paiement[]>([]);
  // start false to avoid spinner when bailId is not provided
  loading    = signal(false);
  error      = signal<string | null>(null);
  toastMsg   = signal<string | null>(null);
  toastType  = signal<'ok' | 'err'>('ok');

  // ── Modal ─────────────────────────────────────────────────────────────────
  modal       = signal<ModalType>(null);
  selectedPay = signal<Paiement | null>(null);
  submitting  = signal(false);

  // ── Filtres ───────────────────────────────────────────────────────────────
  filtreStatut = signal<string>('tous');
  filtreAnnee  = signal<number | null>(null);

  // ── Formulaires ───────────────────────────────────────────────────────────
  payForm = {
    montant:          0,
    mois_concerne:    this._moisCourant(),
    methode:          'flooz' as SimulerPaiementPayload['methode'],
    numero_telephone: '',
    note:             '',
  };
  emailForm = { email: '', annee: '' };

  // ── Rôle ──────────────────────────────────────────────────────────────────
  user            = this.auth.currentUser;
  isLocataire     = computed(() => this.user()?.role === 'locataire');
  isProprietaire  = computed(() => this.user()?.role === 'proprietaire');
  isAdmin         = computed(() => this.user()?.role === 'admin' || this.user()?.is_staff);

  // ── Computed ───────────────────────���──────────────────────────────────────
  anneesDispo = computed(() => {
    const s = new Set<number>();
    this.paiements().forEach(p => {
      if (p.mois_concerne) s.add(+p.mois_concerne.slice(0, 4));
    });
    return [...s].sort((a, b) => b - a);
  });

  paiementsFiltres = computed(() => {
    let list = this.paiements();
    const st = this.filtreStatut();
    const an = this.filtreAnnee();
    if (st !== 'tous') list = list.filter(p => p.statut === st);
    if (an)            list = list.filter(p => p.mois_concerne?.startsWith(String(an)));
    return list;
  });

  totaux = computed(() => {
    const l = this.paiements();
    const sum = (f: (p: Paiement) => boolean) =>
      l.filter(f).reduce((s, p) => s + (p.montant ?? 0), 0);
    return {
      confirme:   sum(p => p.statut === 'confirme'),
      en_escrow:  sum(p => p.statut === 'paye'),
      en_attente: l.filter(p => p.statut === 'en_attente').length,
      en_retard:  l.filter(p => p.statut === 'en_retard').length,
    };
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  constructor() {
    console.log('[PaymentsSection] constructor — component instancié');
  }

  ngOnInit(): void {
    console.log('[PaymentsSection] ngOnInit — bailId=', this.bailId);
    // si bailId fourni déjà, lancer le chargement
    if (this.bailId) {
      this.charger();
    } else {
      // pas de bail sélectionné : on ne laisse pas le loader actif
      this.loading.set(false);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('[PaymentsSection] ngOnChanges', { changes, bailId: this.bailId });
    if (changes['bailId']) {
      if (this.bailId) {
        this.charger();
      } else {
        this.paiements.set([]);
        this.loading.set(false);
        this.error.set(null);
      }
    }
  }

  charger() {
    console.log('[PaymentsSection] charger() — appel service pour bailId=', this.bailId);
    this.loading.set(true);
    this.error.set(null);
    this.escrow.listerPaiements(this.bailId).subscribe({
      next: r => {
        console.log('[PaymentsSection] listerPaiements success — paiements count=', r.paiements?.length ?? 0);
        this.paiements.set(r.paiements);
        this.loading.set(false);
      },
      error: e => {
        console.error('[PaymentsSection] listerPaiements error', e);
        this.error.set(e?.error?.detail ?? 'Impossible de charger les paiements.');
        this.loading.set(false);
      }
    });
  }

  // ── Modals / Actions (logs légers) ────────────────────────────────────────
  openModal(type: ModalType, pay: Paiement | null = null) {
    console.log('[PaymentsSection] openModal', type, pay?.id);
    this.selectedPay.set(pay);
    this.modal.set(type);
    this.submitting.set(false);
    this.emailForm = { email: '', annee: '' };
    if (type === 'payer') {
      this.payForm.montant = 0;
      this.payForm.mois_concerne = this._moisCourant();
      this.payForm.numero_telephone = '';
      this.payForm.note = '';
    }
  }

  closeModal() {
    console.log('[PaymentsSection] closeModal');
    this.modal.set(null);
    this.selectedPay.set(null);
    this.submitting.set(false);
  }

  soumettrePaiement() {
    console.log('[PaymentsSection] soumettrePaiement', { montant: this.payForm.montant, mois: this.payForm.mois_concerne });
    this.submitting.set(true);
    const payload: SimulerPaiementPayload = {
      montant: this.payForm.montant,
      mois_concerne: this.payForm.mois_concerne + '-01',
      methode: this.payForm.methode,
      numero_telephone: this.payForm.numero_telephone || undefined,
      note: this.payForm.note || undefined,
    };
    this.escrow.simulerPaiement(this.bailId, payload).subscribe({
      next: () => { console.log('[PaymentsSection] simulerPaiement success'); this.closeModal(); this.charger(); this.toast('Paiement effectué.', 'ok'); },
      error: e => { console.error('[PaymentsSection] simulerPaiement error', e); this.submitting.set(false); this.toast(e?.error?.detail ?? 'Erreur.', 'err'); },
    });
  }

  libererPaiement(pay: Paiement) {
    console.log('[PaymentsSection] libererPaiement', pay.id);
    this.submitting.set(true);
    this.escrow.libererPaiement(this.bailId, pay.id).subscribe({
      next: () => { console.log('[PaymentsSection] libererPaiement success'); this.closeModal(); this.charger(); this.toast('Paiement libéré.', 'ok'); },
      error: e => { console.error('[PaymentsSection] libererPaiement error', e); this.submitting.set(false); this.toast(e?.error?.detail ?? 'Erreur.', 'err'); },
    });
  }

  contesterPaiement(pay: Paiement) {
    console.log('[PaymentsSection] contesterPaiement', pay.id);
    this.submitting.set(true);
    this.escrow.contesterPaiement(this.bailId, pay.id, {}).subscribe({
      next: () => { console.log('[PaymentsSection] contesterPaiement success'); this.closeModal(); this.charger(); this.toast('Contestation enregistrée.', 'ok'); },
      error: e => { console.error('[PaymentsSection] contesterPaiement error', e); this.submitting.set(false); this.toast(e?.error?.detail ?? 'Erreur.', 'err'); },
    });
  }

  telechargerQuittance(pay: Paiement) {
    console.log('[PaymentsSection] telechargerQuittance', pay.id);
    this.escrow.downloadQuittance(this.bailId, pay.id).subscribe({
      next: blob => {
        console.log('[PaymentsSection] downloadQuittance blob reçu', blob);
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `quittance_${pay.mois_concerne?.slice(0, 7) ?? pay.id}.pdf`;
        a.click();
        URL.revokeObjectURL(a.href);
      },
      error: e => { console.error('[PaymentsSection] downloadQuittance error', e); this.toast(e?.error?.detail ?? 'Erreur téléchargement quittance', 'err'); }
    });
  }

  envoyerQuittanceEmail() {
    const pay = this.selectedPay();
    if (!pay) return;
    console.log('[PaymentsSection] envoyerQuittanceEmail', pay.id);
    this.submitting.set(true);
    this.escrow.envoyerQuittanceEmail(this.bailId, pay.id).subscribe({
      next: () => { console.log('[PaymentsSection] envoyerQuittanceEmail success'); this.closeModal(); this.toast('Quittance envoyée par email.', 'ok'); },
      error: e => { console.error('[PaymentsSection] envoyerQuittanceEmail error', e); this.submitting.set(false); this.toast(e?.error?.detail ?? 'Erreur.', 'err'); }
    });
  }

  telechargerReleve() {
    const an = this.filtreAnnee();
    console.log('[PaymentsSection] telechargerReleve', { bailId: this.bailId, annee: an });
    this.escrow.downloadReleve(this.bailId, an).subscribe({
      next: blob => {
        console.log('[PaymentsSection] downloadReleve blob reçu', blob);
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `releve_bail_${this.bailId}${an ? '_' + an : ''}.pdf`;
        a.click();
        URL.revokeObjectURL(a.href);
      },
      error: e => { console.error('[PaymentsSection] downloadReleve error', e); this.toast(e?.error?.detail ?? 'Erreur téléchargement relevé', 'err'); }
    });
  }

  envoyerReleveEmail() {
    console.log('[PaymentsSection] envoyerReleveEmail', { annee: this.emailForm.annee, email: this.emailForm.email });
    this.submitting.set(true);
    const payload = { annee: this.emailForm.annee ? +this.emailForm.annee : undefined, email: this.emailForm.email || undefined };
    this.escrow.envoyerReleveEmail(this.bailId, payload).subscribe({
      next: () => { console.log('[PaymentsSection] envoyerReleveEmail success'); this.closeModal(); this.toast('Relevé envoyé par email.', 'ok'); },
      error: e => { console.error('[PaymentsSection] envoyerReleveEmail error', e); this.submitting.set(false); this.toast(e?.error?.detail ?? 'Erreur.', 'err'); }
    });
  }

  // ── Helpers ─────────────────────────────────────��─────────────────────────
  fmt(n: number)  { return new Intl.NumberFormat('fr-FR').format(n) + '\u202fFCFA'; }
  slbl(s: string) { return this.escrow.statutLabel(s); }
  scls(s: string) { return this.escrow.statutClasses(s); }

  canDownloadQuittance(p: Paiement)  { return p.statut === 'confirme'; }
  canConfirmer(p: Paiement)          { return this.isProprietaire() && p.statut === 'paye' && p.escrow?.peut_liberer; }
  canContester(p: Paiement)          { return this.isProprietaire() && p.escrow?.peut_contester; }

  private _moisCourant(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  private toast(msg: string, type: 'ok' | 'err') {
    this.toastMsg.set(msg);
    this.toastType.set(type);
    setTimeout(() => this.toastMsg.set(null), 4000);
  }
}

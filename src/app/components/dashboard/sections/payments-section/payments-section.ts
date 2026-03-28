import {
  Component, OnInit, OnDestroy,
  inject, ChangeDetectorRef, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../../services/auth.service';
import {
  EscrowPaymentService,
  Paiement,
  SimulerPaiementPayload,
} from '../../../../services/escrow-payment.service';

type ModalType =
  | 'payer' | 'confirmer' | 'quittance'
  | 'quittance-email' | 'releve-email' | null;

@Component({
  selector: 'app-payments-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payments-section.html',
  changeDetection: ChangeDetectionStrategy.Default,
})
export class PaymentsSectionComponent implements OnInit, OnDestroy {

  private auth  = inject(AuthService);
  public  escrow = inject(EscrowPaymentService);
  private cdr   = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  readonly METHOD_OPTIONS = [
    ['flooz',   'Flooz'],
    ['tmoney',  'T-Money'],
    ['wave',    'Wave'],
    ['especes', 'Espèces'],
  ] as const;

  // ── State classique (pas de signals) ─────────────────────────────────────
  paiements:  Paiement[]     = [];
  loading     = true;
  error:      string | null  = null;
  toastMsg:   string | null  = null;
  toastType:  'ok' | 'err'   = 'ok';
  modal:      ModalType      = null;
  selectedPay: Paiement | null = null;
  submitting  = false;
  filtreStatut = 'tous';
  filtreAnnee: number | null  = null;

  // per-button loading actions
  private loadingActions = new Set<string>();

  payForm = {
    montant:          0,
    mois_concerne:    this._moisCourant(),
    methode:          'flooz' as SimulerPaiementPayload['methode'],
    numero_telephone: '',
    note:             '',
  };
  emailForm = { email: '', annee: '' };

  // ── Rôle ─────────────────────────────────────────────────────────────────
  get user()           { return this.auth.currentUser(); }
  get isLocataire()    { return this.user?.role === 'locataire'; }
  get isProprietaire() { return this.user?.role === 'proprietaire'; }
  get isAdmin()        { return this.user?.role === 'admin' || this.user?.is_staff; }

  // ── Computed classiques (getters) ─────────────────────────────────────────
  get anneesDispo(): number[] {
    const s = new Set<number>();
    this.paiements.forEach(p => {
      if (p.mois_concerne) s.add(+p.mois_concerne.slice(0, 4));
    });
    return [...s].sort((a, b) => b - a);
  }

  get paiementsFiltres(): Paiement[] {
    let list = [...this.paiements];
    if (this.filtreStatut !== 'tous') list = list.filter(p => p.statut === this.filtreStatut);
    if (this.filtreAnnee)             list = list.filter(p => p.mois_concerne?.startsWith(String(this.filtreAnnee)));
    return list;
  }

  get totaux() {
    const sum = (f: (p: Paiement) => boolean) =>
      this.paiements.filter(f).reduce((s, p) => s + (p.montant ?? 0), 0);
    return {
      confirme:   sum(p => p.statut === 'confirme'),
      en_escrow:  sum(p => p.statut === 'paye'),
      en_attente: this.paiements.filter(p => p.statut === 'en_attente').length,
      en_retard:  this.paiements.filter(p => p.statut === 'en_retard').length,
    };
  }

  private get bailActifId(): number | null {
    return this.paiements[0]?.bail ?? null;
  }

  // ── helpers pour gestion per-button loading ───────────────────────────────
  private setLoading(key: string) {
    this.loadingActions.add(key);
    this.cdr.detectChanges();
  }
  private clearLoading(key: string) {
    this.loadingActions.delete(key);
    this.cdr.detectChanges();
  }
  isLoading(key: string): boolean {
    return this.loadingActions.has(key);
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.charger();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  charger() {
    this.loading = true;
    this.error   = null;
    this.cdr.markForCheck();

    this.escrow.mesPaiements()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: r => {
          this.paiements = r.paiements ?? [];
          this.loading   = false;
          this.cdr.detectChanges();
        },
        error: e => {
          this.error   = e?.error?.detail ?? 'Impossible de charger les paiements.';
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  // ── Modals ────────────────────────────────────────────────────────────────
  openModal(type: ModalType, pay: Paiement | null = null) {
    this.selectedPay = pay;
    this.modal       = type;
    this.submitting  = false;
    this.emailForm   = { email: '', annee: '' };
    if (type === 'payer') {
      this.payForm.montant          = 0;
      this.payForm.mois_concerne    = this._moisCourant();
      this.payForm.numero_telephone = '';
      this.payForm.note             = '';
    }
    this.cdr.detectChanges();
  }

  closeModal() {
    this.modal       = null;
    this.selectedPay = null;
    this.submitting  = false;
    this.cdr.detectChanges();
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  soumettrePaiement() {
    const bailId = this.bailActifId;
    if (!bailId) { this.toast('Aucun bail actif trouvé.', 'err'); return; }

    this.submitting = true;
    this.setLoading('soumettre');

    const payload: SimulerPaiementPayload = {
      montant:          this.payForm.montant,
      mois_concerne:    this.payForm.mois_concerne + '-01',
      methode:          this.payForm.methode,
      numero_telephone: this.payForm.numero_telephone || undefined,
      note:             this.payForm.note || undefined,
    };
    this.escrow.simulerPaiement(bailId, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  () => { this.clearLoading('soumettre'); this.closeModal(); this.charger(); this.toast('Paiement effectué.', 'ok'); },
        error: e  => { this.clearLoading('soumettre'); this.submitting = false; this.cdr.detectChanges(); this.toast(e?.error?.detail ?? 'Erreur.', 'err'); },
      });
  }

  libererPaiement(pay: Paiement) {
    const key = `liber-${pay.id}`;
    this.setLoading(key);
    this.escrow.libererPaiement(pay.bail, pay.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  () => { this.clearLoading(key); this.closeModal(); this.charger(); this.toast('Paiement libéré.', 'ok'); },
        error: e  => { this.clearLoading(key); this.submitting = false; this.cdr.detectChanges(); this.toast(e?.error?.detail ?? 'Erreur.', 'err'); },
      });
  }

  contesterPaiement(pay: Paiement) {
    const key = `contest-${pay.id}`;
    this.setLoading(key);
    this.escrow.contesterPaiement(pay.bail, pay.id, {})
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  () => { this.clearLoading(key); this.closeModal(); this.charger(); this.toast('Contestation enregistrée.', 'ok'); },
        error: e  => { this.clearLoading(key); this.submitting = false; this.cdr.detectChanges(); this.toast(e?.error?.detail ?? 'Erreur.', 'err'); },
      });
  }

  telechargerQuittance(pay: Paiement) {
    const key = `download-quittance-${pay.id}`;
    this.setLoading(key);
    this.escrow.downloadQuittance(pay.bail, pay.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: blob => {
          this.clearLoading(key);
          const a    = document.createElement('a');
          a.href     = URL.createObjectURL(blob);
          a.download = `quittance_${pay.mois_concerne?.slice(0, 7) ?? pay.id}.pdf`;
          a.click();
          URL.revokeObjectURL(a.href);
        },
        error: e => { this.clearLoading(key); this.toast(e?.error?.detail ?? 'Erreur téléchargement quittance.', 'err'); },
      });
  }

  envoyerQuittanceEmail() {
    const pay = this.selectedPay;
    if (!pay) return;
    const key = `email-quittance-${pay.id}`;
    this.setLoading(key);
    this.escrow.envoyerQuittanceEmail(pay.bail, pay.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  () => { this.clearLoading(key); this.closeModal(); this.toast('Quittance envoyée par email.', 'ok'); },
        error: e  => { this.clearLoading(key); this.submitting = false; this.cdr.detectChanges(); this.toast(e?.error?.detail ?? 'Erreur.', 'err'); },
      });
  }

  telechargerReleve() {
    const key = `download-releve-${this.filtreAnnee ?? 'all'}`;
    this.setLoading(key);
    this.escrow.downloadReleveGlobal(this.filtreAnnee)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: blob => {
          this.clearLoading(key);
          const a    = document.createElement('a');
          a.href     = URL.createObjectURL(blob);
          a.download = `releve${this.filtreAnnee ? '_' + this.filtreAnnee : ''}.pdf`;
          a.click();
          URL.revokeObjectURL(a.href);
        },
        error: e => { this.clearLoading(key); this.toast(e?.error?.detail ?? 'Erreur téléchargement relevé.', 'err'); },
      });
  }

  envoyerReleveEmail() {
    const key = `email-releve-${this.emailForm.annee || 'all'}`;
    this.setLoading(key);
    const payload = {
      annee: this.emailForm.annee ? +this.emailForm.annee : undefined,
      email: this.emailForm.email || undefined,
    };
    this.escrow.envoyerReleveEmailGlobal(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  () => { this.clearLoading(key); this.closeModal(); this.toast('Relevé envoyé par email.', 'ok'); },
        error: e  => { this.clearLoading(key); this.submitting = false; this.cdr.detectChanges(); this.toast(e?.error?.detail ?? 'Erreur.', 'err'); },
      });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  fmt(n: number): string {
    if (n == null) return '—';
    return new Intl.NumberFormat('fr-FR').format(n) + '\u202fFCFA';
  }

  fmtDate(dateStr?: string | null): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr.slice(0, 10));
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }

  moisLabel(moisConcerne?: string): string {
    if (!moisConcerne) return '—';
    const str = moisConcerne.length >= 7 ? moisConcerne.slice(0, 7) + '-01' : moisConcerne;
    const d   = new Date(str);
    if (isNaN(d.getTime())) return moisConcerne;
    return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }

  moisCourt(moisConcerne?: string): string {
    if (!moisConcerne) return '—';
    const str = moisConcerne.length >= 7 ? moisConcerne.slice(0, 7) + '-01' : moisConcerne;
    const d   = new Date(str);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('fr-FR', { month: 'short' });
  }

  moisAnnee(moisConcerne?: string): string {
    return moisConcerne?.slice(0, 4) ?? '';
  }

  slbl(s: string) { return this.escrow.statutLabel(s); }
  scls(s: string) { return this.escrow.statutClasses(s); }

  canDownloadQuittance(p: Paiement) { return p.statut === 'confirme'; }

  canConfirmer(p: Paiement)  { return this.isAdmin && p.statut === 'paye' && p.escrow?.peut_liberer; }
  canContester(p: Paiement)  { return (this.isProprietaire || this.isLocataire) && p.escrow?.peut_contester; }

  private _moisCourant(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  private toast(msg: string, type: 'ok' | 'err') {
    this.toastMsg  = msg;
    this.toastType = type;
    this.cdr.detectChanges();
    setTimeout(() => { this.toastMsg = null; this.cdr.detectChanges(); }, 4000);
  }

  // trackBy pour la liste
  trackById(_i: number, item: Paiement) {
    return item.id;
  }
}

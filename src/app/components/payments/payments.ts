import {
  Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../shared/toast.service';
import {
  EscrowPaymentService,
  Paiement,
} from '../../services/escrow-payment.service';
import {
  LucideAngularModule,
  X, CreditCard, CheckCircle, Clock, AlertTriangle,
  ChevronDown, Smartphone, Wallet, RefreshCw, FileText, Shield
} from 'lucide-angular';

@Component({
  selector: 'app-payment-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './payments.html',
})
export class PaymentDrawerComponent implements OnInit {
  @Input() bailId!: number;
  @Input() prixLoyer!: number;
  @Input() isProprietaire = false;
  @Output() close = new EventEmitter<void>();

  readonly XIcon        = X;
  readonly CardIcon     = CreditCard;
  readonly CheckIcon    = CheckCircle;
  readonly ClockIcon    = Clock;
  readonly WarnIcon     = AlertTriangle;
  readonly ChevronIcon  = ChevronDown;
  readonly PhoneIcon    = Smartphone;
  readonly WalletIcon   = Wallet;
  readonly RefreshIcon  = RefreshCw;
  readonly FileIcon     = FileText;
  readonly ShieldIcon   = Shield;

  // State
  paiements: Paiement[] = [];
  totaux: {
    total_paye_cfa: number; total_confirme_cfa: number;
    commission_karibu_cfa: number; nb_en_retard: number; nb_paiements: number;
  } | null = null;

  isLoading     = true;
  isSubmitting  = false;
  view: 'list' | 'pay' | 'contest' = 'list';
  selectedPaiementId: number | null = null;
  contestMotif  = '';

  // Formulaire paiement
  form = {
    montant:          0,
    mois_concerne:    '',
    methode:          'flooz' as 'flooz' | 'tmoney' | 'wave' | 'especes',
    numero_telephone: '',
    note:             '',
  };

  methodes = [
    { value: 'flooz',   label: 'Flooz (Moov)',     icon: '📱' },
    { value: 'tmoney',  label: 'T-Money (Togocel)', icon: '📱' },
    { value: 'wave',    label: 'Wave',              icon: '💙' },
    { value: 'especes', label: 'Espèces',           icon: '💵' },
  ];

  constructor(
    private escrowService: EscrowPaymentService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.form.montant = this.prixLoyer || 0;
    const now = new Date();
    this.form.mois_concerne = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    this.loadPaiements();
  }

  loadPaiements() {
    this.isLoading = true;
    this.escrowService.listerPaiements(this.bailId).subscribe({
      next: (res) => {
        this.paiements = res.paiements;
        this.totaux    = res.totaux;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.toast.error('Impossible de charger les paiements.');
        this.cdr.detectChanges();
      },
    });
  }

  simuler() {
    if (!this.form.montant || !this.form.mois_concerne) {
      this.toast.warning('Veuillez remplir le montant et le mois.');
      return;
    }
    this.isSubmitting = true;
    this.escrowService.simulerPaiement(this.bailId, {
      montant:          this.form.montant,
      mois_concerne:    this.form.mois_concerne,
      methode:          this.form.methode,
      numero_telephone: this.form.numero_telephone || undefined,
      note:             this.form.note || undefined,
    }).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.toast.success(`Paiement ${this.form.methode.toUpperCase()} simulé — Réf: ${res.reference_paiement}`);
        this.view = 'list';
        this.loadPaiements();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.toast.error(err?.error?.detail || 'Erreur lors du paiement.');
        this.cdr.detectChanges();
      },
    });
  }

  liberer(paiementId: number) {
    this.isSubmitting = true;
    this.escrowService.libererPaiement(this.bailId, paiementId).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.toast.success('Paiement libéré au propriétaire.');
        this.loadPaiements();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.toast.error(err?.error?.detail || 'Erreur lors de la libération.');
        this.cdr.detectChanges();
      },
    });
  }

  ouvrirContestation(paiementId: number) {
    this.selectedPaiementId = paiementId;
    this.contestMotif = '';
    this.view = 'contest';
  }

  contester() {
    if (!this.selectedPaiementId || !this.contestMotif.trim()) return;
    this.isSubmitting = true;
    this.escrowService.contesterPaiement(this.bailId, this.selectedPaiementId, {
      motif: this.contestMotif,
    }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.toast.success('Litige ouvert. Un admin va examiner votre contestation sous 48h.');
        this.view = 'list';
        this.loadPaiements();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.toast.error(err?.error?.detail || 'Erreur lors de la contestation.');
        this.cdr.detectChanges();
      },
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  statutLabel(statut: string): string {
    return ({
      en_attente: 'En attente',
      paye:       'En escrow',
      confirme:   'Confirmé',
      en_retard:  'Litige ouvert',
      rembourse:  'Remboursé',
    } as any)[statut] ?? statut;
  }

  statutClasses(statut: string): string {
    return ({
      en_attente: 'bg-amber-100 text-amber-800 border-amber-200',
      paye:       'bg-blue-100 text-blue-800 border-blue-200',
      confirme:   'bg-green-100 text-green-800 border-green-200',
      en_retard:  'bg-red-100 text-red-800 border-red-200',
      rembourse:  'bg-stone-100 text-stone-600 border-stone-200',
    } as any)[statut] ?? 'bg-stone-100 text-stone-600 border-stone-200';
  }

  formatMois(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  polygonscanUrl(txHash?: string): string | null {
    if (!txHash || txHash.startsWith('KARIBU-SIM')) return null;
    return `https://amoy.polygonscan.com/tx/${txHash}`;
  }

  get totalPaye(): number {
    return this.totaux?.total_paye_cfa
      ?? this.paiements.filter(p => ['confirme','paye'].includes(p.statut)).reduce((s, p) => s + p.montant, 0);
  }

  get moisEnRetard(): number {
    return this.totaux?.nb_en_retard ?? this.paiements.filter(p => p.statut === 'en_retard').length;
  }

  setMethode(val: string) {
    this.form.methode = val as 'flooz' | 'tmoney' | 'wave' | 'especes';
  }

  onOverlayClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('overlay-bg')) this.close.emit();
  }
}

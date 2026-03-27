import {
  Component, Input, Output, EventEmitter, OnInit,
  ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  X, FileText, CheckCircle, Download, ExternalLink,
  Shield, Calendar, User, Home, AlertCircle, AlertTriangle, Loader, CreditCard
} from 'lucide-angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BailService, BailDetail } from '../../services/bail.service';
import { ToastService } from '../toast.service';
import { AuthService } from '../../services/auth.service';
import { PaymentDrawerComponent } from '../../components/payments/payments';

type ModalView = 'detail' | 'confirm_resilier';

@Component({
  selector: 'app-bail-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, PaymentDrawerComponent],
  templateUrl: './bail-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BailModalComponent implements OnInit {
  @Input() bailId!: number;
  @Output() close    = new EventEmitter<void>();
  @Output() signed   = new EventEmitter<BailDetail>();
  @Output() resilied = new EventEmitter<BailDetail>();

  readonly XIcon        = X;
  readonly FileTextIcon = FileText;
  readonly CheckIcon    = CheckCircle;
  readonly DownloadIcon = Download;
  readonly ExternalIcon = ExternalLink;
  readonly ShieldIcon   = Shield;
  readonly CalendarIcon = Calendar;
  readonly UserIcon     = User;
  readonly HomeIcon     = Home;
  readonly AlertIcon    = AlertCircle;
  readonly WarnIcon     = AlertTriangle;
  readonly LoaderIcon   = Loader;
  readonly PayIcon      = CreditCard;   // ✅ icône paiement

  bail:         BailDetail | null = null;
  isLoading     = true;
  isSigning     = false;
  isDownloading = false;
  isResiliant   = false;

  view: ModalView = 'detail';
  motifResiliation = '';

  // ✅ Contrôle l'affichage du drawer de paiement
  showPaymentDrawer = false;

  private destroyRef = inject(DestroyRef);

  constructor(
    private bailService: BailService,
    private toast: ToastService,
    public  authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    if (!this.bailId) return;
    this.reload();
  }

  reload() {
    this.isLoading = true;
    this.bail = null;
    this.view = 'detail';
    this.cdr.markForCheck();

    this.bailService.getBail(this.bailId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (b) => {
          this.bail      = b;
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.isLoading = false;
          this.cdr.markForCheck();
          this.toast.error('Impossible de charger le contrat.');
        }
      });
  }

  // ── Getters ──────────────────────────────────────────────────────────────

  get currentUserId(): number | undefined {
    return this.authService.getCurrentUser()?.id;
  }

  get isLocataire(): boolean {
    return this.currentUserId === this.bail?.locataire;
  }

  get isProprietaireOwner(): boolean {
    return this.currentUserId === this.bail?.proprietaire;
  }

  get canSign(): boolean {
    if (!this.bail || this.bail.statut !== 'en_attente') return false;
    const uid = this.currentUserId;
    if (uid === this.bail.proprietaire && !this.bail.signe_proprietaire) return true;
    if (uid === this.bail.locataire    && !this.bail.signe_locataire)    return true;
    return false;
  }

  get canResilier(): boolean {
    if (!this.bail) return false;
    if (this.bail.statut !== 'actif') return false;
    const uid = this.currentUserId;
    return uid === this.bail.proprietaire || uid === this.bail.locataire;
  }

  // ✅ Le paiement est possible si :
  // - le bail est actif ou signé
  // - l'utilisateur est le locataire (c'est lui qui paie)
  get canPay(): boolean {
    if (!this.bail) return false;
    return (
      (this.bail.statut === 'actif' || this.bail.statut === 'signe') &&
      this.isLocataire
    );
  }

  // ✅ Label du bouton selon le type de bail
  get paymentLabel(): string {
    if (!this.bail) return 'Payer';
    const map: Record<string, string> = {
      longue_duree: 'Payer le loyer',
      courte_duree: 'Régler la location',
      achat:        'Effectuer un versement',
    };
    return map[this.bail.type_bail] ?? 'Payer';
  }

  get blockchainBadge(): { label: string; sub: string; color: 'green' | 'red' | 'amber' } {
    if (!this.bail) return { label: '', sub: '', color: 'amber' };
    if (this.bail.tx_hash && this.bail.blockchain_status === 'confirmed') {
      return { label: 'Enregistré sur la blockchain', sub: this.bail.tx_hash, color: 'green' };
    }
    if (this.bail.blockchain_status === 'failed') {
      return { label: 'Échec blockchain', sub: 'Transaction non confirmée', color: 'red' };
    }
    return { label: "En attente d'enregistrement blockchain", sub: '', color: 'amber' };
  }

  get statutLabel(): string {
    const map: Record<string, string> = {
      en_attente: 'En attente',
      signe:      'Signé',
      actif:      'Actif',
      termine:    'Terminé',
      resilie:    'Résilié',
      annule:     'Annulé',
    };
    return map[this.bail?.statut ?? ''] ?? (this.bail?.statut ?? '');
  }

  get statutClass(): string {
    switch (this.bail?.statut) {
      case 'actif':      return 'bg-green-50 text-green-700 border-green-200';
      case 'en_attente': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'signe':      return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'resilie':    return 'bg-red-50 text-red-700 border-red-200';
      default:           return 'bg-stone-100 text-stone-600 border-stone-200';
    }
  }

  // ── Actions ──────────────────────────────────────────────────────────────

  sign() {
    if (!this.bail) return;
    this.isSigning = true;
    this.cdr.markForCheck();

    this.bailService.signerBail(this.bail.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.bail      = updated;
          this.isSigning = false;
          this.cdr.markForCheck();
          this.toast.success('Contrat signé avec succès.');
          this.signed.emit(updated);
        },
        error: (err) => {
          this.isSigning = false;
          this.cdr.markForCheck();
          this.toast.error(err?.error?.detail || 'Erreur lors de la signature.');
        }
      });
  }

  openResilierConfirm() {
    this.motifResiliation = '';
    this.view = 'confirm_resilier';
    this.cdr.markForCheck();
  }

  cancelResilier() {
    this.view = 'detail';
    this.motifResiliation = '';
    this.cdr.markForCheck();
  }

  confirmResilier() {
    if (!this.bail || !this.motifResiliation.trim()) {
      this.toast.error('Veuillez indiquer un motif de résiliation.');
      return;
    }
    this.isResiliant = true;
    this.cdr.markForCheck();

    this.bailService.resilierBail(this.bail.id, this.motifResiliation.trim())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.bail        = updated;
          this.isResiliant = false;
          this.view        = 'detail';
          this.cdr.markForCheck();
          this.toast.success('Bail résilié avec succès.');
          this.resilied.emit(updated);
        },
        error: (err) => {
          this.isResiliant = false;
          this.cdr.markForCheck();
          this.toast.error(err?.error?.detail || 'Erreur lors de la résiliation.');
        }
      });
  }

  downloadPdf() {
    if (!this.bail || this.isDownloading) return;
    this.isDownloading = true;
    this.cdr.markForCheck();

    this.bailService.telechargerPdf(this.bail.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          const typeLabels: Record<string, string> = {
            longue_duree: 'bail-longue-duree',
            courte_duree: 'location-courte-duree',
            achat:        'contrat-vente',
          };
          const slug = typeLabels[this.bail!.type_bail] ?? 'contrat';
          const url  = URL.createObjectURL(blob);
          const a    = document.createElement('a');
          a.href     = url;
          a.download = `${slug}-${this.bail!.id}-${this.bail!.logement_info?.city ?? 'city'}.pdf`;
          a.click();
          URL.revokeObjectURL(url);
          this.isDownloading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.isDownloading = false;
          this.cdr.markForCheck();
          this.toast.error('Erreur lors du téléchargement du PDF.');
        }
      });
  }

  // ✅ Ouvrir / fermer le drawer de paiement
  openPayment() {
    this.showPaymentDrawer = true;
    this.cdr.markForCheck();
  }

  closePayment() {
    this.showPaymentDrawer = false;
    // Recharge le bail pour refléter les éventuels changements de statut
    this.reload();
  }

  onOverlayClick(e: MouseEvent) {
    if ((e.target as HTMLElement) === e.currentTarget) this.close.emit();
  }
}

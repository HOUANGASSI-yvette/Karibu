import {
  Component, OnInit, Output, EventEmitter,
  ChangeDetectorRef, NgZone, DestroyRef, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  FileText, Check, X, Clock, ChevronRight,
  RefreshCw, Inbox, Send, MessageSquare, Loader, ScrollText
} from 'lucide-angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReservationService, ReservationItem } from '../../../../services/reservation.service';
import { BailService, BailDetail } from '../../../../services/bail.service';
import { ToastService } from '../../../../shared/toast.service';
import { AuthService } from '../../../../services/auth.service';
import { ChatService } from '../../../../services/chat.service';
import { Router } from '@angular/router';
import { BailModalComponent } from '../../../../shared/bail-modal/bail-modal.component';

type MainTab = 'reservations' | 'contrats';

@Component({
  selector: 'app-requests-section',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, BailModalComponent],
  templateUrl: './requests-section.html',
})
export class RequestsSectionComponent implements OnInit {
  @Output() requestHandled = new EventEmitter<{ id: string; action: 'accepted' | 'rejected' }>();

  readonly FileIcon    = FileText;
  readonly CheckIcon   = Check;
  readonly XIcon       = X;
  readonly ClockIcon   = Clock;
  readonly ChevronIcon = ChevronRight;
  readonly RefreshIcon = RefreshCw;
  readonly InboxIcon   = Inbox;
  readonly SendIcon    = Send;
  readonly MessageIcon = MessageSquare;
  readonly LoaderIcon  = Loader;
  readonly ContratIcon = ScrollText;

  // Reservations
  receivedRequests: ReservationItem[] = [];
  sentRequests:     ReservationItem[] = [];
  reservationTab: 'received' | 'sent' = 'received';

  // Baux
  mesBaux: BailDetail[] = [];
  isLoadingBaux = false;

  // Tabs principales
  mainTab: MainTab = 'reservations';

  isLoading  = true;
  hasError   = false;

  processingId:     number | null = null;
  contactingUserId: number | null = null;
  selectedBailId:   number | null = null;

  private destroyRef = inject(DestroyRef);

  constructor(
    private reservationService: ReservationService,
    private bailService: BailService,
    private toast: ToastService,
    public  authService: AuthService,
    private chatService: ChatService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
  ) {}

  ngOnInit() {
    const role = this.authService.getCurrentUser()?.role;
    if (role === 'locataire') {
      this.reservationTab = 'sent';
      this.mainTab = 'reservations';
      this.loadSent();
    } else {
      this.loadReceived();
    }
  }

  private run(fn: () => void) {
    this.zone.run(() => { fn(); this.cdr.detectChanges(); });
  }

  // ── Onglet principal ──────────────────────────────────────────────────────

  switchMainTab(tab: MainTab) {
    this.mainTab = tab;
    this.cdr.detectChanges();
    if (tab === 'contrats' && this.mesBaux.length === 0 && !this.isLoadingBaux) {
      this.loadBaux();
    }
  }

  // ── Reservations ──────────────────────────────────────────────────────────

  loadReceived() {
    this.isLoading = true;
    this.hasError  = false;
    this.cdr.detectChanges();
    this.reservationService.getReceivedRequests()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next:  (r) => this.run(() => { this.receivedRequests = r; this.isLoading = false; }),
        error: ()  => this.run(() => { this.isLoading = false; this.hasError = true; }),
      });
  }

  loadSent() {
    this.isLoading = true;
    this.hasError  = false;
    this.cdr.detectChanges();
    this.reservationService.getSentRequests()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next:  (r) => this.run(() => { this.sentRequests = r; this.isLoading = false; }),
        error: ()  => this.run(() => { this.isLoading = false; this.hasError = true; }),
      });
  }

  switchReservationTab(tab: 'received' | 'sent') {
    this.reservationTab = tab;
    this.cdr.detectChanges();
    if (tab === 'received' && !this.receivedRequests.length && !this.hasError) this.loadReceived();
    if (tab === 'sent'     && !this.sentRequests.length     && !this.hasError) this.loadSent();
  }

  handleRequest(id: number, action: 'accepted' | 'rejected') {
    this.processingId = id;
    this.cdr.detectChanges();
    this.reservationService.updateStatus(id, action)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => this.run(() => {
          this.receivedRequests = this.receivedRequests.map(r =>
            r.id === id ? { ...r, status: updated.status, bail_id: updated.bail_id } : r
          );
          this.processingId = null;
          this.requestHandled.emit({ id: String(id), action });
          this.toast.success(action === 'accepted' ? 'Demande acceptée — bail généré' : 'Demande refusée');
          if (action === 'accepted') this.mesBaux = [];
        }),
        error: () => this.run(() => {
          this.processingId = null;
          this.toast.error('Erreur lors du traitement.');
        }),
      });
  }

  // ── Baux ──────────────────────────────────────────────────────────────────

  loadBaux() {
    this.isLoadingBaux = true;
    this.cdr.detectChanges();
    this.bailService.getMesBaux()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next:  (b) => this.run(() => { this.mesBaux = b; this.isLoadingBaux = false; }),
        error: ()  => this.run(() => { this.isLoadingBaux = false; this.toast.error('Impossible de charger les contrats.'); }),
      });
  }

  // ── Shared ────────────────────────────────────────────────────────────────

  contactUser(userId: number) {
    this.contactingUserId = userId;
    this.cdr.detectChanges();
    this.chatService.getOrCreateRoom(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (room) => this.zone.run(() => {
          this.contactingUserId = null;
          this.router.navigate(['/messages'], { queryParams: { roomId: room.id } });
        }),
        error: () => this.run(() => {
          this.contactingUserId = null;
          this.toast.error("Impossible d'ouvrir la messagerie.");
        }),
      });
  }

  openBail(bailId: number | null) {
    if (bailId !== null) {
      this.selectedBailId = bailId;
      this.cdr.detectChanges();
    }
  }

  // Appelé quand les deux parties ont signé → bail passe actif
  onBailSigned(bail: BailDetail) {
    this.mesBaux = this.mesBaux.map(b => b.id === bail.id ? bail : b);
    this.selectedBailId = null;
    this.cdr.detectChanges();
  }

  // ← AJOUT : appelé quand le bail est résilié depuis le modal
  onBailResilient(bail: BailDetail) {
    this.mesBaux = this.mesBaux.map(b => b.id === bail.id ? bail : b);
    this.selectedBailId = null;
    this.cdr.detectChanges();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  get pendingCount(): number {
    return this.receivedRequests.filter(r => r.status === 'pending').length;
  }

  get isProprietaire(): boolean {
    return this.authService.getCurrentUser()?.role !== 'locataire';
  }

  bailStatutLabel(statut: string): string {
    const map: Record<string, string> = {
      en_attente: 'En attente',
      signe:      'Signé',
      actif:      'Actif',
      termine:    'Terminé',
      resilie:    'Résilié',
      annule:     'Annulé',
    };
    return map[statut] ?? statut;
  }

  bailStatutClass(statut: string): string {
    if (statut === 'actif')      return 'text-xs px-2 py-0.5 bg-green-50 text-green-700 border border-green-200';
    if (statut === 'en_attente') return 'text-xs px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200';
    if (statut === 'signe')      return 'text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200';
    if (statut === 'resilie')    return 'text-xs px-2 py-0.5 bg-red-50 text-red-600 border border-red-200';
    return 'text-xs px-2 py-0.5 bg-stone-100 text-stone-500 border border-stone-200';
  }
}

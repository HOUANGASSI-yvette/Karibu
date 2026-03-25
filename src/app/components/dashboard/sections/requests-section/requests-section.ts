import {
  Component, OnInit, Output, EventEmitter,
  ChangeDetectorRef, NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  FileText, Check, X, Clock, ChevronRight,
  RefreshCw, Inbox, Send, MessageSquare, Loader
} from 'lucide-angular';
import { ReservationService, ReservationItem } from '../../../../services/reservation.service';
import { ToastService } from '../../../../shared/toast.service';
import { AuthService } from '../../../../services/auth.service';
import { ChatService } from '../../../../services/chat.service';
import { Router } from '@angular/router';
import { BailModalComponent } from '../../../../shared/bail-modal/bail-modal.component';

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

  receivedRequests: ReservationItem[] = [];
  sentRequests:     ReservationItem[] = [];
  activeTab: 'received' | 'sent' = 'received';
  isLoading  = true;
  hasError   = false;

  processingId:     number | null = null;
  contactingUserId: number | null = null;
  selectedBailId:   number | null = null;

  constructor(
    private reservationService: ReservationService,
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
      this.activeTab = 'sent';
      this.loadSent();
    } else {
      this.loadReceived();
    }
  }

  private run(fn: () => void) {
    // S'assure que la fonction s'exécute dans la zone Angular
    // et force un cycle de détection après — solution universelle
    // quel que soit le mode de détection du parent
    this.zone.run(() => {
      fn();
      this.cdr.detectChanges();
    });
  }

  loadReceived() {
    this.isLoading = true;
    this.hasError  = false;
    this.cdr.detectChanges();
    this.reservationService.getReceivedRequests().subscribe({
      next: (r) => this.run(() => {
        this.receivedRequests = r;
        this.isLoading        = false;
      }),
      error: () => this.run(() => {
        this.isLoading = false;
        this.hasError  = true;
      }),
    });
  }

  loadSent() {
    this.isLoading = true;
    this.hasError  = false;
    this.cdr.detectChanges();
    this.reservationService.getSentRequests().subscribe({
      next: (r) => this.run(() => {
        this.sentRequests = r;
        this.isLoading    = false;
      }),
      error: () => this.run(() => {
        this.isLoading = false;
        this.hasError  = true;
      }),
    });
  }

  switchTab(tab: 'received' | 'sent') {
    this.activeTab = tab;
    this.cdr.detectChanges();
    if (tab === 'received' && this.receivedRequests.length === 0 && !this.hasError) this.loadReceived();
    if (tab === 'sent'     && this.sentRequests.length === 0     && !this.hasError) this.loadSent();
  }

  handleRequest(id: number, action: 'accepted' | 'rejected') {
    this.processingId = id;
    this.cdr.detectChanges();
    this.reservationService.updateStatus(id, action).subscribe({
      next: (updated) => this.run(() => {
        this.receivedRequests = this.receivedRequests.map(r =>
          r.id === id ? { ...r, status: updated.status, bail_id: updated.bail_id } : r
        );
        this.processingId = null;
        this.requestHandled.emit({ id: String(id), action });
        this.toast.success(action === 'accepted' ? 'Demande acceptée — bail généré' : 'Demande refusée');
      }),
      error: () => this.run(() => {
        this.processingId = null;
        this.toast.error('Erreur lors du traitement.');
      }),
    });
  }

  contactUser(userId: number) {
    this.contactingUserId = userId;
    this.cdr.detectChanges();
    this.chatService.getOrCreateRoom(userId).subscribe({
      next: (room) => {
        // navigate sort de la zone Angular — on l'y remet explicitement
        this.zone.run(() => {
          this.contactingUserId = null;
          this.router.navigate(['/messages'], { queryParams: { roomId: room.id } });
        });
      },
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

  get pendingCount(): number {
    return this.receivedRequests.filter(r => r.status === 'pending').length;
  }

  get isProprietaire(): boolean {
    return this.authService.getCurrentUser()?.role !== 'locataire';
  }
}

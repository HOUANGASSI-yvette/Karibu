import {
  Component, OnInit, OnDestroy,
  inject, ChangeDetectorRef, Output, EventEmitter
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../../services/auth.service';
import { ChatService } from '../../../../services/chat.service';
import { environment } from '../../../../../environments/environment';

export interface LocataireFromBail {
  bail_id:         number;
  bail_statut:     string;
  date_debut:      string;
  date_fin:        string | null;
  prix_total:      number;
  logement_titre:  string;
  locataire_id:    number;
  first_name:      string;
  last_name:       string;
  email:           string;
  telephone:       string;
  avatar_url:      string | null;
  statut_paiement: 'active' | 'late' | 'leaving';
  unread_messages: number;
  chat_room_id:    number | null;
}

@Component({
  selector: 'app-tenants-section',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './tenants-section.html',
})
export class TenantsSectionComponent implements OnInit, OnDestroy {

  private http     = inject(HttpClient);
  private auth     = inject(AuthService);
  private chat     = inject(ChatService);
  private cdr      = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  /** Émis quand l'utilisateur clique "Contacter" — le parent navigue vers la page chat avec ce room_id */
  @Output() navigateToChat = new EventEmitter<number>();

  locataires: LocataireFromBail[] = [];
  loading     = true;
  error:      string | null = null;

  private loadingActions = new Set<string>();
  isLoading(key: string) { return this.loadingActions.has(key); }
  private setLoading(k: string)   { this.loadingActions.add(k);    this.cdr.detectChanges(); }
  private clearLoading(k: string) { this.loadingActions.delete(k); this.cdr.detectChanges(); }

  private base = environment.apiUrl.replace(/\/$/, '');

  ngOnInit()    { this.charger(); }
  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  // ── Chargement ────────────────────────────────────────────────────────────

  charger() {
    this.loading = true;
    this.error   = null;
    this.cdr.markForCheck();

    this.http.get<any[]>(`${this.base}/bails/`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: baux => {
          const userId = this.auth.currentUser()?.id;
          const actifs = baux.filter(b =>
            b.proprietaire === userId && ['actif', 'signe'].includes(b.statut)
          );

          this.chat.getRooms().pipe(takeUntil(this.destroy$)).subscribe({
            next:  rooms => { this.locataires = actifs.map(b => this._map(b, rooms)); this._done(); },
            error: ()    => { this.locataires = actifs.map(b => this._map(b, []));    this._done(); },
          });
        },
        error: e => {
          this.error   = e?.error?.detail ?? 'Impossible de charger les locataires.';
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  private _done() { this.loading = false; this.cdr.detectChanges(); }

  private _map(b: any, rooms: any[]): LocataireFromBail {
    const room    = rooms.find(r => r.other_user_id === b.locataire);
    const fin     = b.date_fin ? new Date(b.date_fin) : null;
    const expired = fin && fin < new Date();

    return {
      bail_id:         b.id,
      bail_statut:     b.statut,
      date_debut:      b.date_debut,
      date_fin:        b.date_fin ?? null,
      prix_total:      b.prix_total,
      logement_titre:  b.logement_detail?.title ?? '—',
      locataire_id:    b.locataire,
      first_name:      b.locataire_detail?.first_name ?? '?',
      last_name:       b.locataire_detail?.last_name  ?? '',
      email:           b.locataire_detail?.email      ?? '—',
      telephone:       b.locataire_detail?.telephone  ?? '—',
      avatar_url:      b.locataire_detail?.avatar_url ?? null,
      statut_paiement: expired ? 'leaving' : 'active',
      unread_messages: room?.unread_count ?? 0,
      chat_room_id:    room?.id ?? null,
    };
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  /**
   * Room déjà connue → émit direct.
   * Room inconnue → getOrCreateRoom puis émit.
   */
  allerAuChat(loc: LocataireFromBail) {
    if (loc.chat_room_id) {
      this.navigateToChat.emit(loc.chat_room_id);
      return;
    }

    const key = `chat-${loc.locataire_id}`;
    this.setLoading(key);

    this.chat.getOrCreateRoom(loc.locataire_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: room => {
          loc.chat_room_id = room.id;
          this.clearLoading(key);
          this.navigateToChat.emit(room.id);
        },
        error: () => this.clearLoading(key),
      });
  }

  telechargerContrat(loc: LocataireFromBail) {
    const key = `pdf-${loc.bail_id}`;
    this.setLoading(key);

    this.http.get(`${this.base}/bails/${loc.bail_id}/pdf/`, { responseType: 'blob' })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: blob => {
          this.clearLoading(key);
          const a    = document.createElement('a');
          a.href     = URL.createObjectURL(blob);
          a.download = `contrat_bail_${loc.bail_id}.pdf`;
          a.click();
          URL.revokeObjectURL(a.href);
        },
        error: () => this.clearLoading(key),
      });
  }

  // ── Helpers UI ────────────────────────────────────────────────────────────

  initiales(loc: LocataireFromBail): string {
    return (loc.first_name[0] ?? '').toUpperCase() + (loc.last_name[0] ?? '').toUpperCase();
  }

  formatPrice(n: number): string {
    return new Intl.NumberFormat('fr-FR').format(n) + '\u202fFCFA';
  }

  statusClass(s: string): string {
    return ({
      active:  'bg-green-50 text-green-700 border-green-200',
      late:    'bg-red-50 text-red-700 border-red-200',
      leaving: 'bg-stone-50 text-stone-600 border-stone-200',
    } as any)[s] ?? '';
  }

  statusLabel(s: string): string {
    return ({ active: 'Actif', late: 'En retard', leaving: 'Bail expiré' } as any)[s] ?? s;
  }

  trackById(_: number, loc: LocataireFromBail) { return loc.bail_id; }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { timeout, catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface EscrowStatut {
  statut_label:    string;
  peut_contester:  boolean;
  peut_liberer:    boolean;
}

export interface BlockchainInfo {
  tx_hash:  string | null;
  statut:   'confirmed' | 'skipped' | 'skipped_no_payment_id';
  erreur?:  string | null;
}

export interface CommissionInfo {
  pourcentage:  number;
  montant_cfa:  number;
  montant_net:  number;
}

export interface SimulationInfo {
  success:  boolean;
  message:  string;
  tx_id:    string;
}

export interface Paiement {
  id:                   number;
  bail:                 number;
  montant:              number;
  statut:               'en_attente' | 'paye' | 'confirme' | 'en_retard' | 'rembourse';
  mois_concerne:        string;
  date_paiement?:       string;
  date_confirmation?:   string;
  note?:                string;
  tx_hash_paiement?:    string;
  tx_hash_confirmation?: string;
  created_at:           string;

  // Champs enrichis escrow
  escrow?:              EscrowStatut;
  methode_paiement?:    string;
  reference_paiement?:  string;
  commission?:          CommissionInfo;
  simulation?:          SimulationInfo;
  blockchain?:          BlockchainInfo;
}

export interface PaiementListResponse {
  paiements: Paiement[];
  totaux: {
    total_paye_cfa:        number;
    total_confirme_cfa:    number;
    commission_karibu_cfa: number;
    montant_net_proprio:   number;
    nb_en_retard:          number;
    nb_paiements:          number;
  };
}

export interface SimulerPaiementPayload {
  montant:           number;
  mois_concerne:     string;
  methode:           'flooz' | 'tmoney' | 'wave' | 'especes';
  numero_telephone?: string;
  note?:             string;
}

export interface ContesterPayload {
  motif?: string;
}

export interface ArbitrerPayload {
  en_faveur_proprietaire: boolean;
  commentaire?:           string;
}

@Injectable({ providedIn: 'root' })
export class EscrowPaymentService {

  private base = environment.apiUrl;

  // Timeout appliqué à toutes les requêtes HTTP (en ms)
  private readonly TIMEOUT_MS = 10_000;

  constructor(private http: HttpClient) {}

  private url(bailId: number, ...segments: (string | number)[]): string {
    return [this.base, 'bails', bailId, 'escrow', ...segments].join('/') + '/';
  }

  private rawUrl(...segments: (string | number)[]): string {
    return [this.base, ...segments].join('/') + '/';
  }

  private request<T>(obs: Observable<T>, tag = ''): Observable<T> {
    console.debug(`[EscrowPaymentService] request START ${tag}`);
    return obs.pipe(
      timeout(this.TIMEOUT_MS),
      tap({
        next: res => console.debug(`[EscrowPaymentService] request SUCCESS ${tag}`, res),
        error: err => console.error(`[EscrowPaymentService] request TAP error ${tag}`, err),
      }),
      catchError(err => {
        console.error(`[EscrowPaymentService] request ERROR ${tag}`, err);
        return throwError(() => err);
      })
    );
  }

  /** POST /bails/{bailId}/escrow/payer/ — simulation  */
  simulerPaiement(bailId: number, payload: SimulerPaiementPayload): Observable<Paiement> {
    const u = this.url(bailId, 'payer');
    console.debug('[EscrowPaymentService] simulerPaiement URL:', u, 'payload:', payload);
    return this.request<Paiement>(this.http.post<Paiement>(u, payload), `simulerPaiement ${bailId}`);
  }

  /** GET /bails/{bailId}/escrow/paiements/ */
  listerPaiements(bailId: number): Observable<PaiementListResponse> {
    const u = this.url(bailId, 'paiements');
    console.debug('[EscrowPaymentService] listerPaiements URL:', u);
    return this.request<PaiementListResponse>(this.http.get<PaiementListResponse>(u), `listerPaiements ${bailId}`);
  }

  /** GET /bails/{bailId}/escrow/paiements/{id}/ */
  detailPaiement(bailId: number, paiementId: number): Observable<Paiement> {
    const u = this.url(bailId, 'paiements', paiementId);
    console.debug('[EscrowPaymentService] detailPaiement URL:', u);
    return this.request<Paiement>(this.http.get<Paiement>(u), `detailPaiement ${bailId}/${paiementId}`);
  }

  /** POST /bails/{bailId}/escrow/paiements/{id}/liberer/ */
  libererPaiement(bailId: number, paiementId: number): Observable<Paiement> {
    const u = this.url(bailId, 'paiements', paiementId, 'liberer');
    console.debug('[EscrowPaymentService] libererPaiement URL:', u);
    return this.request<Paiement>(this.http.post<Paiement>(u, {}), `libererPaiement ${bailId}/${paiementId}`);
  }

  /** POST /bails/{bailId}/escrow/paiements/{id}/contester/ */
  contesterPaiement(bailId: number, paiementId: number, payload: ContesterPayload): Observable<Paiement> {
    const u = this.url(bailId, 'paiements', paiementId, 'contester');
    console.debug('[EscrowPaymentService] contesterPaiement URL:', u, 'payload:', payload);
    return this.request<Paiement>(this.http.post<Paiement>(u, payload), `contesterPaiement ${bailId}/${paiementId}`);
  }

  /** POST /bails/{bailId}/escrow/paiements/{id}/arbitrer/ — admin only */
  arbitrerPaiement(bailId: number, paiementId: number, payload: ArbitrerPayload): Observable<Paiement> {
    const u = this.url(bailId, 'paiements', paiementId, 'arbitrer');
    console.debug('[EscrowPaymentService] arbitrerPaiement URL:', u, 'payload:', payload);
    return this.request<Paiement>(this.http.post<Paiement>(u, payload), `arbitrerPaiement ${bailId}/${paiementId}`);
  }

  // ─── Nouveaux endpoints / helpers (migrés depuis le component) ───────────

  /** GET /bails/{bailId}/paiements/{paiementId}/quittance/  -> blob */
  downloadQuittance(bailId: number, paiementId: number): Observable<Blob> {
    const url = this.rawUrl('bails', bailId, 'paiements', paiementId, 'quittance');
    console.debug('[EscrowPaymentService] downloadQuittance URL:', url);
    return this.request<Blob>(this.http.get(url, { responseType: 'blob' }), `downloadQuittance ${bailId}/${paiementId}`);
  }

  /** POST /bails/{bailId}/paiements/{paiementId}/quittance-email/ */
  envoyerQuittanceEmail(bailId: number, paiementId: number): Observable<any> {
    const url = this.rawUrl('bails', bailId, 'paiements', paiementId, 'quittance-email');
    console.debug('[EscrowPaymentService] envoyerQuittanceEmail URL:', url);
    return this.request<any>(this.http.post(url, {}), `envoyerQuittanceEmail ${bailId}/${paiementId}`);
  }

  /** GET /bails/{bailId}/releve/?annee=... -> blob (export PDF) */
  downloadReleve(bailId: number, annee?: number | null): Observable<Blob> {
    const base = this.rawUrl('bails', bailId, 'releve');
    const url = annee ? base.replace(/\/$/, '') + `?annee=${annee}` : base;
    console.debug('[EscrowPaymentService] downloadReleve URL:', url);
    return this.request<Blob>(this.http.get(url, { responseType: 'blob' }), `downloadReleve ${bailId} annee=${annee}`);
  }

  /** POST /bails/{bailId}/releve-email/ */
  envoyerReleveEmail(bailId: number, payload: { annee?: number; email?: string | undefined }): Observable<any> {
    const url = this.rawUrl('bails', bailId, 'releve-email');
    console.debug('[EscrowPaymentService] envoyerReleveEmail URL:', url, 'payload:', payload);
    return this.request<any>(this.http.post(url, payload), `envoyerReleveEmail ${bailId}`);
  }

  // ─── Helpers UI ────────────────────────────────────────────────────────────

  statutLabel(statut: string): string {
    return ({
      en_attente: 'En attente',
      paye:       'En escrow',
      confirme:   'Confirmé',
      en_retard:  'Litige ouvert',
      rembourse:  'Remboursé',
    } as Record<string, string>)[statut] ?? statut;
  }

  statutClasses(statut: string): string {
    return ({
      en_attente: 'bg-amber-100 text-amber-800 border-amber-200',
      paye:       'bg-blue-100 text-blue-800 border-blue-200',
      confirme:   'bg-green-100 text-green-800 border-green-200',
      en_retard:  'bg-red-100 text-red-800 border-red-200',
      rembourse:  'bg-stone-100 text-stone-600 border-stone-200',
    } as Record<string, string>)[statut] ?? 'bg-stone-100 text-stone-600 border-stone-200';
  }

  // Dans escrow-payment.service.ts — ajoute cette méthode
  listerLitigesAdmin(): Observable<{ results: Paiement[]; count: number }> {
    const url = `${this.base}/bails/admin/paiements/?statut=en_retard&page_size=50`;
    return this.request(
      this.http.get<{ results: Paiement[]; count: number }>(url),
      'listerLitigesAdmin'
    );
  }

  polygonscanUrl(txHash?: string | null): string | null {
    if (!txHash || txHash.startsWith('KARIBU-SIM-')) return null;
    const net = environment.production ? 'polygon' : 'amoy';
    return `https://${net}.polygonscan.com/tx/${txHash}`;
  }

}

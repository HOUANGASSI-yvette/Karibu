import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface BailCreate {
  logement: number | string;
  type_bail: 'longue_duree' | 'courte_duree' | 'achat';
  date_debut: string;
  date_fin?: string;
  prix_total: number;
  charges_incluses?: boolean;
  depot_garantie?: number;
}

export interface BailDetail {
  id: number;
  proprietaire: number;
  proprietaire_info: any;
  locataire: number;
  locataire_info: any;
  logement: number;
  logement_info: any;
  type_bail: string;
  statut: 'en_attente' | 'signe' | 'actif' | 'termine' | 'resilie' | 'annule';
  date_debut: string;
  date_fin: string | null;
  prix_total: number;
  signe_proprietaire: boolean;
  signe_locataire: boolean;
  tx_hash?: string;
  contrat_hash?: string;
  blockchain_url?: string;
  blockchain_status?: 'confirmed' | 'failed' | 'pending' | null;
  token_signature_prop?: string;
  token_signature_loc?: string;
  motif_resiliation?: string;
  date_resiliation?: string;
  paiements?: any[];
  created_at?: string;
  updated_at?: string;
}

export interface PaiementCreate {
  montant: number;
  mois_concerne: string;
  methode?: 'flooz' | 'tmoney' | 'wave' | 'carte' | 'especes';
  numero_telephone?: string;
  note?: string;
}

@Injectable({ providedIn: 'root' })
export class BailService {
  private readonly base = `${environment.apiUrl}/bails`;

  constructor(private http: HttpClient) {}

  getMesBaux(): Observable<BailDetail[]> {
    return this.http.get<BailDetail[]>(`${this.base}/`);
  }

  getBail(id: number): Observable<BailDetail> {
    return this.http.get<BailDetail>(`${this.base}/${id}/`);
  }

  creerBail(data: BailCreate): Observable<BailDetail> {
    return this.http.post<BailDetail>(`${this.base}/`, data);
  }

  modifierBail(id: number, data: Partial<BailCreate>) {
    return this.http.patch<BailDetail>(`${this.base}/${id}/`, data);
  }

  annulerBail(id: number) {
    return this.http.delete<void>(`${this.base}/${id}/`);
  }

  signerBail(id: number): Observable<BailDetail> {
    return this.http.post<BailDetail>(`${this.base}/${id}/signer/`, {});
  }

  // ← NOUVEAU : résiliation avec motif
  resilierBail(id: number, motif: string): Observable<BailDetail> {
    return this.http.post<BailDetail>(`${this.base}/${id}/resilier/`, { motif });
  }

  getPaiements(bailId: number) {
    return this.http.get<any[]>(`${this.base}/${bailId}/paiements/`);
  }

  simulerPaiement(bailId: number, data: PaiementCreate) {
    return this.http.post<any>(`${this.base}/${bailId}/payer/`, data);
  }

  confirmerPaiement(bailId: number, paiementId: number) {
    return this.http.post<any>(`${this.base}/${bailId}/confirmer-paiement/${paiementId}/`, {});
  }

  telechargerPdf(bailId: number) {
    return this.http.get(`${this.base}/${bailId}/pdf/`, { responseType: 'blob' });
  }

  downloadPdf(bail: BailDetail) {
    this.telechargerPdf(bail.id).subscribe({
      next: (blob) => {
        const typeLabels: Record<string, string> = {
          longue_duree: 'bail-longue-duree',
          courte_duree: 'location-courte-duree',
          achat: 'contrat-vente',
        };
        const slug = typeLabels[bail.type_bail] ?? 'contrat';
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${slug}-${bail.id}-${bail.logement_info?.city ?? 'city'}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: (err) => console.error('Erreur téléchargement PDF', err),
    });
  }

  verifierBlockchain(bailId: number) {
    return this.http.get<any>(`${this.base}/${bailId}/verifier/`);
  }

  getStatsBlockchain() {
    return this.http.get<any>(`${environment.apiUrl}/bails/blockchain/stats/`);
  }
}

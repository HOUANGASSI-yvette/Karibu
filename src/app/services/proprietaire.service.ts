// services/proprietaire.service.ts
import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type DocumentType =
  | 'cni_recto'
  | 'cni_verso'
  | 'passeport'
  | 'justificatif_domicile'
  | 'justificatif_propriete';

export type DocumentStatut = 'en_attente' | 'valide' | 'rejete';
export type ProprietaireStatut = 'en_attente' | 'verifie' | 'rejete';

export interface DocumentItem {
  id: number;
  type_document: DocumentType;
  fichier_nom: string;
  fichier_type: string;
  fichier_base64: string;
  statut: DocumentStatut;
  commentaire_admin: string;
  date_soumission: string;
  date_traitement: string | null;
}

export interface ProprietaireProfil {
  id: number;
  username: string;
  email: string;
  statut_verification: ProprietaireStatut;
  date_validation: string | null;
  documents: DocumentItem[];
}

@Injectable({ providedIn: 'root' })
export class ProprietaireService {
  private readonly BASE = `${environment.apiUrl}/proprietaire`;

  isLoading = signal(false);

  constructor(private http: HttpClient) {}

  // ── Profil proprietaire connecté ──────────────────────
  monProfil(): Observable<ProprietaireProfil> {
    return this.http.get<ProprietaireProfil>(`${this.BASE}/profil/`);
  }

  // ── Soumettre un document ──────────────────────────────
  soumettreDocument(type_document: DocumentType, fichier: File): Observable<DocumentItem> {
    const fd = new FormData();
    fd.append('type_document', type_document);
    fd.append('fichier', fichier, fichier.name);
    return this.http.post<DocumentItem>(`${this.BASE}/documents/soumettre/`, fd);
  }

  // ── Mes documents ──────────────────────────────────────
  mesDocuments(): Observable<DocumentItem[]> {
    return this.http.get<DocumentItem[]>(`${this.BASE}/documents/mes-documents/`);
  }

  // ── Supprimer un document en_attente ──────────────────
  supprimerDocument(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/documents/${id}/supprimer/`);
  }
}

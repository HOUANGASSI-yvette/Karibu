// src/app/core/services/document.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DocumentAdmin {
  id: number;
  type_document: string;
  proprietaire_id: number;
  statut: 'en_attente' | 'valide' | 'rejete';
  date_soumission: string;
  date_traitement: string | null;
  commentaire_admin: string | null;
  proprietaire_username: string;
  fichier_base64: string | null;
  fichier_type: string | null;
}

export interface ProprietaireDetail {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  telephone: string;
  date_inscription: string;
  statut_verification: 'en_attente' | 'verifie' | 'rejete';
  date_validation: string | null;
  documents: DocumentAdmin[];
  total_documents: number;
  docs_valides: number;
  docs_rejetes: number;
  docs_en_attente: number;
}



export interface TraiterDocumentPayload {
  statut: 'valide' | 'rejete';
  commentaire_admin?: string;
}

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/proprietaire/documents`;

  /** Admin — tous les documents (filtrés optionnellement) */
  getTousDocuments(statut?: string, type_document?: string): Observable<DocumentAdmin[]> {
    const params: Record<string, string> = {};
    if (statut)        params['statut']        = statut;
    if (type_document) params['type_document'] = type_document;
    return this.http.get<DocumentAdmin[]>(`${this.base}/`, { params });
  }

  getDetailProprietaire(id: number): Observable<ProprietaireDetail> {
    return this.http.get<ProprietaireDetail>(
      `${environment.apiUrl}/proprietaire/${id}/detail/`
    );
  }

  /** Admin — valider ou rejeter un document */
  traiterDocument(id: number, payload: TraiterDocumentPayload): Observable<DocumentAdmin> {
    return this.http.patch<DocumentAdmin>(`${this.base}/${id}/traiter/`, payload);
  }

  /** Propriétaire — soumettre un document */
  soumettre(formData: FormData): Observable<any> {
    return this.http.post(`${this.base}/soumettre/`, formData);
  }

  /** Propriétaire — mes documents */
  mesDocuments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/mes-documents/`);
  }

  /** Propriétaire — supprimer un document en_attente */
  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}/supprimer/`);
  }

  /** Utilitaire — construire le src pour <img> ou <a href> */
  getFileSrc(doc: DocumentAdmin): string {
    if (!doc.fichier_base64) return '';
    return `data:${doc.fichier_type};base64,${doc.fichier_base64}`;
  }
}

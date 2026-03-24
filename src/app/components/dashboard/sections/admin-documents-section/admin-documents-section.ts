import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-admin-documents-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-documents-section.html',
})
export class AdminDocumentsSectionComponent implements OnInit {
  documents = signal<any[]>([]);
  isLoading = signal(true);
  filterStatut = signal('');
  actionLoading = signal<number | null>(null);
  commentaire: Record<number, string> = {};

  constructor(private http: HttpClient) {}

  ngOnInit() { this.load(); }

  load() {
    this.isLoading.set(true);
    const statut = this.filterStatut();
    const params = statut ? `?statut=${statut}` : '';
    this.http.get<any[]>(`${environment.apiUrl}/proprietaire/documents/${params}`).subscribe({
      next: (data) => { this.documents.set(data); this.isLoading.set(false); },
      error: () => this.isLoading.set(false),
    });
  }

  setFilter(s: string) { this.filterStatut.set(s); this.load(); }

  traiter(id: number, statut: 'valide' | 'rejete') {
    this.actionLoading.set(id);
    this.http.patch(`${environment.apiUrl}/proprietaire/documents/${id}/traiter/`, {
      statut,
      commentaire_admin: this.commentaire[id] ?? '',
    }).subscribe({
      next: () => { this.actionLoading.set(null); this.load(); },
      error: () => this.actionLoading.set(null),
    });
  }

  getImageSrc(doc: any): string {
    if (!doc.fichier_base64) return '';
    return `data:${doc.fichier_type};base64,${doc.fichier_base64}`;
  }
}

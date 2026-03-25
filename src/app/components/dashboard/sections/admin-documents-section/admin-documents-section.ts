import { Component, OnInit, signal, inject, viewChild, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, FileText, ChevronDown, ChevronRight, User } from 'lucide-angular';
import { DocumentService, DocumentAdmin } from '../../../../services/document.service';
import { AdminDocPanelComponent } from '../admin-doc-panel/admin-doc-panel.component';

interface GroupeProprietaire {
  proprietaireId: number;
  username: string;
  documents: DocumentAdmin[];
  expanded: boolean;
}

@Component({
  selector: 'app-admin-documents-section',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminDocPanelComponent, LucideAngularModule],
  templateUrl: './admin-documents-section.html',
})
export class AdminDocumentsSectionComponent implements OnInit {
  private docService = inject(DocumentService);

  readonly icons = { FileText, ChevronDown, ChevronRight, User };

  documents    = signal<DocumentAdmin[]>([]);
  isLoading    = signal(true);
  filterStatut = signal('');

  groupes = computed<GroupeProprietaire[]>(() => {
    const map = new Map<number, GroupeProprietaire>();
    for (const doc of this.documents()) {
      const id = doc.proprietaire_id;
      if (!map.has(id)) {
        map.set(id, {
          proprietaireId: id,
          username: doc.proprietaire_username,
          documents: [],
          expanded: true,
        });
      }
      map.get(id)!.documents.push(doc);
    }
    return Array.from(map.values());
  });

  panelRef = viewChild(AdminDocPanelComponent);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.docService.getTousDocuments(this.filterStatut() || undefined).subscribe({
      next: (data) => { this.documents.set(data); this.isLoading.set(false); },
      error: ()     => this.isLoading.set(false),
    });
  }

  setFilter(s: string): void {
    this.filterStatut.set(s);
    this.load();
  }

  toggleGroupe(groupe: GroupeProprietaire): void {
    groupe.expanded = !groupe.expanded;
  }

  ouvrirDetail(proprietaireId: number): void {
    this.panelRef()?.open(proprietaireId);
  }

  getImageSrc(doc: DocumentAdmin): string {
    return this.docService.getFileSrc(doc);
  }

  statutClass(statut: string): string {
    if (statut === 'valide')    return 'bg-green-50 text-green-700 border border-green-200';
    if (statut === 'rejete')    return 'bg-red-50 text-red-700 border border-red-200';
    return 'bg-amber-50 text-amber-700 border border-amber-200';
  }

  statutLabel(statut: string): string {
    if (statut === 'valide') return 'Validé';
    if (statut === 'rejete') return 'Rejeté';
    return 'En attente';
  }

  badgeGroupe(docs: DocumentAdmin[]): string {
    const attente = docs.filter(d => d.statut === 'en_attente').length;
    if (attente > 0) return `${attente} en attente`;
    const rejete = docs.filter(d => d.statut === 'rejete').length;
    if (rejete > 0) return `${rejete} rejeté${rejete > 1 ? 's' : ''}`;
    return 'Tous validés';
  }

  badgeGroupeClass(docs: DocumentAdmin[]): string {
    const attente = docs.filter(d => d.statut === 'en_attente').length;
    if (attente > 0) return 'bg-amber-50 text-amber-700 border border-amber-200';
    const rejete = docs.filter(d => d.statut === 'rejete').length;
    if (rejete > 0) return 'bg-red-50 text-red-700 border border-red-200';
    return 'bg-green-50 text-green-700 border border-green-200';
  }
}

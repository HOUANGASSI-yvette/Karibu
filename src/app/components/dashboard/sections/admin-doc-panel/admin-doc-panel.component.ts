import { Component, signal, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  X, ChevronRight, FileText, ExternalLink,
  Mail, Phone, Calendar, CheckCircle,
} from 'lucide-angular';
import {
  DocumentService,
  DocumentAdmin,
  ProprietaireDetail,
} from '../../../../services/document.service';
import { ToastService } from '../../../../shared/toast.service'; // adapter le chemin

@Component({
  selector: 'app-admin-doc-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './admin-doc-panel.component.html',
})
export class AdminDocPanelComponent {
  private docService = inject(DocumentService);
  private toast      = inject(ToastService);

  @Output() closed         = new EventEmitter<void>();
  @Output() documentTraite = new EventEmitter<void>();

  readonly icons = { X, ChevronRight, FileText, ExternalLink, Mail, Phone, Calendar, CheckCircle };

  isOpen        = signal(false);
  isLoading     = signal(false);
  proprietaire  = signal<ProprietaireDetail | null>(null);
  docActif      = signal<DocumentAdmin | null>(null);
  actionLoading = signal<number | null>(null);
  commentaire: Record<number, string> = {};

  open(proprietaireId: number): void {
    this.isOpen.set(true);
    this.isLoading.set(true);
    this.docActif.set(null);
    this.docService.getDetailProprietaire(proprietaireId).subscribe({
      next: (data) => {
        this.proprietaire.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.toast.error('Impossible de charger le dossier.');
      },
    });
  }

  // Rechargement silencieux — panel reste ouvert, pas de spinner global
  private reloadProprietaire(): void {
    const p = this.proprietaire();
    if (!p) return;
    this.docService.getDetailProprietaire(p.id).subscribe({
      next: (data) => this.proprietaire.set(data),
    });
  }

  close(): void {
    this.isOpen.set(false);
    this.proprietaire.set(null);
    this.closed.emit();
  }

  toggleDoc(doc: DocumentAdmin): void {
    this.docActif.set(this.docActif()?.id === doc.id ? null : doc);
  }

  getFileSrc(doc: DocumentAdmin): string {
    return this.docService.getFileSrc(doc);
  }

  traiter(docId: number, statut: 'valide' | 'rejete'): void {
    if (statut === 'rejete' && !this.commentaire[docId]?.trim()) {
      this.toast.warning('Un commentaire est requis pour rejeter un document.');
      return;
    }

    this.actionLoading.set(docId);
    this.docService.traiterDocument(docId, {
      statut,
      commentaire_admin: this.commentaire[docId] ?? '',
    }).subscribe({
      next: () => {
        this.actionLoading.set(null);
        this.commentaire[docId] = '';
        this.toast.success(statut === 'valide' ? 'Document validé.' : 'Document rejeté.');
        this.reloadProprietaire();   // panel reste ouvert, données fraîches
        this.documentTraite.emit();
      },
      error: () => {
        this.actionLoading.set(null);
        this.toast.error('Une erreur est survenue. Veuillez réessayer.');
      },
    });
  }

  get statutClass(): string {
    const s = this.proprietaire()?.statut_verification;
    if (s === 'verifie') return 'bg-green-50 text-green-700 border-green-200';
    if (s === 'rejete')  return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }

  get statutLabel(): string {
    const s = this.proprietaire()?.statut_verification;
    if (s === 'verifie') return 'Vérifié';
    if (s === 'rejete')  return 'Rejeté';
    return 'En attente';
  }

  docStatutClass(statut: string): string {
    if (statut === 'valide') return 'bg-green-50 text-green-700 border-green-200';
    if (statut === 'rejete') return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }

  docStatutLabel(statut: string): string {
    if (statut === 'valide') return 'Validé';
    if (statut === 'rejete') return 'Rejeté';
    return 'En attente';
  }
}

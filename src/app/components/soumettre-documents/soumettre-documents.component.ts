// pages/soumettre-documents/soumettre-documents.component.ts
import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  LucideAngularModule,
  FileText, Upload, X, CheckCircle, Clock,
  AlertCircle, Trash2, ChevronRight, ShieldCheck, ArrowLeft,
  Eye, Download
} from 'lucide-angular';
import {
  ProprietaireService,
  DocumentItem,
  DocumentType,
  ProprietaireProfil,
} from '../../services/proprietaire.service';

interface DocConfig {
  key: DocumentType;
  label: string;
  description: string;
  required: boolean;
}

@Component({
  selector: 'app-soumettre-documents',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './soumettre-documents.component.html',
})
export class SoumettreDocumentsComponent implements OnInit {
  // ── Icônes Lucide ──────────────────────────────────────
  readonly FileText    = FileText;
  readonly Upload      = Upload;
  readonly X           = X;
  readonly CheckCircle = CheckCircle;
  readonly Clock       = Clock;
  readonly AlertCircle = AlertCircle;
  readonly Trash2      = Trash2;
  readonly ChevronRight = ChevronRight;
  readonly ShieldCheck = ShieldCheck;
  readonly ArrowLeft   = ArrowLeft;
  readonly Eye         = Eye;
  readonly Download    = Download;

  // ── State ──────────────────────────────────────────────
  profil         = signal<ProprietaireProfil | null>(null);
  isLoading      = signal(true);
  uploadingKey   = signal<DocumentType | null>(null);
  deletingId     = signal<number | null>(null);
  errorMessage   = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  /** Document en cours d'aperçu dans la modal */
  apercuDoc = signal<DocumentItem | null>(null);

  // ── Configuration des documents attendus ──────────────
  readonly docConfigs: DocConfig[] = [
    { key: 'cni_recto',              label: 'CNI Recto',                required: true,  description: "Face avant de votre carte nationale d'identité" },
    { key: 'cni_verso',              label: 'CNI Verso',                required: true,  description: "Face arrière de votre carte nationale d'identité" },
    { key: 'passeport',              label: 'Passeport',                required: false, description: "Page d'identité de votre passeport (alternative à la CNI)" },
    { key: 'justificatif_domicile',  label: 'Justificatif de domicile', required: true,  description: 'Facture, quittance ou attestation de moins de 3 mois' },
    { key: 'justificatif_propriete', label: 'Titre de propriété',       required: true,  description: 'Acte de propriété ou tout document prouvant la détention du bien' },
  ];

  // ── Computed ───────────────────────────────────────────
  documentsParType = computed(() => {
    const docs = this.profil()?.documents ?? [];
    const map: Partial<Record<DocumentType, DocumentItem[]>> = {};
    for (const d of docs) {
      if (!map[d.type_document]) map[d.type_document] = [];
      map[d.type_document]!.push(d);
    }
    return map;
  });

  statutVerif = computed(() => this.profil()?.statut_verification ?? 'en_attente');

  constructor(
    private proprietaireService: ProprietaireService,
    private sanitizer: DomSanitizer,
    private router: Router,
  ) {}

  ngOnInit() {
    this.loadProfil();
  }

  // ── Chargement profil ──────────────────────────────────
  loadProfil() {
    this.isLoading.set(true);
    this.proprietaireService.monProfil().subscribe({
      next: (p) => { this.profil.set(p); this.isLoading.set(false); },
      error: () => { this.isLoading.set(false); this.errorMessage.set('Impossible de charger votre profil.'); },
    });
  }

  // ── Upload ─────────────────────────────────────────────
  triggerFileInput(key: DocumentType) {
    const input = document.getElementById(`file-${key}`) as HTMLInputElement;
    input?.click();
  }

  onFileSelected(event: Event, key: DocumentType) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploadDoc(key, file);
    input.value = ''; // reset pour permettre re-sélection du même fichier
  }

  uploadDoc(key: DocumentType, file: File) {
    // Validation taille côté client (cohérente avec le backend)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      this.errorMessage.set('Fichier trop lourd. Maximum 5 Mo.');
      return;
    }

    this.uploadingKey.set(key);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.proprietaireService.soumettreDocument(key, file).subscribe({
      next: () => {
        this.uploadingKey.set(null);
        this.successMessage.set('Document soumis avec succès. Il sera examiné sous 24 h.');
        setTimeout(() => this.successMessage.set(null), 4000);
        this.loadProfil();
      },
      error: (err) => {
        this.uploadingKey.set(null);
        this.errorMessage.set(err?.error?.detail ?? "Erreur lors de l'envoi du document.");
      },
    });
  }

  // ── Suppression ────────────────────────────────────────
  supprimerDoc(id: number) {
    this.deletingId.set(id);
    this.errorMessage.set(null);
    this.proprietaireService.supprimerDocument(id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.successMessage.set('Document supprimé.');
        setTimeout(() => this.successMessage.set(null), 3000);
        this.loadProfil();
      },
      error: (err) => {
        this.deletingId.set(null);
        this.errorMessage.set(err?.error?.detail ?? 'Erreur lors de la suppression.');
      },
    });
  }

  // ── Helpers documents ─────────────────────────────────
  getDocsDuType(key: DocumentType): DocumentItem[] {
    return this.documentsParType()[key] ?? [];
  }

  /**
   * Retourne le document le plus récent pour un type donné.
   * Priorité : en_attente > rejete > valide (on montre toujours le dernier soumis)
   */
  getLatestDoc(key: DocumentType): DocumentItem | null {
    const docs = this.getDocsDuType(key);
    if (!docs.length) return null;
    // Trier par date de soumission décroissante
    return [...docs].sort(
      (a, b) => new Date(b.date_soumission).getTime() - new Date(a.date_soumission).getTime()
    )[0];
  }

  statutLabel(s: string): string {
    const labels: Record<string, string> = {
      en_attente: 'En attente',
      valide:     'Validé',
      rejete:     'Rejeté',
      verifie:    'Vérifié',
    };
    return labels[s] ?? s;
  }

  // ── Aperçu fichier ─────────────────────────────────────
  isImage(fichierType: string): boolean {
    return fichierType?.startsWith('image/');
  }

  getFileSrc(doc: DocumentItem): string {
    if (!doc?.fichier_base64 || !doc?.fichier_type) return '';
    return `data:${doc.fichier_type};base64,${doc.fichier_base64}`;
  }

  /** Retourne une SafeResourceUrl pour l'iframe PDF */
  getPdfSrc(doc: DocumentItem): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.getFileSrc(doc));
  }

  ouvrirApercu(doc: DocumentItem) {
    this.apercuDoc.set(doc);
  }

  fermerApercu() {
    this.apercuDoc.set(null);
  }
}

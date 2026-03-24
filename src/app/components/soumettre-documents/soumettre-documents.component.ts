// pages/soumettre-documents/soumettre-documents.component.ts
import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { LucideAngularModule, FileText, Upload, X, CheckCircle, Clock, AlertCircle, Trash2, ChevronRight, ShieldCheck, ArrowLeft } from 'lucide-angular';
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
  readonly FileText = FileText;
  readonly Upload = Upload;
  readonly X = X;
  readonly CheckCircle = CheckCircle;
  readonly Clock = Clock;
  readonly AlertCircle = AlertCircle;
  readonly Trash2 = Trash2;
  readonly ChevronRight = ChevronRight;
  readonly ShieldCheck = ShieldCheck;
  readonly ArrowLeft = ArrowLeft;

  profil = signal<ProprietaireProfil | null>(null);
  isLoading = signal(true);
  uploadingKey = signal<DocumentType | null>(null);
  deletingId = signal<number | null>(null);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  readonly docConfigs: DocConfig[] = [
    { key: 'cni_recto',               label: "CNI Recto",                required: true,  description: "Face avant de votre carte nationale d'identité" },
    { key: 'cni_verso',               label: "CNI Verso",                required: true,  description: "Face arrière de votre carte nationale d'identité" },
    { key: 'passeport',               label: "Passeport",                required: false, description: "Page d'identité de votre passeport (alternative à la CNI)" },
    { key: 'justificatif_domicile',   label: "Justificatif de domicile", required: true,  description: "Facture, quittance ou attestation de moins de 3 mois" },
    { key: 'justificatif_propriete',  label: "Titre de propriété",       required: true,  description: "Acte de propriété ou tout document prouvant la détention du bien" },
  ];

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
    private router: Router,
  ) {}

  ngOnInit() {
    this.loadProfil();
  }

  loadProfil() {
    this.isLoading.set(true);
    this.proprietaireService.monProfil().subscribe({
      next: (p) => { this.profil.set(p); this.isLoading.set(false); },
      error: () => { this.isLoading.set(false); this.errorMessage.set('Impossible de charger votre profil.'); },
    });
  }

  triggerFileInput(key: DocumentType) {
    const input = document.getElementById(`file-${key}`) as HTMLInputElement;
    input?.click();
  }

  onFileSelected(event: Event, key: DocumentType) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploadDoc(key, file);
    input.value = '';
  }

  uploadDoc(key: DocumentType, file: File) {
    this.uploadingKey.set(key);
    this.errorMessage.set(null);
    this.proprietaireService.soumettreDocument(key, file).subscribe({
      next: () => {
        this.uploadingKey.set(null);
        this.successMessage.set('Document soumis avec succès.');
        setTimeout(() => this.successMessage.set(null), 3500);
        this.loadProfil();
      },
      error: (err) => {
        this.uploadingKey.set(null);
        this.errorMessage.set(err?.error?.detail ?? 'Erreur lors de l\'envoi.');
      },
    });
  }

  supprimerDoc(id: number) {
    this.deletingId.set(id);
    this.proprietaireService.supprimerDocument(id).subscribe({
      next: () => { this.deletingId.set(null); this.loadProfil(); },
      error: (err) => {
        this.deletingId.set(null);
        this.errorMessage.set(err?.error?.detail ?? 'Erreur lors de la suppression.');
      },
    });
  }

  getDocsDuType(key: DocumentType): DocumentItem[] {
    return this.documentsParType()[key] ?? [];
  }

  getLatestDoc(key: DocumentType): DocumentItem | null {
    const docs = this.getDocsDuType(key);
    return docs.length ? docs[docs.length - 1] : null;
  }

  statutLabel(s: string): string {
    return ({ en_attente: 'En attente', valide: 'Validé', rejete: 'Rejeté', verifie: 'Vérifié' } as any)[s] ?? s;
  }
}

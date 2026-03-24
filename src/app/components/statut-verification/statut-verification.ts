// pages/statut-verification/statut-verification.component.ts
import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  LucideAngularModule,
  ShieldCheck, ShieldX, ShieldAlert,
  CheckCircle, Clock, AlertCircle,
  FileText, ChevronRight, ArrowLeft, RefreshCw,
} from 'lucide-angular';
import {
  ProprietaireService,
  ProprietaireProfil,
  DocumentItem,
} from '../../services/proprietaire.service';

@Component({
  selector: 'app-statut-verification',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './statut-verification.html',
})
export class StatutVerificationComponent implements OnInit {
  readonly ShieldCheck  = ShieldCheck;
  readonly ShieldX      = ShieldX;
  readonly ShieldAlert  = ShieldAlert;
  readonly CheckCircle  = CheckCircle;
  readonly Clock        = Clock;
  readonly AlertCircle  = AlertCircle;
  readonly FileText     = FileText;
  readonly ChevronRight = ChevronRight;
  readonly ArrowLeft    = ArrowLeft;
  readonly RefreshCw    = RefreshCw;

  profil    = signal<ProprietaireProfil | null>(null);
  isLoading = signal(true);
  errorMsg  = signal<string | null>(null);

  statut     = computed(() => this.profil()?.statut_verification ?? 'en_attente');
  documents  = computed(() => this.profil()?.documents ?? []);

  docLabels: Record<string, string> = {
    cni_recto:              'CNI Recto',
    cni_verso:              'CNI Verso',
    passeport:              'Passeport',
    justificatif_domicile:  'Justificatif de domicile',
    justificatif_propriete: 'Titre de propriété',
  };

  progression = computed(() => {
    const docs = this.documents();
    if (!docs.length) return 0;
    const valides = docs.filter(d => d.statut === 'valide').length;
    return Math.round((valides / docs.length) * 100);
  });

  constructor(private proprietaireService: ProprietaireService) {}

  ngOnInit() { this.load(); }

  load() {
    this.isLoading.set(true);
    this.proprietaireService.monProfil().subscribe({
      next:  (p) => { this.profil.set(p); this.isLoading.set(false); },
      error: ()  => { this.isLoading.set(false); this.errorMsg.set('Impossible de charger le profil.'); },
    });
  }

  statutLabel(s: string) {
    return ({ en_attente: 'En attente', valide: 'Validé', rejete: 'Rejeté', verifie: 'Vérifié' } as any)[s] ?? s;
  }

  formatDate(d: string | null): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  countByStatut(s: string) {
    return this.documents().filter(d => d.statut === s).length;
  }
}

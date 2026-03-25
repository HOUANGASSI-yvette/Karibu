import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, X, FileText, CheckCircle, Download, ExternalLink, Shield, Calendar, User, Home, AlertCircle } from 'lucide-angular';
import { BailService, BailDetail } from '../../services/bail.service';
import { ToastService } from '../toast.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-bail-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <!-- Overlay -->
    <div class="fixed inset-0 z-50 flex justify-end"
         (click)="onOverlayClick($event)">
      <div class="absolute inset-0 bg-stone-900/40"></div>

      <!-- Drawer -->
      <div class="relative bg-white w-full max-w-lg h-full flex flex-col shadow-2xl"
           (click)="$event.stopPropagation()">

        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50 flex-shrink-0">
          <div class="flex items-center gap-3">
            <lucide-icon [img]="FileTextIcon" class="w-5 h-5 text-amber-800"></lucide-icon>
            <div>
              <h2 class="text-base font-semibold text-stone-900">Contrat de bail</h2>
              <p class="text-xs text-stone-500">{{ bail?.logement_info?.title || 'Chargement…' }}</p>
            </div>
          </div>
          <button (click)="close.emit()"
                  class="w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors">
            <lucide-icon [img]="XIcon" class="w-4 h-4"></lucide-icon>
          </button>
        </div>

        <!-- Loading skeleton -->
        @if (isLoading) {
          <div class="flex-1 overflow-y-auto p-5 space-y-4 animate-pulse">
            <div class="h-12 bg-stone-100 border border-stone-200"></div>
            <div class="grid grid-cols-2 gap-3">
              <div class="h-20 bg-stone-100 border border-stone-200"></div>
              <div class="h-20 bg-stone-100 border border-stone-200"></div>
            </div>
            <div class="h-32 bg-stone-100 border border-stone-200"></div>
            <div class="h-24 bg-stone-100 border border-stone-200"></div>
            <div class="h-16 bg-stone-100 border border-stone-200"></div>
          </div>
        }

        <!-- Erreur -->
        @if (!isLoading && !bail) {
          <div class="flex-1 flex items-center justify-center">
            <div class="text-center space-y-2">
              <lucide-icon [img]="AlertIcon" class="w-8 h-8 text-stone-300 mx-auto"></lucide-icon>
              <p class="text-sm text-stone-500">Impossible de charger le contrat.</p>
              <button (click)="reload()"
                      class="text-xs text-amber-800 border border-amber-300 px-3 py-1.5 hover:bg-amber-50 transition-colors">
                Réessayer
              </button>
            </div>
          </div>
        }

        <!-- Contenu -->
        @if (!isLoading && bail) {
          <div class="flex-1 overflow-y-auto">

            <!-- Statut blockchain -->
            <div [class]="bail.tx_hash
              ? 'mx-5 mt-5 flex items-center gap-3 bg-green-50 border border-green-200 px-4 py-3'
              : 'mx-5 mt-5 flex items-center gap-3 bg-amber-50 border border-amber-200 px-4 py-3'">
              <lucide-icon [img]="ShieldIcon"
                           [class]="bail.tx_hash ? 'w-4 h-4 text-green-600 flex-shrink-0' : 'w-4 h-4 text-amber-600 flex-shrink-0'">
              </lucide-icon>
              <div class="flex-1 min-w-0">
                <p [class]="bail.tx_hash ? 'text-xs font-medium text-green-800' : 'text-xs font-medium text-amber-800'">
                  {{ bail.tx_hash ? 'Enregistré sur la blockchain' : "En attente d'enregistrement blockchain" }}
                </p>
                @if (bail.tx_hash) {
                  <p class="text-xs text-green-600 truncate font-mono mt-0.5">{{ bail.tx_hash }}</p>
                }
              </div>
              @if (bail.tx_hash) {
                <a [href]="'https://amoy.polygonscan.com/tx/' + bail.tx_hash" target="_blank"
                   class="flex items-center gap-1 text-xs text-green-700 hover:underline flex-shrink-0">
                  <lucide-icon [img]="ExternalIcon" class="w-3 h-3"></lucide-icon>
                  Vérifier
                </a>
              }
            </div>

            <div class="px-5 py-5 space-y-4">

              <!-- Parties -->
              <div class="grid grid-cols-2 gap-3">
                <div class="border border-stone-200 p-3">
                  <div class="flex items-center gap-1.5 mb-2">
                    <lucide-icon [img]="UserIcon" class="w-3 h-3 text-stone-400"></lucide-icon>
                    <span class="text-xs font-medium text-stone-500 uppercase tracking-wide">Propriétaire</span>
                  </div>
                  <p class="text-sm font-medium text-stone-900">
                    {{ bail.proprietaire_info?.first_name }} {{ bail.proprietaire_info?.last_name }}
                  </p>
                  <p class="text-xs text-stone-400 mt-0.5 truncate">{{ bail.proprietaire_info?.email }}</p>
                </div>
                <div class="border border-stone-200 p-3">
                  <div class="flex items-center gap-1.5 mb-2">
                    <lucide-icon [img]="UserIcon" class="w-3 h-3 text-stone-400"></lucide-icon>
                    <span class="text-xs font-medium text-stone-500 uppercase tracking-wide">Locataire</span>
                  </div>
                  <p class="text-sm font-medium text-stone-900">
                    {{ bail.locataire_info?.first_name }} {{ bail.locataire_info?.last_name }}
                  </p>
                  <p class="text-xs text-stone-400 mt-0.5 truncate">{{ bail.locataire_info?.email }}</p>
                </div>
              </div>

              <!-- Logement -->
              <div class="border border-stone-200 p-4">
                <div class="flex items-center gap-2 mb-3">
                  <lucide-icon [img]="HomeIcon" class="w-3.5 h-3.5 text-stone-400"></lucide-icon>
                  <span class="text-xs font-medium text-stone-500 uppercase tracking-wide">Logement</span>
                </div>
                <p class="text-sm font-semibold text-amber-800">{{ bail.logement_info?.title }}</p>
                <p class="text-xs text-stone-500 mt-0.5">{{ bail.logement_info?.city }}, {{ bail.logement_info?.district }}</p>
                <div class="grid grid-cols-3 gap-3 mt-4">
                  <div>
                    <p class="text-xs text-stone-400">Type</p>
                    <p class="text-sm font-medium text-stone-800">
                      {{ bail.type_bail === 'longue_duree' ? 'Longue durée'
                      : bail.type_bail === 'courte_duree' ? 'Courte durée' : 'Achat' }}
                    </p>
                  </div>
                  <div>
                    <p class="text-xs text-stone-400">Loyer</p>
                    <p class="text-sm font-medium text-stone-800">{{ bail.prix_total | number }} FCFA</p>
                  </div>
                  <div>
                    <p class="text-xs text-stone-400">Statut</p>
                    <span [class]="bail.statut === 'actif'
                      ? 'text-xs px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 inline-block'
                      : bail.statut === 'en_attente'
                        ? 'text-xs px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 inline-block'
                        : 'text-xs px-2 py-0.5 bg-stone-100 text-stone-600 border border-stone-200 inline-block'">
                      {{ bail.statut === 'actif' ? 'Actif'
                      : bail.statut === 'en_attente' ? 'En attente'
                        : bail.statut === 'signe' ? 'Signé' : bail.statut }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Dates -->
              <div class="border border-stone-200 p-4">
                <div class="flex items-center gap-2 mb-3">
                  <lucide-icon [img]="CalendarIcon" class="w-3.5 h-3.5 text-stone-400"></lucide-icon>
                  <span class="text-xs font-medium text-stone-500 uppercase tracking-wide">Période</span>
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <p class="text-xs text-stone-400">Début</p>
                    <p class="text-sm font-medium text-stone-800">{{ bail.date_debut | date:'dd/MM/yyyy' }}</p>
                  </div>
                  @if (bail.date_fin) {
                    <div>
                      <p class="text-xs text-stone-400">Fin</p>
                      <p class="text-sm font-medium text-stone-800">{{ bail.date_fin | date:'dd/MM/yyyy' }}</p>
                    </div>
                  }
                </div>
              </div>

              <!-- Signatures -->
              <div class="border border-stone-200 p-4">
                <p class="text-xs font-medium text-stone-500 uppercase tracking-wide mb-3">Signatures</p>
                <div class="flex items-center gap-8">
                  <div class="flex items-center gap-2">
                    <div [class]="bail.signe_proprietaire
                      ? 'w-5 h-5 bg-green-500 flex items-center justify-center'
                      : 'w-5 h-5 bg-stone-200 flex items-center justify-center'">
                      @if (bail.signe_proprietaire) {
                        <lucide-icon [img]="CheckIcon" class="w-3 h-3 text-white"></lucide-icon>
                      }
                    </div>
                    <span class="text-sm text-stone-700">Propriétaire</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <div [class]="bail.signe_locataire
                      ? 'w-5 h-5 bg-green-500 flex items-center justify-center'
                      : 'w-5 h-5 bg-stone-200 flex items-center justify-center'">
                      @if (bail.signe_locataire) {
                        <lucide-icon [img]="CheckIcon" class="w-3 h-3 text-white"></lucide-icon>
                      }
                    </div>
                    <span class="text-sm text-stone-700">Locataire</span>
                  </div>
                </div>
              </div>

              <!-- Zone signature -->
              @if (canSign) {
                <div class="border-2 border-amber-300 bg-amber-50 p-4">
                  <p class="text-sm font-medium text-amber-900 mb-1">Votre signature est requise</p>
                  <p class="text-xs text-amber-700 mb-4">
                    Cliquez sur "Signer" pour apposer votre signature électronique sur ce contrat.
                  </p>
                  <button (click)="sign()"
                          [disabled]="isSigning"
                          class="w-full py-2.5 bg-amber-800 text-white text-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                    @if (isSigning) {
                      <div class="w-3.5 h-3.5 border-2 border-white border-t-transparent animate-spin"></div>
                    }
                    {{ isSigning ? 'Signature en cours…' : 'Signer le contrat' }}
                  </button>
                </div>
              }

              @if (bail.statut === 'actif' || bail.statut === 'signe') {
                <div class="bg-green-50 border border-green-200 px-4 py-3 flex items-center gap-3">
                  <lucide-icon [img]="CheckIcon" class="w-4 h-4 text-green-600 flex-shrink-0"></lucide-icon>
                  <p class="text-sm text-green-800">Ce bail est signé par les deux parties et actif.</p>
                </div>
              }

            </div>
          </div>

          <!-- Footer -->
          <div class="border-t border-stone-200 px-5 py-4 flex items-center justify-between bg-stone-50 flex-shrink-0">
            <p class="text-xs text-stone-400">Bail #{{ bail.id }}</p>
            <div class="flex gap-2">
              <button (click)="downloadPdf()"
                      [disabled]="bail.statut === 'en_attente' || isDownloading"
                      class="flex items-center gap-2 px-4 py-2 border border-stone-200 text-stone-600 text-sm hover:border-stone-400 hover:text-stone-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                @if (isDownloading) {
                  <div class="w-4 h-4 border-2 border-stone-400 border-t-transparent animate-spin"></div>
                  Génération…
                } @else {
                  <lucide-icon [img]="DownloadIcon" class="w-4 h-4"></lucide-icon>
                  PDF
                }
              </button>
              <button (click)="close.emit()"
                      class="px-4 py-2 bg-stone-800 text-white text-sm hover:bg-stone-700 transition-colors">
                Fermer
              </button>
            </div>
          </div>
        }

      </div>
    </div>
  `,
})
export class BailModalComponent implements OnInit {
  @Input() bailId!: number;
  @Output() close  = new EventEmitter<void>();
  @Output() signed = new EventEmitter<BailDetail>();

  readonly XIcon        = X;
  readonly FileTextIcon = FileText;
  readonly CheckIcon    = CheckCircle;
  readonly DownloadIcon = Download;
  readonly ExternalIcon = ExternalLink;
  readonly ShieldIcon   = Shield;
  readonly CalendarIcon = Calendar;
  readonly UserIcon     = User;
  readonly HomeIcon     = Home;
  readonly AlertIcon    = AlertCircle;

  bail: BailDetail | null = null;
  isLoading    = true;
  isSigning    = false;
  isDownloading = false;

  constructor(
    private bailService: BailService,
    private toast: ToastService,
    public  authService: AuthService,
  ) {}

  ngOnInit() { this.reload(); }

  reload() {
    this.isLoading = true;
    this.bail = null;
    this.bailService.getBail(this.bailId).subscribe({
      next:  (b) => { this.bail = b; this.isLoading = false; },
      error: ()  => { this.isLoading = false; this.toast.error('Impossible de charger le contrat.'); }
    });
  }

  get canSign(): boolean {
    if (!this.bail) return false;
    if (this.bail.statut !== 'en_attente') return false;
    const userId = this.authService.getCurrentUser()?.id;
    if (userId === this.bail.proprietaire && !this.bail.signe_proprietaire) return true;
    if (userId === this.bail.locataire   && !this.bail.signe_locataire)    return true;
    return false;
  }

  sign() {
    if (!this.bail) return;
    this.isSigning = true;
    this.bailService.signerBail(this.bail.id).subscribe({
      next: (updated) => {
        this.bail     = updated;
        this.isSigning = false;
        this.toast.success('Contrat signé avec succès.');
        this.signed.emit(updated);
      },
      error: (err) => {
        this.isSigning = false;
        this.toast.error(err?.error?.detail || 'Erreur lors de la signature.');
      }
    });
  }

  downloadPdf() {
    if (!this.bail || this.isDownloading) return;
    this.isDownloading = true;
    this.bailService.telechargerPdf(this.bail.id).subscribe({
      next: (blob) => {
        const typeLabels: Record<string, string> = {
          longue_duree: 'bail-longue-duree',
          courte_duree: 'location-courte-duree',
          achat:        'contrat-vente',
        };
        const slug = typeLabels[this.bail!.type_bail] ?? 'contrat';
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `${slug}-${this.bail!.id}-${this.bail!.logement_info?.city ?? 'city'}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        this.isDownloading = false;
      },
      error: () => {
        this.isDownloading = false;
        this.toast.error('Erreur lors du téléchargement du PDF.');
      }
    });
  }

  onOverlayClick(e: MouseEvent) {
    if ((e.target as HTMLElement) === e.currentTarget) this.close.emit();
  }
}

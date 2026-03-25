import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../shared/navbar/navbar';
import { PropertyService } from '../../services/property.service';
import { Property, PropertyPhoto, PropertyAmenity, getCoverPhoto } from '../../models/property.model';
import { AuthService } from '../../services/auth.service';
import { BailService, BailCreate, BailDetail } from '../../services/bail.service';
import { ChatService } from '../../services/chat.service';
import {
  LucideAngularModule, WifiOff, ChevronLeft, ChevronRight, Shield, MessageSquare, Check, Download, ExternalLink,
  SendIcon, CalendarIcon
} from 'lucide-angular';
import { ToastService } from '../../shared/toast.service';
import { ReservationService } from '../../services/reservation.service';

type ReservationStep = 'idle' | 'form' | 'waiting' | 'signing' | 'success';

@Component({
  selector: 'app-property-detail',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, NavbarComponent, LucideAngularModule],
  templateUrl: './property-detail.html',
})
export class PropertyDetailComponent implements OnInit, OnDestroy {
  readonly OfflineIcon = WifiOff;
  readonly PrevIcon = ChevronLeft;
  readonly NextIcon = ChevronRight;
  readonly ShieldIcon = Shield;
  readonly MessageIcon = MessageSquare;
  readonly CheckIcon = Check;
  readonly DownloadIcon = Download;
  readonly ExternalIcon = ExternalLink;

  property: Property | null = null;
  isLoading = true;
  errorMessage = '';
  activePhotoIndex = 0;


  isContactLoading  = false;
  showRequestModal  = false;
  requestMessage    = '';
  requestVisitDate  = '';

  // Réservation
  step: ReservationStep = 'idle';
  typeBail: 'longue_duree' | 'courte_duree' | 'achat' = 'longue_duree';
  dateDebut = '';
  dateFin = '';
  prixTotal = 0;
  chargesIncluses = false;
  depotGarantie = 0;

  createdBail: BailDetail | null = null;
  isSubmitting = false;
  reservationError = '';

  today = new Date().toISOString().split('T')[0];

  private bailPollingTimer: any = null;

  typeLabels: Record<string, string> = {
    apartment: 'Appartement',
    house: 'Maison',
    studio: 'Studio',
    villa: 'Villa',
    office: 'Bureau',
    land: 'Terrain',
    commercial: 'Local commercial',
    appartement: 'Appartement',
    maison: 'Maison',
    chambre: 'Chambre',
  };

  typeBailLabels: Record<string, string> = {
    longue_duree: 'Location longue durée',
    courte_duree: 'Location courte durée',
    achat: 'Achat',
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private propertyService: PropertyService,
    private authService: AuthService,
    private bailService: BailService,
    private chatService: ChatService,
    private cdr: ChangeDetectorRef,
    private toast: ToastService,
    private reservationService: ReservationService,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { void this.router.navigate(['/listings']); return; }
    this.loadProperty(Number(id));

    // If navigated back with a roomId, handled in messages page (not here)
  }

  ngOnDestroy() {
    if (this.bailPollingTimer) {
      clearInterval(this.bailPollingTimer);
      this.bailPollingTimer = null;
    }
  }

  loadProperty(id: number) {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.propertyService.getPropertyById(id).subscribe({
      next: (data: Property) => {
        this.property = data;
        this.prixTotal = data.price;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: { status: number }) => {
        this.errorMessage = err.status === 404 ? 'Ce logement est introuvable.' : 'Impossible de charger cette annonce.';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  contactOwner() {
     const ownerId = this.property?.owner ?? this.property?.ownerId;
     if (!ownerId) return;
     this.isContactLoading = true;
     // getOrCreateRoom attend un USER ID, pas un room ID
     this.chatService.getOrCreateRoom(Number(ownerId)).subscribe({
       next:  (room) => {
           // Naviguer avec ?userId=X OU ?roomId=room.id
           // Préférer roomId car la room est déjà créée ici
           this.router.navigate(['/messages'], { queryParams: { roomId: room.id } });
         },
       error: () => {
         this.isContactLoading = false;
           this.toast.error('Impossible d\'ouvrir la messagerie.');
         }
     });
   }

  sendRequest() {
    if (!this.property?.id) return;
    this.isContactLoading = true;
    this.reservationService.createRequest({
      property_id: this.property.id,
      visit_date:  this.requestVisitDate || undefined,
      message:     this.requestMessage   || undefined,
    }).subscribe({
      next: () => {
        this.showRequestModal = false;
        this.isContactLoading = false;
        this.toast.success('Demande envoyée au propriétaire.');
      },
      error: () => {
        this.isContactLoading = false;
        this.toast.error('Erreur lors de l\'envoi de la demande.');
      }
    });
  }

  // Photos / amenities helpers (identique à ton code)
  get normalizedPhotos(): PropertyPhoto[] {
    if (!this.property?.photos?.length) return [];
    if (typeof this.property.photos[0] === 'string') {
      return (this.property.photos as string[]).map((url, i) => ({ id: i, url, order: i, uploaded_at: '' }));
    }
    return this.property.photos as PropertyPhoto[];
  }

  get normalizedAmenities(): PropertyAmenity[] {
    if (!this.property?.amenities?.length) return [];
    if (typeof this.property.amenities[0] === 'string') {
      return (this.property.amenities as string[]).map((name, i) => ({ id: i, name }));
    }
    return this.property.amenities as PropertyAmenity[];
  }

  get activePhotoUrl(): string {
    if (!this.property) return '';
    const photos = this.normalizedPhotos;
    if (photos.length) return photos[this.activePhotoIndex]?.url ?? '';
    return getCoverPhoto(this.property);
  }

  get totalPhotos(): number { return this.normalizedPhotos.length; }
  selectPhoto(index: number) { this.activePhotoIndex = index; }
  prevPhoto() {
    if (!this.totalPhotos) return;
    this.activePhotoIndex = (this.activePhotoIndex - 1 + this.totalPhotos) % this.totalPhotos;
  }
  nextPhoto() {
    if (!this.totalPhotos) return;
    this.activePhotoIndex = (this.activePhotoIndex + 1) % this.totalPhotos;
  }

  // Réservation flow
  get requiresDateFin(): boolean { return this.typeBail !== 'achat'; }
  get isFormValid(): boolean {
    return !!this.dateDebut && (this.typeBail === 'achat' || !!this.dateFin) && this.prixTotal > 0;
  }

  openForm() {
    const user = this.authService.getCurrentUser();
    if (!user) { void this.router.navigate(['/login']); return; }
    this.step = 'form';
    this.reservationError = '';
  }

  submitReservation() {
    if (!this.property || !this.isFormValid) return;

    this.isSubmitting = true;
    this.reservationError = '';

    const payload: BailCreate = {
      logement: this.property.id,
      type_bail: this.typeBail,
      date_debut: this.dateDebut,
      prix_total: this.prixTotal,
      charges_incluses: this.chargesIncluses,
      depot_garantie: this.depotGarantie,
    };
    if (this.typeBail !== 'achat' && this.dateFin) payload.date_fin = this.dateFin;

    this.bailService.creerBail(payload).subscribe({
      next: (bail) => {
        this.createdBail = bail;
        this.isSubmitting = false;
        // On attend l'acceptation du propriétaire
        this.step = 'waiting';
        this.cdr.detectChanges();
        this.startBailPolling(bail.id);
      },
      error: (err) => {
        this.reservationError = err?.error?.detail ?? 'Une erreur est survenue. Veuillez réessayer.';
        this.isSubmitting = false;
        this.cdr.detectChanges();
      },
    });
  }

  startBailPolling(bailId: number, intervalMs = 3000, maxAttempts = 240) {
    let attempts = 0;
    if (this.bailPollingTimer) clearInterval(this.bailPollingTimer);
    this.bailPollingTimer = setInterval(() => {
      attempts++;
      this.bailService.getBail(bailId).subscribe({
        next: (bail) => {
          this.createdBail = bail;
          // si proprio a accepté mais locataire pas encore signé -> proposer signature
          if (bail.signe_proprietaire && !bail.signe_locataire) {
            clearInterval(this.bailPollingTimer);
            this.bailPollingTimer = null;
            this.step = 'signing';
            this.cdr.detectChanges();
            return;
          }
          // si bail activé/resilié/annulé -> arrêter et afficher résultat
          if (['actif', 'resilie', 'annule', 'termine'].includes(bail.statut)) {
            clearInterval(this.bailPollingTimer);
            this.bailPollingTimer = null;
            if (bail.statut === 'actif') {
              this.step = 'success';
              // ouvrir chat room automatiquement
              this.openChatWithOwner(bail);
            } else {
              this.step = 'idle';
            }
            this.cdr.detectChanges();
          }
        },
        error: () => { /* ignore transient */ }
      });

      if (attempts >= maxAttempts) {
        clearInterval(this.bailPollingTimer);
        this.bailPollingTimer = null;
      }
    }, intervalMs);
  }

  submitSignature() {
    if (!this.createdBail) return;
    this.isSubmitting = true;
    this.reservationError = '';

    // Appel sans token : backend autorise la signature locataire si proprio a signé
    this.bailService.signerBail(this.createdBail.id).subscribe({
      next: (bail) => {
        this.createdBail = bail;
        this.isSubmitting = false;
        if (bail.statut === 'actif') {
          this.step = 'success';
          this.openChatWithOwner(bail);
        } else {
          // si pas encore activé (ex: on-chain pending), revenir à waiting et relancer polling
          this.step = 'waiting';
          this.startBailPolling(bail.id);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.reservationError = err?.error?.detail ?? 'Impossible de signer pour le moment.';
        this.isSubmitting = false;
        this.cdr.detectChanges();
      }
    });
  }

  openChatWithOwner(bail: BailDetail) {
    // best-effort : utilise ChatService.getOrCreateRoom(userId)
    this.chatService.getOrCreateRoom(bail.proprietaire).subscribe({
      next: (room) => {
        // naviguer vers messages et sélectionner la room (query param)
        void this.router.navigate(['/messages'], { queryParams: { roomId: room.id } });
      },
      error: () => {
        // ignore silently
      }
    });
  }

  downloadContract() {
    if (!this.createdBail) return;
    this.bailService.downloadPdf(this.createdBail);
  }

  resetForm() {
    this.step = 'idle';
    this.reservationError = '';
    this.createdBail = null;
    if (this.bailPollingTimer) {
      clearInterval(this.bailPollingTimer);
      this.bailPollingTimer = null;
    }
  }

  // Helpers
  get ownerInitial(): string {
    return this.property?.owner_name?.charAt(0)?.toUpperCase() || '?';
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR').format(price);
  }

  onImageError(event: Event) {
    (event.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200';
  }

  protected readonly SendIcon = SendIcon;
  protected readonly CalendarIcon = CalendarIcon;
}

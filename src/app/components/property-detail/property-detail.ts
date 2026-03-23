import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../shared/navbar/navbar';
import { PropertyService, Property } from '../../services/property.service';
import { AuthService } from '../../services/auth.service';
import { LucideAngularModule, WifiOff, ChevronLeft, ChevronRight, Shield, MessageSquare, Check } from 'lucide-angular';

@Component({
  selector: 'app-property-detail',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, NavbarComponent, LucideAngularModule],
  templateUrl: './property-detail.html',
})
export class PropertyDetailComponent implements OnInit {

  readonly OfflineIcon  = WifiOff;
  readonly PrevIcon     = ChevronLeft;
  readonly NextIcon     = ChevronRight;
  readonly ShieldIcon   = Shield;
  readonly MessageIcon  = MessageSquare;
  readonly CheckIcon    = Check;

  property:    Property | null = null;
  isLoading    = true;
  errorMessage = '';

  activePhotoIndex    = 0;
  showReservationForm = false;
  reservationMessage  = '';
  visitDate           = '';
  isSubmitting        = false;
  reservationSuccess  = false;
  reservationError    = '';

  today = new Date().toISOString().split('T')[0];

  typeLabels: Record<string, string> = {
    apartment:  'Appartement',
    house:      'Maison',
    studio:     'Studio',
    villa:      'Villa',
    office:     'Bureau',
    land:       'Terrain',
    commercial: 'Local commercial',
  };

  constructor(
    private route:           ActivatedRoute,
    private router:          Router,
    private propertyService: PropertyService,
    private authService:     AuthService,
    private cdr:             ChangeDetectorRef
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/listings']);
      return;
    }
    this.loadProperty(Number(id));
  }

  loadProperty(id: number) {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.propertyService.getPropertyById(id).subscribe({
      next: (data) => {
        this.property  = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err.status === 404
          ? 'Ce logement est introuvable.'
          : 'Impossible de charger cette annonce.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Galerie photos ────────────────────────────────────────

  get activePhotoUrl(): string {
    if (!this.property) return '';
    const photos = this.property.photos;
    if (!photos?.length) return this.property.cover_photo || '';
    return photos[this.activePhotoIndex]?.url || this.property.cover_photo || '';
  }

  get totalPhotos(): number {
    return this.property?.photos?.length ?? 0;
  }

  selectPhoto(index: number) { this.activePhotoIndex = index; }

  prevPhoto() {
    if (!this.totalPhotos) return;
    this.activePhotoIndex = (this.activePhotoIndex - 1 + this.totalPhotos) % this.totalPhotos;
  }

  nextPhoto() {
    if (!this.totalPhotos) return;
    this.activePhotoIndex = (this.activePhotoIndex + 1) % this.totalPhotos;
  }

  // ── Réservation ───────────────────────────────────────────

  submitReservation() {
    if (!this.property) return;
    this.isSubmitting    = true;
    this.reservationError = '';

    const user = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    // ⚠️ Ton backend n'a pas encore d'endpoint réservation exposé
    // Adapte quand tu l'ajoutes — pour l'instant on simule
    setTimeout(() => {
      this.reservationSuccess = true;
      this.showReservationForm = false;
      this.isSubmitting = false;
      this.cdr.detectChanges();
    }, 800);
  }

  // ── Helpers ───────────────────────────────────────────────

  get ownerInitial(): string {
    return this.property?.owner_name?.charAt(0)?.toUpperCase() || '?';
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR').format(price);
  }

  onImageError(event: Event) {
    (event.target as HTMLImageElement).src =
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200';
  }
}

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../shared/navbar/navbar';
import { PropertyService } from '../../services/property.service';
import {
  Property,
  PropertyPhoto,
  PropertyAmenity,
  getCoverPhoto,
} from '../../models/property.model';
import { AuthService } from '../../services/auth.service';
import {
  LucideAngularModule,
  WifiOff, ChevronLeft, ChevronRight,
  Shield, MessageSquare, Check,
} from 'lucide-angular';

@Component({
  selector: 'app-property-detail',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, NavbarComponent, LucideAngularModule],
  templateUrl: './property-detail.html',
})
export class PropertyDetailComponent implements OnInit {

  readonly OfflineIcon = WifiOff;
  readonly PrevIcon    = ChevronLeft;
  readonly NextIcon    = ChevronRight;
  readonly ShieldIcon  = Shield;
  readonly MessageIcon = MessageSquare;
  readonly CheckIcon   = Check;

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
    apartment:   'Appartement',
    house:       'Maison',
    studio:      'Studio',
    villa:       'Villa',
    office:      'Bureau',
    land:        'Terrain',
    commercial:  'Local commercial',
    appartement: 'Appartement',
    maison:      'Maison',
    chambre:     'Chambre',
  };

  constructor(
    private route:           ActivatedRoute,
    private router:          Router,
    private propertyService: PropertyService,
    private authService:     AuthService,
    private cdr:             ChangeDetectorRef,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { void this.router.navigate(['/listings']); return; }
    this.loadProperty(Number(id));
  }

  loadProperty(id: number) {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.propertyService.getPropertyById(id).subscribe({
      next: (data: Property) => {
        this.property  = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: { status: number }) => {
        this.errorMessage = err.status === 404
          ? 'Ce logement est introuvable.'
          : 'Impossible de charger cette annonce.';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  // ── Données normalisées pour les templates ────────────────
  // Le template ne voit jamais string[] | PropertyPhoto[] :
  // il reçoit toujours PropertyPhoto[] ou PropertyAmenity[].

  get normalizedPhotos(): PropertyPhoto[] {
    if (!this.property?.photos?.length) return [];
    if (typeof this.property.photos[0] === 'string') {
      return (this.property.photos as string[]).map((url, i) => ({
        id: i,
        url,
        order: i,
        uploaded_at: '',
      }));
    }
    return this.property.photos as PropertyPhoto[];
  }

  get normalizedAmenities(): PropertyAmenity[] {
    if (!this.property?.amenities?.length) return [];
    if (typeof this.property.amenities[0] === 'string') {
      return (this.property.amenities as string[]).map((name, i) => ({
        id: i,
        name,
      }));
    }
    return this.property.amenities as PropertyAmenity[];
  }

  // ── Galerie ───────────────────────────────────────────────

  get activePhotoUrl(): string {
    if (!this.property) return '';
    const photos = this.normalizedPhotos;
    if (photos.length) return photos[this.activePhotoIndex]?.url ?? '';
    return getCoverPhoto(this.property);
  }

  get totalPhotos(): number {
    return this.normalizedPhotos.length;
  }

  selectPhoto(index: number) { this.activePhotoIndex = index; }

  prevPhoto() {
    if (!this.totalPhotos) return;
    this.activePhotoIndex =
      (this.activePhotoIndex - 1 + this.totalPhotos) % this.totalPhotos;
  }

  nextPhoto() {
    if (!this.totalPhotos) return;
    this.activePhotoIndex =
      (this.activePhotoIndex + 1) % this.totalPhotos;
  }

  // ── Réservation ───────────────────────────────────────────

  submitReservation() {
    if (!this.property) return;
    this.isSubmitting     = true;
    this.reservationError = '';

    const user = this.authService.getCurrentUser();
    if (!user) { void this.router.navigate(['/login']); return; }

    setTimeout(() => {
      this.reservationSuccess  = true;
      this.showReservationForm = false;
      this.isSubmitting        = false;
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

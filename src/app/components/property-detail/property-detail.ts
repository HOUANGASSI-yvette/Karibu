import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Property, PROPERTY_TYPE_LABELS } from '../../models/property.model';
import { PropertyService } from '../../services/property';

// ============================================================
// COMPOSANT : PropertyDetailComponent  —  route: /property/:id
// ============================================================
// Page de détail d'un bien immobilier.
// Récupère l'ID depuis l'URL, charge les détails via le service,
// et gère la demande de réservation.
//
// ⚠️ INTÉGRATION API :
//   → getPropertyById(id)   : activer bloc "API RÉELLE" dans service
//   → createReservation()   : activer bloc "API RÉELLE" dans service
//   → Ajouter l'ID utilisateur connecté depuis AuthService :
//     this.authService.currentUser.id  → passé dans reservationData.tenantId
// ============================================================

@Component({
  selector: 'app-property-detail',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './property-detail.html',
})
export class PropertyDetailComponent implements OnInit {

  property: Property | null = null;
  isLoading = true;
  errorMessage = '';

  // Photo actuellement affichée en grand
  activePhotoIndex = 0;

  // États du formulaire de réservation
  showReservationForm = false;
  reservationMessage = '';
  visitDate = '';
  isSubmitting = false;
  reservationSuccess = false;
  reservationError = '';

  // Labels traduits
  typeLabels = PROPERTY_TYPE_LABELS;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private propertyService: PropertyService
  ) {}

  ngOnInit() {
    // Récupérer l'ID depuis l'URL (/property/:id)
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/listings']);
      return;
    }
    this.loadProperty(id);
  }

  loadProperty(id: string) {
    this.isLoading = true;

    // ⚠️ API: PropertyService.getPropertyById() appellera GET /properties/:id
    this.propertyService.getPropertyById(id).subscribe({
      next: (data) => {
        if (!data) {
          this.errorMessage = 'Ce logement est introuvable.';
        } else {
          this.property = data;
        }
        this.isLoading = false;
      },
      error: (err) => {
        // ⚠️ API: gérer les codes HTTP ici
        //         404 → "Annonce introuvable"
        //         401 → rediriger vers login
        console.error('Erreur chargement propriété:', err);
        this.errorMessage = 'Impossible de charger cette annonce.';
        this.isLoading = false;
      }
    });
  }

  // ----------------------------------------------------------
  // Navigation dans la galerie photos
  // ----------------------------------------------------------
  selectPhoto(index: number) {
    this.activePhotoIndex = index;
  }

  prevPhoto() {
    if (!this.property) return;
    this.activePhotoIndex =
      (this.activePhotoIndex - 1 + this.property.photos.length) % this.property.photos.length;
  }

  nextPhoto() {
    if (!this.property) return;
    this.activePhotoIndex = (this.activePhotoIndex + 1) % this.property.photos.length;
  }

  // ----------------------------------------------------------
  // Soumettre la demande de réservation
  // ----------------------------------------------------------
  submitReservation() {
    if (!this.property) return;
    this.isSubmitting = true;
    this.reservationError = '';

    // ⚠️ API: remplacer 'current-user-id' par l'ID réel depuis AuthService
    //         ex: this.authService.currentUser?.id
    this.propertyService.createReservation({
      propertyId: this.property.id,
      tenantId: 'current-user-id', // ⚠️ À remplacer par l'ID utilisateur connecté
      visitDate: this.visitDate || undefined,
      message: this.reservationMessage || undefined,
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.reservationSuccess = true;
          this.showReservationForm = false;
        } else {
          this.reservationError = 'Une erreur est survenue. Veuillez réessayer.';
        }
        this.isSubmitting = false;
      },
      error: (err) => {
        // ⚠️ API: gérer les codes HTTP ici
        //         409 → "Vous avez déjà une demande en cours pour ce bien"
        //         401 → "Vous devez être connecté"
        console.error('Erreur réservation:', err);
        this.reservationError = 'Impossible d\'envoyer la demande. Réessayez plus tard.';
        this.isSubmitting = false;
      }
    });
  }

  // Formater le prix
  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR').format(price);
  }

  // Gérer l'erreur d'image
  onImageError(event: Event) {
    (event.target as HTMLImageElement).src =
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200';
  }
}
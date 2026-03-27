// ============================================================
// publish-property.component.ts  —  Orchestrateur
// Route : /publish
// ============================================================
// Gère uniquement : navigation, état du formulaire, soumission.
// Chaque étape est déléguée à un sous-composant dédié.
// ============================================================

import {Component, OnDestroy} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {CommonModule} from '@angular/common';
import {PhotoPreview, PROPERTY_TYPE_LABELS, PropertyType} from '../../models/property.model';
import {PropertyService} from '../../services/property.service';
import {ToastService} from '../../shared/toast.service';
import {StepIndicatorComponent} from './steps/step-indicator.component';
import {StepLocationComponent} from './steps/step-location.component';
import {StepDetailsComponent} from './steps/step-details.component';
import {StepPhotosComponent} from './steps/step-photos.component';
import {StepPriceComponent} from './steps/step-price.component';
import {StepSummaryComponent} from './steps/step-summary.component';

// Ré-exporté pour que les sous-composants puissent l'importer depuis l'orchestrateur
export type {PhotoPreview};

@Component({
  selector: 'app-publish-property',
  standalone: true,
  imports: [
    RouterLink,
    CommonModule,
    StepIndicatorComponent,
    StepLocationComponent,
    StepDetailsComponent,
    StepPhotosComponent,
    StepPriceComponent,
    StepSummaryComponent,
  ],
  templateUrl: './publish-property.html',
})
export class PublishPropertyComponent implements OnDestroy {

  // ── Navigation ─────────────────────────────────────────
  currentStep = 1;
  readonly totalSteps = 5;
  readonly steps = [
    {num: 1, label: 'Localisation'},
    {num: 2, label: 'Détails'},
    {num: 3, label: 'Photos'},
    {num: 4, label: 'Prix'},
    {num: 5, label: 'Récap.'},
  ];

  // ── Données statiques ──────────────────────────────────
  readonly propertyTypes = Object.entries(PROPERTY_TYPE_LABELS) as [PropertyType, string][];
  readonly cities = ['Lomé', 'Kara', 'Kpalimé', 'Sokodé', 'Atakpamé', 'Dapaong', 'Tsévié', 'Notsé'];
  readonly availableAmenities = [
    'WiFi', 'Climatisation', 'Meublé', 'Parking', 'Gardien',
    'Piscine', 'Jardin', 'Groupe électrogène', 'Eau courante',
    'Cuisine équipée', 'Terrasse', 'Ascenseur', 'Sécurité 24h',
  ];

  // ── Formulaire ─────────────────────────────────────────
  form = {
    title: '',
    type: '' as PropertyType | '',
    city: '',
    district: '',
    address: '',
    description: '',
    surface: 0,
    rooms: 1,
    bedrooms: 1,
    bathrooms: 1,
    amenities: [] as string[],
    price: 0,
    chargesIncluded: false,
    available: true,
    availableFrom: '',
  };

  // ── Photos ─────────────────────────────────────────────
  photos: PhotoPreview[] = [];
  photoError = '';
  readonly MAX_PHOTOS = 8;
  readonly MAX_SIZE_MB = 5;

  // ── États UI ───────────────────────────────────────────
  isSubmitting = false;
  errorMessage = '';
  stepErrors: Record<number, string> = {};

  constructor(
    private router: Router,
    private propertyService: PropertyService,
    private toast: ToastService,
  ) {
  }

  // ── Navigation ─────────────────────────────────────────
  nextStep() {
    if (!this.validateStep(this.currentStep)) return;
    if (this.currentStep < this.totalSteps) this.currentStep++;
  }

  prevStep() {
    if (this.currentStep > 1) this.currentStep--;
  }

  goToStep(step: number) {
    if (step < this.currentStep) this.currentStep = step;
  }

  // ── Validation ─────────────────────────────────────────
  validateStep(step: number): boolean {
    this.stepErrors[step] = '';
    switch (step) {
      case 1:
        if (!this.form.title.trim()) {
          this.stepErrors[1] = 'Le titre est obligatoire.';
          return false;
        }
        if (!this.form.type) {
          this.stepErrors[1] = 'Choisissez un type de bien.';
          return false;
        }
        if (!this.form.city) {
          this.stepErrors[1] = 'Sélectionnez une ville.';
          return false;
        }
        if (!this.form.district.trim()) {
          this.stepErrors[1] = 'Le quartier est obligatoire.';
          return false;
        }
        if (!this.form.description.trim()) {
          this.stepErrors[1] = 'La description est obligatoire.';
          return false;
        }
        return true;
      case 2:
        if (!this.form.surface || this.form.surface < 5) {
          this.stepErrors[2] = 'La surface doit être supérieure à 5 m².';
          return false;
        }
        if (!this.form.rooms || this.form.rooms < 1) {
          this.stepErrors[2] = 'Le nombre de pièces est obligatoire.';
          return false;
        }
        return true;
      case 3:
        if (this.photos.length === 0) {
          this.stepErrors[3] = 'Ajoutez au moins une photo.';
          return false;
        }
        return true;
      case 4:
        if (!this.form.price || this.form.price < 1000) {
          this.stepErrors[4] = 'Le loyer doit être supérieur à 1 000 CFA.';
          return false;
        }
        if (!this.form.available && !this.form.availableFrom) {
          this.stepErrors[4] = 'Précisez la date de disponibilité.';
          return false;
        }
        return true;
      default:
        return true;
    }
  }

  // ── Équipements ────────────────────────────────────────
  toggleAmenity(amenity: string) {
    const idx = this.form.amenities.indexOf(amenity);
    if (idx === -1) this.form.amenities.push(amenity);
    else this.form.amenities.splice(idx, 1);
  }

  // ── Photos ─────────────────────────────────────────────
  addFiles(files: File[]) {
    this.photoError = '';
    const images = files.filter(f => f.type.startsWith('image/'));
    if (!images.length) {
      this.photoError = 'Seules les images sont acceptées.';
      return;
    }

    for (const file of images) {
      if (this.photos.length >= this.MAX_PHOTOS) {
        this.photoError = `Maximum ${this.MAX_PHOTOS} photos autorisées.`;
        break;
      }
      const sizeMb = file.size / (1024 * 1024);
      if (sizeMb > this.MAX_SIZE_MB) {
        this.photoError = `"${file.name}" dépasse ${this.MAX_SIZE_MB} Mo.`;
        continue;
      }
      this.photos.push({
        file,
        url: URL.createObjectURL(file),
        name: file.name,
        size: sizeMb < 1 ? `${Math.round(file.size / 1024)} Ko` : `${sizeMb.toFixed(1)} Mo`,
      });
    }
  }

  removePhoto(index: number) {
    URL.revokeObjectURL(this.photos[index].url);
    this.photos.splice(index, 1);
  }

  setCover(index: number) {
    if (index === 0) return;
    const [item] = this.photos.splice(index, 1);
    this.photos.unshift(item);
  }

  // ── Utilitaires ────────────────────────────────────────
  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR').format(price);
  }

  getTypeLabel(type: PropertyType | ''): string {
    if (!type) return '—';
    return PROPERTY_TYPE_LABELS[type] ?? type;
  }


  onSubmit() {
    if (!this.validateStep(4)) return;
    this.isSubmitting = true;
    this.errorMessage = '';

    const payload = {
      title: this.form.title,
      type: this.form.type,
      city: this.form.city,
      district: this.form.district,
      address: this.form.address,
      description: this.form.description,
      surface: this.form.surface,
      rooms: this.form.rooms,
      bedrooms: this.form.bedrooms,
      bathrooms: this.form.bathrooms,
      amenities: this.form.amenities,
      price: this.form.price,
      chargesIncluded: this.form.chargesIncluded,
      available: this.form.available,
      availableFrom: this.form.availableFrom || undefined,
    };

    this.propertyService
      .create(payload as any, this.photos.map(p => p.file))
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.toast.success('Votre bien a été publié avec succès !');
          void this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.isSubmitting = false;

          const message = this.parseError(err);
          this.toast.error(message);
          console.error('DRF error:', err.error);
        },
      });
  }

  private parseError(err: any): string {
    const body = err?.error;
    if (!body) return 'Une erreur est survenue.';
    if (body?.error?.message) return body.error.message;

    if (typeof body?.detail === 'string') return body.detail;
    if (Array.isArray(body?.non_field_errors)) return body.non_field_errors[0];

    const firstField = Object.keys(body)[0];
    if (firstField) {
      const val = body[firstField];
      const msg = Array.isArray(val) ? val[0] : val;
      return `${firstField} : ${msg}`;
    }

    return 'Une erreur est survenue.';
  }

  ngOnDestroy() {
    this.photos.forEach(p => URL.revokeObjectURL(p.url));
  }
}

// ============================================================
// edit-property-panel.component.ts
// Drawer latéral pour modifier une propriété existante
// Usage : <app-edit-property-panel (saved)="onSaved()" (closed)="..." />
//         puis appeler panel.open(property) depuis le parent
// ============================================================

import { Component, signal, inject, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PropertyService } from '../../../../../services/property.service';
import { Property, PropertyType, PROPERTY_TYPE_LABELS, PhotoPreview } from '../../../../../models/property.model';
import { ToastService } from '../../../../../shared/toast.service'; // adapter chemin si besoin

// Ajoute en haut du fichier, après les imports
type Tab = 'infos' | 'photos' | 'prix';

@Component({
  selector: 'app-edit-property-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-property-panel.component.html',
})
export class EditPropertyPanelComponent implements OnDestroy {

  private propertyService = inject(PropertyService);
  private toast           = inject(ToastService);

  @Output() saved  = new EventEmitter<Property>();
  @Output() closed = new EventEmitter<void>();

  // ── État du panel ──────────────────────────────────────
  isOpen      = signal(false);
  isLoading   = signal(false);
  isSaving    = signal(false);
  errorMsg    = signal('');
  propertyId = signal<number | null>(null);
  // ID typé explicitement pour éviter string | number

  // ── Données statiques ──────────────────────────────────
  readonly propertyTypes = Object.entries(PROPERTY_TYPE_LABELS) as [PropertyType, string][];
  readonly cities = ['Lomé', 'Kara', 'Kpalimé', 'Sokodé', 'Atakpamé', 'Dapaong', 'Tsévié', 'Notsé'];
  readonly availableAmenities = [
    'WiFi', 'Climatisation', 'Meublé', 'Parking', 'Gardien',
    'Piscine', 'Jardin', 'Groupe électrogène', 'Eau courante',
    'Cuisine équipée', 'Terrasse', 'Ascenseur', 'Sécurité 24h',
  ];

  readonly tabs: { key: Tab; label: string }[] = [
    { key: 'infos',  label: 'Informations' },
    { key: 'photos', label: 'Photos'        },
    { key: 'prix',   label: 'Prix & dispo'  },
  ];

  // ── Formulaire ─────────────────────────────────────────
  form = {
    title:           '',
    type:            '' as PropertyType | '',
    city:            '',
    district:        '',
    address:         '',
    description:     '',
    surface:         0,
    rooms:           1,
    bedrooms:        1,
    bathrooms:       1,
    amenities:       [] as string[],
    price:           0,
    chargesIncluded: false,
    available:       true,
    availableFrom:   '',
  };

  // ── Photos existantes (depuis l'API) ───────────────────
  existingPhotos: { id: number; url: string }[] = [];
  photosToDelete: number[] = [];

  // ── Nouvelles photos ajoutées ──────────────────────────
  newPhotos: PhotoPreview[] = [];
  photoError = '';
  readonly MAX_PHOTOS  = 8;
  readonly MAX_SIZE_MB = 5;

  // ── Onglet actif ───────────────────────────────────────
  activeTab  = signal<Tab>('infos');

  // ── Ouverture ──────────────────────────────────────────
  open(property: Property): void {
    this.isOpen.set(true);
    this.propertyId.set(Number(property.id));
    this.activeTab.set('infos');
    this.errorMsg.set('');
    this.photosToDelete = [];
    this.newPhotos = [];
    this.photoError = '';

    // Pré-remplir le formulaire
    this.form = {
      title:           property.title,
      type:            property.type as PropertyType,
      city:            property.city,
      district:        property.district,
      address:         property.address ?? '',
      description:     property.description,
      surface:         property.surface,
      rooms:           property.rooms,
      bedrooms:        property.bedrooms,
      bathrooms:       property.bathrooms,
      amenities:       property.amenities?.map((a: any) => a.name ?? a) ?? [],
      price:           property.price,
      chargesIncluded: property.charges_included ?? false,
      available:       property.available ?? true,
      availableFrom:   property.available_from ?? '',
    };

    // Photos existantes
    this.existingPhotos = (property.photos ?? []).map((p: any) => ({
      id:  p.id,
      url: p.url ?? '',
    }));
  }

  close(): void {
    this.newPhotos.forEach(p => URL.revokeObjectURL(p.url));
    this.newPhotos = [];
    this.isOpen.set(false);
    this.closed.emit();
  }

  // ── Équipements ────────────────────────────────────────
  toggleAmenity(amenity: string): void {
    const idx = this.form.amenities.indexOf(amenity);
    if (idx === -1) this.form.amenities.push(amenity);
    else this.form.amenities.splice(idx, 1);
  }

  // ── Gestion photos existantes ──────────────────────────
  markPhotoForDeletion(photoId: number): void {
    this.photosToDelete.push(photoId);
    this.existingPhotos = this.existingPhotos.filter(p => p.id !== photoId);
  }

  // ── Nouvelles photos ───────────────────────────────────
  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) this.addFiles(Array.from(input.files));
    input.value = '';
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const files = Array.from(event.dataTransfer?.files ?? []);
    this.addFiles(files);
  }

  addFiles(files: File[]): void {
    this.photoError = '';
    const images = files.filter(f => f.type.startsWith('image/'));
    if (!images.length) { this.photoError = 'Seules les images sont acceptées.'; return; }

    const totalPhotos = this.existingPhotos.length + this.newPhotos.length;
    for (const file of images) {
      if (totalPhotos + this.newPhotos.length >= this.MAX_PHOTOS) {
        this.photoError = `Maximum ${this.MAX_PHOTOS} photos autorisées.`; break;
      }
      const sizeMb = file.size / (1024 * 1024);
      if (sizeMb > this.MAX_SIZE_MB) {
        this.photoError = `"${file.name}" dépasse ${this.MAX_SIZE_MB} Mo.`; continue;
      }
      this.newPhotos.push({
        file,
        url:  URL.createObjectURL(file),
        name: file.name,
        size: sizeMb < 1 ? `${Math.round(file.size / 1024)} Ko` : `${sizeMb.toFixed(1)} Mo`,
      });
    }
  }

  removeNewPhoto(index: number): void {
    URL.revokeObjectURL(this.newPhotos[index].url);
    this.newPhotos.splice(index, 1);
  }

  // ── Validation rapide ──────────────────────────────────
  private validate(): string {
    if (!this.form.title.trim())       return 'Le titre est obligatoire.';
    if (!this.form.type)               return 'Choisissez un type de bien.';
    if (!this.form.city)               return 'Sélectionnez une ville.';
    if (!this.form.district.trim())    return 'Le quartier est obligatoire.';
    if (!this.form.description.trim()) return 'La description est obligatoire.';
    if (!this.form.surface || this.form.surface < 5) return 'Surface invalide (min 5 m²).';
    if (!this.form.price   || this.form.price < 1000) return 'Loyer invalide (min 1 000 CFA).';
    return '';
  }

  // ── Soumission ─────────────────────────────────────────
  async onSave(): Promise<void> {
    const err = this.validate();
    if (err) { this.errorMsg.set(err); return; }

    const id = this.propertyId();
    if (!id) return;

    this.isSaving.set(true);
    this.errorMsg.set('');

    // 1. Supprimer les photos marquées
    for (const photoId of this.photosToDelete) {
      await this.propertyService.deletePhoto(id, photoId).toPromise().catch(() => {});
    }

    // 2. PATCH la propriété avec nouvelles photos
    const payload: any = {
      title:           this.form.title,
      type:            this.form.type,
      city:            this.form.city,
      district:        this.form.district,
      address:         this.form.address,
      description:     this.form.description,
      surface:         this.form.surface,
      rooms:           this.form.rooms,
      bedrooms:        this.form.bedrooms,
      bathrooms:       this.form.bathrooms,
      amenities:       this.form.amenities,
      price:           this.form.price,
      chargesIncluded: this.form.chargesIncluded,
      available:       this.form.available,
      availableFrom:   this.form.availableFrom || undefined,
    };

    this.propertyService
      .update(id, payload, this.newPhotos.map(p => p.file))
      .subscribe({
        next: (updated) => {
          this.isSaving.set(false);
          this.toast.success('Propriété mise à jour avec succès.');
          this.saved.emit(updated);
          this.close();
        },
        error: (err) => {
          this.isSaving.set(false);
          const detail = err?.error?.detail ?? err?.error?.non_field_errors?.[0];
          this.errorMsg.set(detail ?? 'Une erreur est survenue.');
          console.error('Update error:', err.error);
        },
      });
  }

  // ── Utilitaires ────────────────────────────────────────
  formatPrice(n: number): string {
    return new Intl.NumberFormat('fr-FR').format(n);
  }

  get totalPhotos(): number {
    return this.existingPhotos.length + this.newPhotos.length;
  }

  ngOnDestroy(): void {
    this.newPhotos.forEach(p => URL.revokeObjectURL(p.url));
  }
}

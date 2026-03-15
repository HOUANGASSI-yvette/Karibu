import { Component, OnDestroy } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PropertyType, PROPERTY_TYPE_LABELS } from '../../models/property.model';

// ============================================================
// COMPOSANT : PublishPropertyComponent  —  route: /publish
// ============================================================
// Formulaire multi-étapes pour publier un bien immobilier.
//
// Étape 1 → Type & localisation
// Étape 2 → Caractéristiques (surface, pièces, équipements)
// Étape 3 → Photos (upload drag & drop)
// Étape 4 → Prix & disponibilité
// Étape 5 → Récapitulatif + confirmation
//
// ⚠️ INTÉGRATION API :
//   Dans onSubmit(), remplacer le bloc MOCK par :
//
//   const formData = new FormData();
//   // Ajouter tous les champs texte
//   formData.append('title',       this.form.title);
//   formData.append('type',        this.form.type);
//   formData.append('city',        this.form.city);
//   formData.append('district',    this.form.district);
//   formData.append('description', this.form.description);
//   formData.append('surface',     String(this.form.surface));
//   formData.append('rooms',       String(this.form.rooms));
//   formData.append('bedrooms',    String(this.form.bedrooms));
//   formData.append('bathrooms',   String(this.form.bathrooms));
//   formData.append('price',       String(this.form.price));
//   formData.append('chargesIncluded', String(this.form.chargesIncluded));
//   formData.append('amenities',   JSON.stringify(this.form.amenities));
//   // Ajouter les fichiers photos
//   this.photos.forEach((p, i) => formData.append('photos', p.file, p.file.name));
//
//   this.http.post<{ id: string }>('/api/properties', formData).subscribe({
//     next: (res) => { this.router.navigate(['/dashboard']); },
//     error: (err) => { this.isSubmitting = false; this.errorMessage = 'Erreur lors de la publication.'; }
//   });
// ============================================================

// Structure d'une photo uploadée (locale avant envoi API)
export interface PhotoPreview {
  file: File;         // Fichier original
  url: string;        // URL locale (URL.createObjectURL) pour la prévisualisation
  name: string;       // Nom du fichier
  size: string;       // Taille lisible (ex: "1.2 Mo")
}

@Component({
  selector: 'app-publish-property',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: './publish-property.html',
})
export class PublishPropertyComponent implements OnDestroy {

  // Étape courante (1 à 5)
  currentStep = 1;
  totalSteps = 5;

  // Labels des étapes
  steps = [
    { num: 1, label: 'Localisation' },
    { num: 2, label: 'Détails' },
    { num: 3, label: 'Photos' },
    { num: 4, label: 'Prix' },
    { num: 5, label: 'Récap.' },
  ];

  // Types de biens disponibles
  propertyTypes = Object.entries(PROPERTY_TYPE_LABELS) as [PropertyType, string][];

  // Villes disponibles
  // ⚠️ API: à charger depuis GET /cities
  cities = ['Lomé', 'Kara', 'Kpalimé', 'Sokodé', 'Atakpamé', 'Dapaong', 'Tsévié', 'Notsé'];

  // Équipements disponibles (checkboxes)
  availableAmenities = [
    'WiFi', 'Climatisation', 'Meublé', 'Parking', 'Gardien',
    'Piscine', 'Jardin', 'Groupe électrogène', 'Eau courante',
    'Cuisine équipée', 'Terrasse', 'Ascenseur', 'Sécurité 24h',
  ];

  // ── Données du formulaire ────────────────────────────────
  form = {
    // Étape 1
    title:       '',
    type:        '' as PropertyType | '',
    city:        '',
    district:    '',
    address:     '',
    description: '',

    // Étape 2
    surface:     0,
    rooms:       1,
    bedrooms:    1,
    bathrooms:   1,
    amenities:   [] as string[],

    // Étape 4
    price:           0,
    chargesIncluded: false,
    available:       true,
    availableFrom:   '',
  };

  // ── Photos ──────────────────────────────────────────────
  photos: PhotoPreview[] = [];
  isDragOver = false;
  photoError = '';
  readonly MAX_PHOTOS = 8;
  readonly MAX_SIZE_MB = 5;

  // ── États UI ────────────────────────────────────────────
  isSubmitting = false;
  errorMessage = '';
  stepErrors: Record<number, string> = {};

  constructor(private router: Router) {}

  // ----------------------------------------------------------
  // Navigation entre étapes
  // ----------------------------------------------------------
  nextStep() {
    if (!this.validateStep(this.currentStep)) return;
    if (this.currentStep < this.totalSteps) this.currentStep++;
  }

  prevStep() {
    if (this.currentStep > 1) this.currentStep--;
  }

  goToStep(step: number) {
    // Autoriser navigation vers étapes déjà validées
    if (step < this.currentStep) this.currentStep = step;
  }

  // ----------------------------------------------------------
  // Validation par étape
  // ----------------------------------------------------------
  validateStep(step: number): boolean {
    this.stepErrors[step] = '';

    switch (step) {
      case 1:
        if (!this.form.title.trim())   { this.stepErrors[1] = 'Le titre est obligatoire.'; return false; }
        if (!this.form.type)           { this.stepErrors[1] = 'Choisissez un type de bien.'; return false; }
        if (!this.form.city)           { this.stepErrors[1] = 'Sélectionnez une ville.'; return false; }
        if (!this.form.district.trim()){ this.stepErrors[1] = 'Le quartier est obligatoire.'; return false; }
        if (!this.form.description.trim()) { this.stepErrors[1] = 'La description est obligatoire.'; return false; }
        return true;

      case 2:
        if (!this.form.surface || this.form.surface < 5)  { this.stepErrors[2] = 'La surface doit être supérieure à 5 m².'; return false; }
        if (!this.form.rooms   || this.form.rooms < 1)    { this.stepErrors[2] = 'Le nombre de pièces est obligatoire.'; return false; }
        return true;

      case 3:
        if (this.photos.length === 0) { this.stepErrors[3] = 'Ajoutez au moins une photo.'; return false; }
        return true;

      case 4:
        if (!this.form.price || this.form.price < 1000) { this.stepErrors[4] = 'Le loyer doit être supérieur à 1 000 CFA.'; return false; }
        if (!this.form.available && !this.form.availableFrom) {
          this.stepErrors[4] = 'Précisez la date de disponibilité.';
          return false;
        }
        return true;

      default: return true;
    }
  }

  // ----------------------------------------------------------
  // Gestion des équipements
  // ----------------------------------------------------------
  toggleAmenity(amenity: string) {
    const idx = this.form.amenities.indexOf(amenity);
    if (idx === -1) this.form.amenities.push(amenity);
    else this.form.amenities.splice(idx, 1);
  }

  // ----------------------------------------------------------
  // Upload photos
  // ----------------------------------------------------------

  // Clic sur le bouton → ouvre l'input file
  triggerFileInput() {
    document.getElementById('photo-input')?.click();
  }

  // Sélection via input file
  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) this.addFiles(Array.from(input.files));
    input.value = ''; // Reset pour permettre re-sélection du même fichier
  }

  // Drag & drop
  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave() {
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
    if (event.dataTransfer?.files) {
      this.addFiles(Array.from(event.dataTransfer.files));
    }
  }

  // Traitement des fichiers sélectionnés
  addFiles(files: File[]) {
    this.photoError = '';
    const imageFiles = files.filter(f => f.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      this.photoError = 'Seules les images sont acceptées (JPG, PNG, WEBP).';
      return;
    }

    for (const file of imageFiles) {
      // Vérifier le nombre max
      if (this.photos.length >= this.MAX_PHOTOS) {
        this.photoError = `Maximum ${this.MAX_PHOTOS} photos autorisées.`;
        break;
      }
      // Vérifier la taille
      const sizeMb = file.size / (1024 * 1024);
      if (sizeMb > this.MAX_SIZE_MB) {
        this.photoError = `"${file.name}" dépasse ${this.MAX_SIZE_MB} Mo.`;
        continue;
      }
      // Créer l'aperçu local
      // ⚠️ API: cette URL locale (blob:) est uniquement pour la prévisualisation.
      //         Le fichier réel (PhotoPreview.file) est envoyé dans FormData à l'API.
      this.photos.push({
        file,
        url: URL.createObjectURL(file),
        name: file.name,
        size: sizeMb < 1
          ? `${Math.round(file.size / 1024)} Ko`
          : `${sizeMb.toFixed(1)} Mo`,
      });
    }
  }

  // Supprimer une photo
  removePhoto(index: number) {
    URL.revokeObjectURL(this.photos[index].url); // Libérer la mémoire
    this.photos.splice(index, 1);
  }

  // Déplacer la photo en position de couverture (index 0)
  setCover(index: number) {
    if (index === 0) return;
    const [item] = this.photos.splice(index, 1);
    this.photos.unshift(item);
  }

  // ----------------------------------------------------------
  // Soumission finale
  // ----------------------------------------------------------
  onSubmit() {
    if (!this.validateStep(4)) return;
    this.isSubmitting = true;
    this.errorMessage = '';

    // ── MODE MOCK ──────────────────────────────────────────
    // ⚠️ Remplacer par l'appel API avec FormData (voir commentaire en haut)
    console.log('Données du formulaire:', this.form);
    console.log('Photos:', this.photos.map(p => p.name));

    setTimeout(() => {
      this.isSubmitting = false;
      this.router.navigate(['/dashboard']);
    }, 1500);
    // ── FIN MOCK ───────────────────────────────────────────
  }

  // ----------------------------------------------------------
  // Utilitaires
  // ----------------------------------------------------------
  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR').format(price);
  }

  getTypeLabel(type: PropertyType | ''): string {
    if (!type) return '—';
    return PROPERTY_TYPE_LABELS[type] ?? type;
  }

  // Libérer les URLs blob à la destruction du composant
  ngOnDestroy() {
    this.photos.forEach(p => URL.revokeObjectURL(p.url));
  }
}
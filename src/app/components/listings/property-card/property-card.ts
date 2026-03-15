import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Property, PROPERTY_TYPE_LABELS } from '../../../models/property.model';

// ============================================================
// COMPOSANT : PropertyCardComponent
// ============================================================
// Carte réutilisable affichée dans la grille de listings.
// Reçoit une propriété en @Input et navigue vers la page
// de détail au clic sur "Voir plus".
//
// Utilisé dans : ListingsComponent (grille principale)
// Navigue vers : /property/:id  (PropertyDetailComponent)
// ============================================================

@Component({
  selector: 'app-property-card',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './property-card.html',
})
export class PropertyCardComponent {

  // ⚠️ API: les données viennent de PropertyService.getProperties()
  //         et sont transmises via [property]="item" dans listings.html
  @Input() property!: Property;

  // Accès aux labels traduits des types de biens
  typeLabels = PROPERTY_TYPE_LABELS;

  // Formater le prix en format lisible
  // ⚠️ API: adapter si l'API retourne une devise différente
  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR').format(price);
  }

  // Gérer l'erreur de chargement d'image (fallback placeholder)
  onImageError(event: Event) {
    (event.target as HTMLImageElement).src =
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800';
  }
}
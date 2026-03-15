import { Routes } from '@angular/router';
import { LandingPage } from './components/landing-page/landing-page';
import { LoginComponent } from './components/login/login';
import { RegisterComponent } from './components/register/register';
import { ListingsComponent } from './components/listings/listings';
import { PropertyDetailComponent } from './components/property-detail/property-detail';

export const routes: Routes = [
  // Page d'accueil
  { path: '', component: LandingPage },

  // Authentification
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // ⚠️ GUARD: ajouter canActivate: [AuthGuard] une fois l'auth implémentée
  // → protège les routes ci-dessous pour les utilisateurs connectés uniquement

  // Liste des logements (page principale après connexion)
  { path: 'listings', component: ListingsComponent },

  // Détail d'un logement — :id = property.id retourné par l'API
  { path: 'property/:id', component: PropertyDetailComponent },

  // Redirection par défaut
  { path: '**', redirectTo: '' },
];
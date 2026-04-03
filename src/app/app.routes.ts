// app.routes.ts
import { Routes } from '@angular/router';
import { LandingPage }             from './components/landing-page/landing-page';
import { LoginComponent }          from './components/login/login';
import { RegisterComponent }       from './components/register/register';
import { ListingsComponent }       from './components/listings/listings';
import { PropertyDetailComponent } from './components/property-detail/property-detail';
import { DashboardComponent }      from './components/dashboard/dashboard';
import { PublishPropertyComponent } from './components/publish-property/publish-property.component';
// Import des composants tenant (à créer)
import { TenantDashboardComponent } from './components/tenant-dashboard/tenant-dashboard';

import { MessagesComponent }       from './components/messages/messages';
import { NotificationsComponent }  from './components/notifications/notifications';

import { authGuard }  from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';
import {SoumettreDocumentsComponent} from './components/soumettre-documents/soumettre-documents.component';
import {StatutVerificationComponent} from './components/statut-verification/statut-verification';
import {ProfilComponent} from './components/profil/profil.component';
import { dashboardGuard } from './guards/dashboard.guard';
import { tenantGuard } from './guards/tenant.guard';

export const routes: Routes = [
  // ── Publique ───────────────────────────────────────────
  { path: '',           component: LandingPage },
  { path: 'listings',   component: ListingsComponent },
  { path: 'property/:id', component: PropertyDetailComponent },

  // ── Guests seulement (redirige si déjà connecté) ──────
  { path: 'login',    component: LoginComponent,    canActivate: [guestGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [guestGuard] },

  // ── Authentifié requis ─────────────────────────────────
  { path: 'dashboard',     component: DashboardComponent,   canActivate: [dashboardGuard], },
  { path: 'locataire',     component: TenantDashboardComponent, canActivate: [tenantGuard] },
  { path: 'publish',       component: PublishPropertyComponent,  canActivate: [authGuard] },
  { path: 'messages',      component: MessagesComponent,         canActivate: [authGuard] },
  { path: 'notifications', component: NotificationsComponent,    canActivate: [authGuard] },

  { path: 'proprietaire/documents', component: SoumettreDocumentsComponent },
  { path: 'proprietaire/statut',    component: StatutVerificationComponent },
  { path: 'profil', component: ProfilComponent },

  // ── Fallback ───────────────────────────────────────────
  { path: '**', redirectTo: '' },
];

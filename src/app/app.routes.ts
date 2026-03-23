// app.routes.ts
import { Routes } from '@angular/router';
import { LandingPage }            from './components/landing-page/landing-page';
import { LoginComponent }         from './components/login/login';
import { RegisterComponent }      from './components/register/register';
import { ListingsComponent }      from './components/listings/listings';
import { PropertyDetailComponent } from './components/property-detail/property-detail';
import { DashboardComponent }     from './components/dashboard/dashboard';
import { PublishPropertyComponent } from './components/publish-property/publish-property';
import { MessagesComponent }      from './components/messages/messages';
import { NotificationsComponent } from './components/notifications/notifications';

import { authGuard }  from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';

export const routes: Routes = [
  { path: '',             component: LandingPage },


  { path: 'login',    component: LoginComponent,    canActivate: [guestGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [guestGuard] },


  { path: 'listings',     component: ListingsComponent },
  { path: 'property/:id', component: PropertyDetailComponent },

  { path: 'messages',      component: MessagesComponent,      canActivate: [authGuard] },
  { path: 'notifications', component: NotificationsComponent, canActivate: [authGuard] },
  { path: 'dashboard', component: DashboardComponent,       canActivate: [authGuard] },
  { path: 'publish',   component: PublishPropertyComponent,  canActivate: [authGuard] },

  { path: '**', redirectTo: '' },
];

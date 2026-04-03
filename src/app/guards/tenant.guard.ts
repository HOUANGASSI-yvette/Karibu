// guards/tenant.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard pour protéger les routes du dashboard locataire.
 * Seuls les utilisateurs avec role='locataire' peuvent accéder.
 * Redirige les autres vers leur dashboard approprié.
 */
export const tenantGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Vérifier authentification
  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  const user = auth.getCurrentUser();
  const role = user?.role;

  // Seuls les locataires sont autorisés
  if (role === 'locataire') {
    return true;
  }

  // Rediriger selon le rôle
  if (role === 'proprietaire') {
    return router.createUrlTree(['/dashboard']);
  }
  if (role === 'admin') {
    return router.createUrlTree(['/dashboard']);
  }

  // Role inconnu - rediriger vers accueil
  return router.createUrlTree(['/']);
};
// src/app/guards/guest.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) return true;

  // Déjà connecté → redirige selon le vrai rôle
  const user = auth.getCurrentUser();
  const role = user?.role;

  if (role === 'proprietaire') return router.createUrlTree(['/dashboard']);
  if (role === 'locataire')    return router.createUrlTree(['/listings']);
  if (role === 'admin')        return router.createUrlTree(['/admin']);

  return router.createUrlTree(['/']);
};

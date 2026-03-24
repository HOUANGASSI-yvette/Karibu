// guards/dashboard.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const dashboardGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  const role = auth.getCurrentUser()?.role;
  if (role === 'locataire') {
    return router.createUrlTree(['/listings']); // redirige vers les annonces
  }
  if (role === 'admin') {
    return true
  }

  return true; // proprietaire → accès OK
};

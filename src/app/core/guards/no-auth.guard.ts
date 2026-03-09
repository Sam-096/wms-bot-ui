import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Blocks already-authenticated users from reaching /login or /register.
 * Redirects to the role-appropriate default route instead of always /dashboard.
 */
export const noAuthGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    const role         = auth.getUserRole();
    const defaultRoute = role ? auth.getDefaultRouteForRole(role) : '/dashboard';
    return router.createUrlTree([defaultRoute]);
  }

  return true;
};

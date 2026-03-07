import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Blocks already-authenticated users from reaching /login or /register. */
export const noAuthGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return router.createUrlTree(['/dashboard']);
  }
  return true;
};

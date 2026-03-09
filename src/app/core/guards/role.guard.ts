import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { AppRole } from '../models/auth.model';

/**
 * Usage: canActivate: [authGuard, roleGuard(['MANAGER', 'ADMIN'])]
 *
 * Reads role from JWT (not just localStorage) for tamper-resistance.
 * Shows a toast explaining the required role on deny.
 */
export function roleGuard(allowedRoles: AppRole[]): CanActivateFn {
  return () => {
    const auth   = inject(AuthService);
    const router = inject(Router);
    const toast  = inject(ToastService);

    const role = auth.getUserRole(); // decoded from JWT

    if (role && allowedRoles.includes(role)) return true;

    toast.error(
      'Access Denied',
      `This page requires ${allowedRoles.join(' or ')} role.`,
    );
    return router.createUrlTree(['/unauthorized']);
  };
}

import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AppRole } from '../models/auth.model';

/** Usage: canActivate: [authGuard, roleGuard(['MANAGER', 'OPERATOR'])] */
export function roleGuard(allowedRoles: AppRole[]): CanActivateFn {
  return (_route: ActivatedRouteSnapshot) => {
    const auth   = inject(AuthService);
    const router = inject(Router);

    if (auth.hasRole(...allowedRoles)) return true;
    return router.createUrlTree(['/unauthorized']);
  };
}

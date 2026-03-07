import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  const token         = auth.getToken();
  const isAuthRoute   = req.url.includes('/api/v1/auth/');
  const authReq       = token && !isAuthRoute ? addToken(req, token) : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 403) {
        router.navigate(['/unauthorized']);
        return throwError(() => err);
      }

      // Only attempt refresh on 401 for protected endpoints
      if (err.status === 401 && !isAuthRoute && auth.getRefreshToken()) {
        return auth.refreshToken().pipe(
          switchMap((res) => next(addToken(req, res.token))),
          catchError(() => {
            auth.logout();
            return throwError(() => err);
          }),
        );
      }

      return throwError(() => err);
    }),
  );
};

function addToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
}

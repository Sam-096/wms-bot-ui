import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
  HttpEvent,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { ErrorHandlerService } from '../services/error-handler.service';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const auth         = inject(AuthService);
  const router       = inject(Router);
  const toast        = inject(ToastService);
  const errorHandler = inject(ErrorHandlerService);

  const token       = auth.getToken();
  const isAuthRoute = req.url.includes('/api/v1/auth/');
  const authReq     = token && !isAuthRoute ? addToken(req, token) : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse): Observable<HttpEvent<unknown>> => {
      switch (true) {
        // ── 401: try refresh, then logout ──────────────────────
        case error.status === 401 && !isAuthRoute && !!auth.getRefreshToken():
          return auth.refreshToken().pipe(
            switchMap((res) => next(addToken(req, res.token))),
            catchError(() => {
              auth.clearSession();
              toast.warning('Session Expired', 'Please log in again.');
              router.navigate(['/login']);
              return throwError(() => error);
            }),
          );

        case error.status === 401 && !isAuthRoute:
          auth.clearSession();
          toast.warning('Session Expired', 'Please log in again.');
          router.navigate(['/login']);
          break;

        // ── 403: forbidden ─────────────────────────────────────
        case error.status === 403:
          toast.error('Access Denied', "You don't have permission for this action.");
          router.navigate(['/unauthorized']);
          break;

        // ── 429: rate limited ──────────────────────────────────
        case error.status === 429:
          toast.error('Too Many Attempts', 'Wait 1 minute before trying again.', 0);
          break;

        // ── All other errors → ErrorHandlerService ─────────────
        default:
          if (!isAuthRoute) {
            errorHandler.handleApiError(error);
          }
      }

      return throwError(() => error);
    }),
  );
};

function addToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
}

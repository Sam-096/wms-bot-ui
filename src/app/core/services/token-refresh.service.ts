import { Injectable, inject, OnDestroy } from '@angular/core';
import { timer, Subscription, switchMap } from 'rxjs';
import { AuthService } from './auth.service';

function parseJwtExpiry(token: string): number | null {
  try {
    const base64  = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64)) as { exp?: number };
    return payload.exp ?? null;
  } catch {
    return null;
  }
}

/** Silently refreshes the JWT 5 minutes before it expires. */
@Injectable({ providedIn: 'root' })
export class TokenRefreshService implements OnDestroy {
  private readonly auth = inject(AuthService);
  private sub: Subscription | null = null;

  start(): void {
    this.stop();

    const token = this.auth.getToken();
    if (!token) return;

    const exp = parseJwtExpiry(token);
    if (!exp) return;

    const refreshAt = exp * 1000 - 5 * 60 * 1000; // 5 min before expiry
    const delay     = Math.max(refreshAt - Date.now(), 0);

    this.sub = timer(delay)
      .pipe(switchMap(() => this.auth.refreshToken()))
      .subscribe({
        next:  () => this.start(), // chain: restart timer with new token
        error: () => this.auth.logout(),
      });
  }

  stop(): void {
    this.sub?.unsubscribe();
    this.sub = null;
  }

  ngOnDestroy(): void {
    this.stop();
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
  AppRole,
  Warehouse,
} from '../models/auth.model';

const TOKEN_KEY   = 'wms_token';
const REFRESH_KEY = 'wms_refresh';
const USER_KEY    = 'wms_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http   = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly base   = `${environment.apiUrl}/api/v1/auth`;

  // ── Login ────────────────────────────────────────────────────
  login(email: string, password: string): Observable<AuthResponse> {
    const body: LoginRequest = { email, password };
    return this.http.post<AuthResponse>(`${this.base}/login`, body).pipe(
      tap((res) => this.saveSession(res)),
      catchError((err) => throwError(() => err)),
    );
  }

  // ── Register ─────────────────────────────────────────────────
  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/register`, data).pipe(
      tap((res) => this.saveSession(res)),
      catchError((err) => throwError(() => err)),
    );
  }

  // ── Refresh ───────────────────────────────────────────────────
  refreshToken(): Observable<AuthResponse> {
    const refresh = this.getRefreshToken();
    return this.http
      .post<AuthResponse>(`${this.base}/refresh`, { refreshToken: refresh })
      .pipe(
        tap((res) => this.saveSession(res)),
        catchError((err) => {
          this.logout();
          return throwError(() => err);
        }),
      );
  }

  // ── Warehouses list (for register form) ──────────────────────
  getWarehouses(): Observable<Warehouse[]> {
    return this.http.get<Warehouse[]>(`${environment.apiUrl}/api/v1/warehouses`);
  }

  // ── Logout (with navigation) ─────────────────────────────────
  logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  /**
   * Clear tokens from storage WITHOUT navigating.
   * Use this instead of logout() in app.ts ngOnInit to avoid
   * double-navigation when authGuard also redirects.
   */
  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  }

  // ── Helpers ───────────────────────────────────────────────────
  isAuthenticated(): boolean {
    return !!this.getToken() && !this.isTokenExpired();
  }

  /** True when the JWT exp claim is in the past (or token is absent/malformed). */
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;
    const payload = this.decodeJwt(token);
    if (!payload?.['exp']) return true;
    return Date.now() >= (payload['exp'] as number) * 1000;
  }

  /** Role decoded from the JWT payload (claim key: "role"). */
  getUserRole(): AppRole | null {
    const token = this.getToken();
    if (!token) return null;
    const payload = this.decodeJwt(token);
    return (payload?.['role'] as AppRole) ?? this.getCurrentUser()?.role ?? null;
  }

  /**
   * Returns the default landing route for a given role.
   * Used by login component and noAuthGuard redirect.
   */
  getDefaultRouteForRole(role: AppRole): string {
    switch (role) {
      case 'OPERATOR':   return '/inward';
      case 'GATE_STAFF': return '/gate-pass';
      default:           return '/dashboard'; // ADMIN, MANAGER, VIEWER
    }
  }

  private decodeJwt(token: string): Record<string, unknown> | null {
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(base64)) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  getCurrentUser(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }

  hasRole(...roles: AppRole[]): boolean {
    const user = this.getCurrentUser();
    return !!user && roles.includes(user.role);
  }

  getUserId(): string | null {
    return this.getCurrentUser()?.userId ?? null;
  }

  getWarehouseId(): string | null {
    return this.getCurrentUser()?.warehouseId ?? null;
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  }

  private saveSession(res: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(REFRESH_KEY, res.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
  }
}

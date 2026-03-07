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

  // ── Logout ───────────────────────────────────────────────────
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    this.router.navigate(['/login']);
  }

  // ── Helpers ───────────────────────────────────────────────────
  isAuthenticated(): boolean {
    return !!this.getToken();
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

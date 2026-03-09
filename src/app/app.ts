import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  private readonly http       = inject(HttpClient);
  private readonly auth       = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    // Clear expired session WITHOUT navigating.
    // Using clearSession() (not logout()) avoids a double-navigation race where both
    // ngOnInit and authGuard simultaneously redirect to /login.
    if (this.auth.isTokenExpired()) {
      this.auth.clearSession();
    }

    // Wake Render backend on app load (fire-and-forget — HttpClient auto-completes)
    this.http
      .get(`${environment.apiUrl}/api/bot/health`, { responseType: 'text' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => {} });
  }
}

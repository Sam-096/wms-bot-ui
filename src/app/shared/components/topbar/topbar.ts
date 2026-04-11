import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { ThemeService } from '../../../core/services/theme.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { RealtimeService } from '../../../core/services/realtime.service';
import { TokenRefreshService } from '../../../core/services/token-refresh.service';

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/dashboard': 'Dashboard',
  '/inward': 'Inward Register',
  '/inward/new': 'New Inward Entry',
  '/outward': 'Outward Register',
  '/outward/new': 'New Outward Entry',
  '/gate-pass': 'Gate Pass',
  '/gate-pass/new': 'New Gate Pass',
  '/inventory': 'Inventory',
  '/bonds': 'Bonds',
  '/reports': 'Reports',
};

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './topbar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopbarComponent implements OnInit, OnDestroy {
  readonly theme    = inject(ThemeService);
  private readonly router       = inject(Router);
  private readonly auth         = inject(AuthService);
  private readonly toast        = inject(ToastService);
  private readonly realtime     = inject(RealtimeService);
  private readonly tokenRefresh = inject(TokenRefreshService);

  readonly pageTitle = signal('Dashboard');
  private sub?: Subscription;

  ngOnInit(): void {
    this.updateTitle(this.router.url);
    this.sub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.updateTitle(e.urlAfterRedirects));
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private updateTitle(url: string): void {
    const path = url.split('?')[0];
    this.pageTitle.set(ROUTE_TITLES[path] ?? 'Godown AI');
  }

  signOut(): void {
    this.tokenRefresh.stop();
    this.realtime.disconnect();
    this.toast.info('Goodbye', 'Logged out successfully.');
    this.auth.logout();
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Output,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { RealtimeService } from '../../../core/services/realtime.service';
import { ALL_NAV, NavItem } from './sidebar-config';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  @Output() navClicked = new EventEmitter<void>();

  private readonly auth     = inject(AuthService);
  private readonly toast    = inject(ToastService);
  private readonly realtime = inject(RealtimeService);

  readonly user = this.auth.getCurrentUser();

  readonly navItems = computed<NavItem[]>(() => {
    const role = this.user?.role;
    return ALL_NAV.filter(
      (item) => !item.roles || !role || item.roles.includes(role),
    );
  });

  readonly initials = computed<string>(() => {
    const name = this.user?.username ?? this.user?.email ?? 'WM';
    return name.substring(0, 2).toUpperCase();
  });

  readonly displayName = computed<string>(() => this.user?.username ?? 'WMS User');
  readonly displayRole = computed<string>(() => this.user?.role ?? 'Warehouse User');

  signOut(): void {
    this.realtime.disconnect();
    this.toast.info('Goodbye', 'Logged out successfully.');
    this.auth.logout();
  }
}

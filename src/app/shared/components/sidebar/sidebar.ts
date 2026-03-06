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

type NavIcon =
  | 'dashboard'
  | 'chat'
  | 'inward'
  | 'outward'
  | 'gatepass'
  | 'inventory'
  | 'bonds'
  | 'reports';

interface NavItem {
  label: string;
  route: string;
  icon: NavIcon;
  iconClass: string;
  badge?: number;
  exact?: boolean;
  roles?: string[];
}

const ALL_NAV: NavItem[] = [
  { label: 'Dashboard',  route: '/dashboard', icon: 'dashboard', iconClass: 'text-primary', exact: true },
  { label: 'AI Chat',    route: '/chat',       icon: 'chat',      iconClass: 'text-primary' },
  { label: 'Inward',     route: '/inward',     icon: 'inward',    iconClass: 'text-info',      badge: 3, roles: ['MANAGER','OPERATOR','ADMIN'] },
  { label: 'Outward',    route: '/outward',    icon: 'outward',   iconClass: 'text-warning',              roles: ['MANAGER','OPERATOR','ADMIN'] },
  { label: 'Gate Pass',  route: '/gate-pass',  icon: 'gatepass',  iconClass: 'text-secondary',            roles: ['MANAGER','OPERATOR','GATE_STAFF','ADMIN'] },
  { label: 'Inventory',  route: '/inventory',  icon: 'inventory', iconClass: 'text-accent' },
  { label: 'Bonds',      route: '/bonds',      icon: 'bonds',     iconClass: 'text-success',              roles: ['MANAGER','ADMIN'] },
  { label: 'Reports',    route: '/reports',    icon: 'reports',   iconClass: 'text-error',                roles: ['MANAGER','ADMIN'] },
];

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
  private readonly auth = inject(AuthService);

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
    this.auth.logout();
  }
}

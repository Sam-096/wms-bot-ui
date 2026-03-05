import { ChangeDetectionStrategy, Component, EventEmitter, inject, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

type NavIcon = 'dashboard' | 'inward' | 'outward' | 'gatepass' | 'inventory' | 'bonds' | 'reports';

interface NavItem {
  label: string;
  route: string;
  icon: NavIcon;
  iconClass: string;
  badge?: number;
  exact?: boolean;
}

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
  private readonly router = inject(Router);

  readonly navItems: NavItem[] = [
    {
      label: 'Dashboard',
      route: '/dashboard',
      icon: 'dashboard',
      iconClass: 'text-primary',
      exact: true,
    },
    {
      label: 'Inward',
      route: '/inward',
      icon: 'inward',
      iconClass: 'text-info',
      badge: 3,
    },
    {
      label: 'Outward',
      route: '/outward',
      icon: 'outward',
      iconClass: 'text-warning',
    },
    {
      label: 'Gate Pass',
      route: '/gate-pass',
      icon: 'gatepass',
      iconClass: 'text-secondary',
    },
    {
      label: 'Inventory',
      route: '/inventory',
      icon: 'inventory',
      iconClass: 'text-accent',
    },
    {
      label: 'Bonds',
      route: '/bonds',
      icon: 'bonds',
      iconClass: 'text-success',
    },
    {
      label: 'Reports',
      route: '/reports',
      icon: 'reports',
      iconClass: 'text-error',
    },
  ];

  signOut(): void {
    this.router.navigate(['/']);
  }
}

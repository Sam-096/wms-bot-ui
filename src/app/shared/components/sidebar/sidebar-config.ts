export type NavIcon =
  | 'dashboard'
  | 'chat'
  | 'inward'
  | 'outward'
  | 'gatepass'
  | 'inventory'
  | 'bonds'
  | 'reports';

export interface NavItem {
  label: string;
  route: string;
  icon: NavIcon;
  iconClass: string;
  badge?: number;
  exact?: boolean;
  roles?: string[];
}

export const ALL_NAV: NavItem[] = [
  { label: 'Dashboard', route: '/dashboard', icon: 'dashboard', iconClass: 'text-primary', exact: true },
  { label: 'AI Chat',   route: '/chat',       icon: 'chat',      iconClass: 'text-primary' },
  { label: 'Inward',    route: '/inward',     icon: 'inward',    iconClass: 'text-info',      badge: 3, roles: ['MANAGER', 'OPERATOR', 'ADMIN'] },
  { label: 'Outward',   route: '/outward',    icon: 'outward',   iconClass: 'text-warning',             roles: ['MANAGER', 'OPERATOR', 'ADMIN'] },
  { label: 'Gate Pass', route: '/gate-pass',  icon: 'gatepass',  iconClass: 'text-secondary',           roles: ['MANAGER', 'OPERATOR', 'GATE_STAFF', 'ADMIN'] },
  { label: 'Inventory', route: '/inventory',  icon: 'inventory', iconClass: 'text-accent' },
  { label: 'Bonds',     route: '/bonds',      icon: 'bonds',     iconClass: 'text-success',             roles: ['MANAGER', 'ADMIN'] },
  { label: 'Reports',   route: '/reports',    icon: 'reports',   iconClass: 'text-error',               roles: ['MANAGER', 'ADMIN'] },
];

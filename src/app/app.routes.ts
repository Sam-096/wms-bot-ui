import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { noAuthGuard } from './core/guards/no-auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  // ── Public ────────────────────────────────────────────────
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing.component').then((m) => m.LandingComponent),
  },
  {
    path: 'login',
    canActivate: [noAuthGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [noAuthGuard],
    loadComponent: () =>
      import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./features/unauthorized/unauthorized.component').then((m) => m.UnauthorizedComponent),
  },

  // ── Authenticated shell ────────────────────────────────────
  {
    path: '',
    loadComponent: () =>
      import('./shell/shell.component').then((m) => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'chat',
        loadComponent: () =>
          import('./features/chat/chat-workspace.component').then((m) => m.ChatWorkspaceComponent),
      },
      {
        path: 'inward',
        canActivate: [roleGuard(['MANAGER', 'OPERATOR', 'ADMIN'])],
        loadComponent: () =>
          import('./features/inward/inward-list/inward-list').then((m) => m.InwardList),
      },
      {
        path: 'inward/new',
        canActivate: [roleGuard(['MANAGER', 'OPERATOR', 'ADMIN'])],
        loadComponent: () =>
          import('./features/inward/inward-new/inward-new').then((m) => m.InwardNew),
      },
      {
        path: 'outward',
        canActivate: [roleGuard(['MANAGER', 'OPERATOR', 'ADMIN'])],
        loadComponent: () =>
          import('./features/outward/outward-list/outward-list').then((m) => m.OutwardList),
      },
      {
        path: 'outward/new',
        canActivate: [roleGuard(['MANAGER', 'OPERATOR', 'ADMIN'])],
        loadComponent: () =>
          import('./features/outward/outward-new/outward-new').then((m) => m.OutwardNew),
      },
      {
        path: 'gate-pass',
        canActivate: [roleGuard(['MANAGER', 'OPERATOR', 'GATE_STAFF', 'ADMIN'])],
        loadComponent: () =>
          import('./features/gate-pass/gate-pass-list/gate-pass-list').then((m) => m.GatePassList),
      },
      {
        path: 'gate-pass/new',
        canActivate: [roleGuard(['MANAGER', 'OPERATOR', 'GATE_STAFF', 'ADMIN'])],
        loadComponent: () =>
          import('./features/gate-pass/gate-pass-new/gate-pass-new').then((m) => m.GatePassNew),
      },
      {
        path: 'inventory',
        loadComponent: () =>
          import('./features/inventory/inventory-list/inventory-list').then((m) => m.InventoryList),
      },
      {
        path: 'bonds',
        canActivate: [roleGuard(['MANAGER', 'ADMIN'])],
        loadComponent: () =>
          import('./features/bonds/bonds-list/bonds-list').then((m) => m.BondsList),
      },
      {
        path: 'reports',
        canActivate: [roleGuard(['MANAGER', 'ADMIN'])],
        loadComponent: () =>
          import('./features/reports/reports-list/reports-list').then((m) => m.ReportsList),
      },
      { path: '**', redirectTo: 'dashboard' },
    ],
  },
];

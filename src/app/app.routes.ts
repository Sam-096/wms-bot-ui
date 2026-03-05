import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing.component').then((m) => m.LandingComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./shell/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'inward',
        loadComponent: () =>
          import('./features/inward/inward-list/inward-list').then(
            (m) => m.InwardList,
          ),
      },
      {
        path: 'inward/new',
        loadComponent: () =>
          import('./features/inward/inward-new/inward-new').then((m) => m.InwardNew),
      },
      {
        path: 'outward',
        loadComponent: () =>
          import('./features/outward/outward-list/outward-list').then(
            (m) => m.OutwardList,
          ),
      },
      {
        path: 'outward/new',
        loadComponent: () =>
          import('./features/outward/outward-new/outward-new').then(
            (m) => m.OutwardNew,
          ),
      },
      {
        path: 'gate-pass',
        loadComponent: () =>
          import('./features/gate-pass/gate-pass-list/gate-pass-list').then(
            (m) => m.GatePassList,
          ),
      },
      {
        path: 'gate-pass/new',
        loadComponent: () =>
          import('./features/gate-pass/gate-pass-new/gate-pass-new').then(
            (m) => m.GatePassNew,
          ),
      },
      {
        path: 'inventory',
        loadComponent: () =>
          import('./features/inventory/inventory-list/inventory-list').then(
            (m) => m.InventoryList,
          ),
      },
      {
        path: 'bonds',
        loadComponent: () =>
          import('./features/bonds/bonds-list/bonds-list').then((m) => m.BondsList),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/reports/reports-list/reports-list').then(
            (m) => m.ReportsList,
          ),
      },
      { path: '**', redirectTo: 'dashboard' },
    ],
  },
];

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface KPI {
  label: string;
  value: string | number;
  sub: string;
  delta: string;
  up: boolean;
  accent: string;
}

interface RecentEntry {
  id: string;
  vehicle: string;
  commodity: string;
  bags: number;
  time: string;
  status: 'Approved' | 'Pending' | 'Rejected' | 'Processing';
}

interface CommodityShare {
  name: string;
  pct: number;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  readonly today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  readonly kpis: KPI[] = [
    { label: 'Total Inward', value: 248, sub: 'This month', delta: '+12%', up: true, accent: 'text-primary' },
    { label: 'Pending Approvals', value: 12, sub: 'Needs action', delta: '-3', up: false, accent: 'text-warning' },
    { label: "Today's Outward", value: 8, sub: 'Dispatched', delta: '+2', up: true, accent: 'text-success' },
    { label: 'Active Vehicles', value: 3, sub: 'On premises', delta: 'Live', up: true, accent: 'text-info' },
  ];

  readonly recentEntries: RecentEntry[] = [
    { id: 'INW-012', vehicle: 'AP22WX3456', commodity: 'Paddy', bags: 400, time: '2 mins ago', status: 'Pending' },
    { id: 'INW-011', vehicle: 'TS05YZ7890', commodity: 'Barley', bags: 160, time: '1 hr ago', status: 'Approved' },
    { id: 'INW-010', vehicle: 'TS14UV9012', commodity: 'Wheat', bags: 120, time: '3 hrs ago', status: 'Rejected' },
    { id: 'INW-009', vehicle: 'AP39ST5678', commodity: 'Rice', bags: 200, time: '5 hrs ago', status: 'Pending' },
    { id: 'INW-008', vehicle: 'KA01QR1234', commodity: 'Paddy', bags: 350, time: 'Yesterday', status: 'Approved' },
  ];

  readonly commodities: CommodityShare[] = [
    { name: 'Rice', pct: 42, color: 'bg-primary' },
    { name: 'Wheat', pct: 28, color: 'bg-secondary' },
    { name: 'Paddy', pct: 18, color: 'bg-accent' },
    { name: 'Maize', pct: 12, color: 'bg-info' },
  ];

  statusBadge(s: RecentEntry['status']): string {
    return { Approved: 'badge-success', Pending: 'badge-warning', Rejected: 'badge-error', Processing: 'badge-info' }[s];
  }
}

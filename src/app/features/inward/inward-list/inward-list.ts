import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

type InwardStatus = 'Approved' | 'Pending' | 'Rejected' | 'Processing';

interface InwardEntry {
  id: string;
  date: string;
  vehicleNo: string;
  driverName: string;
  commodity: string;
  bags: number;
  weight: number;
  status: InwardStatus;
}

const MOCK_ENTRIES: InwardEntry[] = [
  { id: 'INW-001', date: '2026-03-05', vehicleNo: 'AP39CD1234', driverName: 'Raju Rao', commodity: 'Rice', bags: 200, weight: 4000, status: 'Approved' },
  { id: 'INW-002', date: '2026-03-05', vehicleNo: 'TS07EF5678', driverName: 'Suresh Kumar', commodity: 'Wheat', bags: 150, weight: 3750, status: 'Pending' },
  { id: 'INW-003', date: '2026-03-04', vehicleNo: 'AP28AB9012', driverName: 'Venkat Reddy', commodity: 'Maize', bags: 300, weight: 6000, status: 'Processing' },
  { id: 'INW-004', date: '2026-03-04', vehicleNo: 'MH12GH3456', driverName: 'Prasad Naidu', commodity: 'Jowar', bags: 100, weight: 2500, status: 'Rejected' },
  { id: 'INW-005', date: '2026-03-03', vehicleNo: 'AP16JK7890', driverName: 'Krishnarao', commodity: 'Rice', bags: 250, weight: 5000, status: 'Approved' },
  { id: 'INW-006', date: '2026-03-03', vehicleNo: 'TS09LM2345', driverName: 'Balaji Rao', commodity: 'Wheat', bags: 180, weight: 4500, status: 'Approved' },
  { id: 'INW-007', date: '2026-03-02', vehicleNo: 'AP05NP6789', driverName: 'Ramesh Babu', commodity: 'Maize', bags: 220, weight: 4400, status: 'Pending' },
  { id: 'INW-008', date: '2026-03-02', vehicleNo: 'KA01QR1234', driverName: 'Sridhar Rao', commodity: 'Paddy', bags: 350, weight: 7000, status: 'Approved' },
  { id: 'INW-009', date: '2026-03-01', vehicleNo: 'AP39ST5678', driverName: 'Naga Raju', commodity: 'Rice', bags: 200, weight: 4000, status: 'Pending' },
  { id: 'INW-010', date: '2026-03-01', vehicleNo: 'TS14UV9012', driverName: 'Chakravarthy', commodity: 'Wheat', bags: 120, weight: 3000, status: 'Rejected' },
  { id: 'INW-011', date: '2026-02-28', vehicleNo: 'AP22WX3456', driverName: 'Anand Babu', commodity: 'Paddy', bags: 400, weight: 8000, status: 'Approved' },
  { id: 'INW-012', date: '2026-02-27', vehicleNo: 'TS05YZ7890', driverName: 'Venkateswara', commodity: 'Barley', bags: 160, weight: 3200, status: 'Processing' },
];

@Component({
  selector: 'app-inward-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './inward-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InwardList {
  readonly searchQuery = signal('');
  readonly filterStatus = signal('');
  readonly filterDate = signal('');
  readonly currentPage = signal(1);
  readonly pageSize = 8;

  readonly entries = MOCK_ENTRIES;

  readonly filtered = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const s = this.filterStatus();
    const d = this.filterDate();
    return this.entries.filter(
      (e) =>
        (!q ||
          e.vehicleNo.toLowerCase().includes(q) ||
          e.driverName.toLowerCase().includes(q) ||
          e.commodity.toLowerCase().includes(q) ||
          e.id.toLowerCase().includes(q)) &&
        (!s || e.status === s) &&
        (!d || e.date === d),
    );
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filtered().length / this.pageSize)),
  );

  readonly paginated = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  readonly pages = computed(() =>
    Array.from({ length: this.totalPages() }, (_, i) => i + 1),
  );

  readonly rangeStart = computed(() => (this.currentPage() - 1) * this.pageSize + 1);
  readonly rangeEnd = computed(() =>
    Math.min(this.currentPage() * this.pageSize, this.filtered().length),
  );

  readonly countPending = computed(
    () => this.entries.filter((e) => e.status === 'Pending').length,
  );
  readonly countApproved = computed(
    () => this.entries.filter((e) => e.status === 'Approved').length,
  );
  readonly countRejected = computed(
    () => this.entries.filter((e) => e.status === 'Rejected').length,
  );

  statusBadge(status: InwardStatus): string {
    const map: Record<InwardStatus, string> = {
      Approved: 'badge-success',
      Pending: 'badge-warning',
      Rejected: 'badge-error',
      Processing: 'badge-info',
    };
    return map[status];
  }

  setPage(p: number): void {
    if (p >= 1 && p <= this.totalPages()) this.currentPage.set(p);
  }

  onSearch(value: string): void {
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }

  onStatusFilter(value: string): void {
    this.filterStatus.set(value);
    this.currentPage.set(1);
  }

  onDateFilter(value: string): void {
    this.filterDate.set(value);
    this.currentPage.set(1);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.filterStatus.set('');
    this.filterDate.set('');
    this.currentPage.set(1);
  }

  hasFilters = computed(
    () => !!this.searchQuery() || !!this.filterStatus() || !!this.filterDate(),
  );
}

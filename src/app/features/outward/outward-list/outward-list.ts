import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { OutwardService } from '../../../core/services/outward.service';
import {
  OutwardTransaction,
  TransactionStatus,
} from '../../../core/models/business.model';

interface OutwardStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

const PAGE_SIZE = 8;
const SEARCH_DEBOUNCE_MS = 300;

@Component({
  selector: 'app-outward-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './outward-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutwardList implements OnInit {
  private readonly outwardSvc = inject(OutwardService);
  private readonly destroyRef = inject(DestroyRef);

  readonly searchQuery  = signal('');
  readonly filterStatus = signal('');
  readonly filterDate   = signal('');
  readonly currentPage  = signal(1);
  readonly pageSize     = PAGE_SIZE;

  readonly rows       = signal<OutwardTransaction[]>([]);
  readonly total      = signal(0);
  readonly totalPages = signal(1);
  readonly loading    = signal(false);
  readonly loadError  = signal(false);
  readonly stats      = signal<OutwardStats>({ total: 0, pending: 0, approved: 0, rejected: 0 });

  readonly pages      = computed(() =>
    Array.from({ length: this.totalPages() }, (_, i) => i + 1),
  );
  readonly rangeStart = computed(() =>
    this.total() === 0 ? 0 : (this.currentPage() - 1) * this.pageSize + 1,
  );
  readonly rangeEnd   = computed(() =>
    Math.min(this.currentPage() * this.pageSize, this.total()),
  );
  readonly hasFilters = computed(
    () => !!this.searchQuery() || !!this.filterStatus() || !!this.filterDate(),
  );

  readonly countPending  = computed(() => this.stats().pending);
  readonly countApproved = computed(() => this.stats().approved);
  readonly countRejected = computed(() => this.stats().rejected);

  private searchTimer: ReturnType<typeof setTimeout> | undefined;

  ngOnInit(): void {
    this.load();
    this.loadStats();
  }

  private load(): void {
    this.loading.set(true);
    this.loadError.set(false);

    this.outwardSvc
      .getAll({
        search:   this.searchQuery() || undefined,
        status:   this.filterStatus() || undefined,
        dateFrom: this.filterDate() || undefined,
        dateTo:   this.filterDate() || undefined,
        page:     this.currentPage() - 1,
        size:     this.pageSize,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.rows.set(res.content);
          this.total.set(res.totalElements);
          this.totalPages.set(Math.max(1, res.totalPages));
          this.loading.set(false);
        },
        error: () => {
          this.rows.set([]);
          this.total.set(0);
          this.totalPages.set(1);
          this.loading.set(false);
          this.loadError.set(true);
        },
      });
  }

  private loadStats(): void {
    const size1 = { page: 0, size: 1 };
    forkJoin({
      total:    this.outwardSvc.getAll({ ...size1 }),
      pending:  this.outwardSvc.getAll({ ...size1, status: 'PENDING' }),
      approved: this.outwardSvc.getAll({ ...size1, status: 'APPROVED' }),
      rejected: this.outwardSvc.getAll({ ...size1, status: 'REJECTED' }),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((r) => this.stats.set({
        total:    r.total.totalElements,
        pending:  r.pending.totalElements,
        approved: r.approved.totalElements,
        rejected: r.rejected.totalElements,
      }));
  }

  onSearch(value: string): void {
    this.searchQuery.set(value);
    this.currentPage.set(1);
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.load(), SEARCH_DEBOUNCE_MS);
  }

  onStatusFilter(value: string): void {
    this.filterStatus.set(value);
    this.currentPage.set(1);
    this.load();
  }

  onDateFilter(value: string): void {
    this.filterDate.set(value);
    this.currentPage.set(1);
    this.load();
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.filterStatus.set('');
    this.filterDate.set('');
    this.currentPage.set(1);
    clearTimeout(this.searchTimer);
    this.load();
  }

  setPage(p: number): void {
    if (p < 1 || p > this.totalPages() || p === this.currentPage()) return;
    this.currentPage.set(p);
    this.load();
  }

  retry(): void {
    this.load();
    this.loadStats();
  }

  statusBadge(status: TransactionStatus): string {
    const map: Record<TransactionStatus, string> = {
      APPROVED:   'badge-success',
      PENDING:    'badge-warning',
      REJECTED:   'badge-error',
      PROCESSING: 'badge-info',
    };
    return map[status] ?? 'badge-ghost';
  }

  trackById = (_: number, e: OutwardTransaction): string => e.id;
}

import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, of, tap } from 'rxjs';
import { AuthService } from './auth.service';
import { Warehouse } from '../models/auth.model';

/**
 * Single source of truth for the logged-in user's active warehouse.
 *
 * Bootstrap lifecycle:
 *  1. Service instantiates → reads from localStorage immediately (sync, free).
 *  2. Component calls loadWarehouses() in ngOnInit → populates the full list
 *     and switches active if needed (async, one HTTP GET).
 *  3. Components read warehouseId / warehouseName from signals (reactive).
 */
@Injectable({ providedIn: 'root' })
export class UserContextService {
  private readonly auth = inject(AuthService);

  private readonly _warehouses = signal<Warehouse[]>([]);
  // Auto-seed from auth profile so warehouseId is available before any API call.
  private readonly _active     = signal<Warehouse | null>(this.fromProfileOrNull());

  // ── Public read-only API ──────────────────────────────────────
  readonly warehouses       = this._warehouses.asReadonly();
  readonly warehouseId      = computed(() => this._active()?.id   ?? '');
  readonly warehouseName    = computed(() => this._active()?.name ?? '');
  readonly hasWarehouse     = computed(() => {
    const id = this.warehouseId();
    return !!id && id !== 'UNKNOWN';
  });
  readonly isMultiWarehouse = computed(() => this._warehouses().length > 1);

  // ── API ───────────────────────────────────────────────────────

  /**
   * Fetch the available warehouse list from the backend.
   * Subscribe in the consuming component with `takeUntilDestroyed`.
   * Never throws — falls back to the current in-memory list on error.
   */
  loadWarehouses(): Observable<Warehouse[]> {
    return this.auth.getWarehouses().pipe(
      tap((list) => {
        this._warehouses.set(list);
        // If the currently active warehouse isn't in the list, switch to first.
        const cur   = this._active();
        const match = cur ? list.find(w => w.id === cur.id) : null;
        if (!match && list.length > 0) this._active.set(list[0]);
      }),
      catchError(() => of(this._warehouses())),
    );
  }

  /** Switch active warehouse by id (no-op if id not in loaded list). */
  setActiveById(id: string): void {
    const found = this._warehouses().find(w => w.id === id);
    if (found) this._active.set(found);
  }

  // ── Private helpers ───────────────────────────────────────────

  private fromProfileOrNull(): Warehouse | null {
    const u = this.auth.getCurrentUser();
    if (!u?.warehouseId || u.warehouseId === 'UNKNOWN') return null;
    return { id: u.warehouseId, name: u.warehouseName ?? '' };
  }
}

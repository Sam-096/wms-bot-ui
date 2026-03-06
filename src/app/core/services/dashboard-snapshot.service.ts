import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, switchMap, shareReplay, Subject, takeUntil, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardSnapshot } from '../models/business.model';

@Injectable({ providedIn: 'root' })
export class DashboardSnapshotService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/dashboard`;
  private stopPolling$ = new Subject<void>();

  getSnapshot(warehouseId: string): Observable<DashboardSnapshot> {
    return this.http
      .get<DashboardSnapshot>(`${this.base}/snapshot`, { params: { warehouseId } })
      .pipe(
        catchError(() =>
          of<DashboardSnapshot>({
            stockHealth: 0,
            activeVehicles: 0,
            pendingInward: 0,
            pendingOutward: 0,
            lowStockItems: 0,
            activeBonds: 0,
            warehouseId,
            timestamp: new Date().toISOString(),
          }),
        ),
      );
  }

  /** Emit immediately then every intervalMs milliseconds. */
  startPolling(warehouseId: string, intervalMs = 60_000): Observable<DashboardSnapshot> {
    this.stopPolling$.next(); // cancel any previous polling
    return interval(intervalMs).pipe(
      switchMap(() => this.getSnapshot(warehouseId)),
      takeUntil(this.stopPolling$),
      shareReplay(1),
    );
  }

  stopPolling(): void {
    this.stopPolling$.next();
  }
}

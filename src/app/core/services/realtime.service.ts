import { Injectable, inject } from '@angular/core';
import { Observable, Subject, filter } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export type RealtimeEventType =
  | 'INWARD_CREATED'
  | 'OUTWARD_CREATED'
  | 'GATE_PASS_CREATED'
  | 'STOCK_UPDATED'
  | 'BOND_UPDATED';

export interface RealtimeEvent {
  type: RealtimeEventType;
  warehouseId: string;
  payload?: unknown;
}

/**
 * Singleton SSE service for warehouse real-time events.
 *
 * Usage:
 *   realtime.connect(warehouseId);          // after login
 *   realtime.on('INWARD_CREATED')           // in component
 *     .pipe(takeUntilDestroyed(destroyRef))
 *     .subscribe(() => this.refresh());
 *   realtime.disconnect();                  // on logout
 */
@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private readonly auth = inject(AuthService);

  private abortController?: AbortController;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private connectedWarehouseId?: string;

  private readonly eventsSubject = new Subject<RealtimeEvent>();
  readonly events$: Observable<RealtimeEvent> = this.eventsSubject.asObservable();

  connect(warehouseId: string): void {
    this.disconnect(); // abort any existing connection first
    this.connectedWarehouseId = warehouseId;
    this.abortController = new AbortController();

    const token = this.auth.getToken();
    const url   = `${environment.apiUrl}/api/v1/events/stream?warehouseId=${encodeURIComponent(warehouseId)}`;

    fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal: this.abortController.signal,
    })
      .then((res) => {
        if (!res.ok || !res.body) {
          this.scheduleReconnect(warehouseId);
          return;
        }

        const reader  = res.body.getReader();
        const decoder = new TextDecoder();

        const read = (): Promise<void> =>
          reader.read().then(({ done, value }) => {
            if (done) {
              this.scheduleReconnect(warehouseId);
              return;
            }

            const lines = decoder.decode(value, { stream: true }).split('\n');
            for (const line of lines) {
              if (!line.startsWith('data:')) continue;
              const raw = line.slice(5).trim();
              if (!raw) continue;
              try {
                const event = JSON.parse(raw) as RealtimeEvent;
                this.eventsSubject.next(event);
              } catch { /* skip malformed event */ }
            }

            return read();
          });

        read().catch((err: unknown) => {
          if ((err as Error).name !== 'AbortError') {
            this.scheduleReconnect(warehouseId);
          }
        });
      })
      .catch((err: unknown) => {
        if ((err as Error).name !== 'AbortError') {
          this.scheduleReconnect(warehouseId);
        }
      });
  }

  disconnect(): void {
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer     = undefined;
    this.connectedWarehouseId = undefined;
    this.abortController?.abort();
    this.abortController = undefined;
  }

  /** Returns an Observable filtered to a specific event type. */
  on(type: RealtimeEventType): Observable<RealtimeEvent> {
    return this.events$.pipe(filter((e) => e.type === type));
  }

  private scheduleReconnect(warehouseId: string): void {
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => this.connect(warehouseId), 5_000);
  }
}

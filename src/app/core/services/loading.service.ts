import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, defer } from 'rxjs';
import { map, distinctUntilChanged, finalize } from 'rxjs/operators';

export type LoadingKey =
  | 'login'
  | 'inward-save'
  | 'outward-save'
  | 'gate-pass-save'
  | 'bond-save'
  | 'chat-send'
  | 'dashboard-load'
  | 'report-load';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly state$ = new BehaviorSubject<Map<LoadingKey, boolean>>(new Map());

  show(key: LoadingKey): void {
    this.state$.next(new Map(this.state$.value).set(key, true));
  }

  hide(key: LoadingKey): void {
    const next = new Map(this.state$.value);
    next.delete(key);
    this.state$.next(next);
  }

  isLoading$(key: LoadingKey): Observable<boolean> {
    return this.state$.pipe(
      map((m) => m.get(key) ?? false),
      distinctUntilChanged(), // only emit when loading state actually changes
    );
  }

  /**
   * Auto show/hide loading around any Observable.
   *
   * Usage:
   *   this.loading.wrap('inward-save', this.inwardSvc.create(data))
   *     .subscribe({ next: ..., error: ... });
   */
  wrap<T>(key: LoadingKey, source$: Observable<T>): Observable<T> {
    return defer(() => {
      this.show(key);
      return source$.pipe(finalize(() => this.hide(key)));
    });
  }
}

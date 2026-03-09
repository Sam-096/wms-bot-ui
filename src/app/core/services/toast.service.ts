import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  callback: () => void;
}

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration: number; // ms — 0 means never auto-dismiss
  errorCode?: string;
  action?: ToastAction;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  // Timer refs stored to prevent LEAK 5 — clears on dismiss/dismissAll
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

  private readonly toastsSubject = new BehaviorSubject<Toast[]>([]);
  readonly toasts$: Observable<Toast[]> = this.toastsSubject.asObservable();

  success(title: string, message: string, duration = 3000): void {
    this.add({ id: crypto.randomUUID(), type: 'success', title, message, duration });
  }

  error(title: string, message: string, duration = 5000, errorCode?: string): void {
    this.add({ id: crypto.randomUUID(), type: 'error', title, message, duration, errorCode });
  }

  warning(title: string, message: string, duration = 4000): void {
    this.add({ id: crypto.randomUUID(), type: 'warning', title, message, duration });
  }

  info(title: string, message: string, duration = 3000): void {
    this.add({ id: crypto.randomUUID(), type: 'info', title, message, duration });
  }

  dismiss(id: string): void {
    clearTimeout(this.timers.get(id));
    this.timers.delete(id);
    this.toastsSubject.next(this.toastsSubject.value.filter((t) => t.id !== id));
  }

  dismissAll(): void {
    this.timers.forEach((t) => clearTimeout(t));
    this.timers.clear();
    this.toastsSubject.next([]);
  }

  private schedule(id: string, duration: number): void {
    if (duration > 0) {
      const timer = setTimeout(() => this.dismiss(id), duration);
      this.timers.set(id, timer);
    }
  }

  // Max 5 toasts — evict oldest to prevent stacking
  private add(toast: Toast): void {
    const current = this.toastsSubject.value;
    const updated =
      current.length >= 5 ? [...current.slice(1), toast] : [...current, toast];
    this.toastsSubject.next(updated);
    this.schedule(toast.id, toast.duration);
  }
}

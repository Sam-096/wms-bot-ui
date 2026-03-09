import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Toast, ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    @keyframes slideInRight {
      from { opacity: 0; transform: translateX(calc(100% + 1rem)); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes shrinkWidth {
      from { width: 100%; }
      to   { width: 0%; }
    }
    .toast-item {
      animation: slideInRight 0.25s ease-out forwards;
    }
    .toast-progress {
      animation: shrinkWidth linear forwards;
    }
  `],
  template: `
    <div
      class="fixed top-4 right-4 z-[9999] w-80 flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-atomic="false"
    >
      @for (t of (toast.toasts$ | async) ?? []; track t.id) {
        <div
          class="toast-item pointer-events-auto rounded-lg border-l-4 shadow-lg overflow-hidden"
          [class]="toastClasses(t)"
          role="alert"
          [attr.aria-label]="t.title + ': ' + t.message"
        >
          <!-- Body -->
          <div class="flex items-start gap-3 px-4 pt-3 pb-2">
            <!-- Icon -->
            <span class="shrink-0 mt-0.5" [class]="iconClass(t.type)" aria-hidden="true">
              @switch (t.type) {
                @case ('success') {
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                  </svg>
                }
                @case ('error') {
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                }
                @case ('warning') {
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
                  </svg>
                }
                @default {
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/>
                  </svg>
                }
              }
            </span>

            <!-- Text -->
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold leading-tight text-base-content">{{ t.title }}</p>
              <p class="text-xs text-base-content/70 mt-0.5 leading-snug">{{ t.message }}</p>
              @if (t.errorCode) {
                <p class="text-xs text-base-content/40 mt-1 font-mono">{{ t.errorCode }}</p>
              }
              @if (t.action) {
                <button
                  class="text-xs font-semibold mt-1.5 underline underline-offset-2 hover:opacity-80 transition-opacity"
                  [class]="iconClass(t.type)"
                  (click)="t.action!.callback()"
                >{{ t.action.label }}</button>
              }
            </div>

            <!-- Dismiss -->
            <button
              class="btn btn-ghost btn-xs btn-circle shrink-0 opacity-50 hover:opacity-100 transition-opacity"
              (click)="toast.dismiss(t.id)"
              aria-label="Dismiss notification"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Progress bar (only for timed toasts) -->
          @if (t.duration > 0) {
            <div class="h-0.5 w-full" [class]="progressBgClass(t.type)">
              <div
                class="toast-progress h-full"
                [class]="progressBarClass(t.type)"
                [style.animation-duration.ms]="t.duration"
              ></div>
            </div>
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastComponent {
  readonly toast = inject(ToastService);

  toastClasses(t: Toast): string {
    const base = 'bg-base-200 border-base-300';
    const map: Record<string, string> = {
      success: 'bg-base-200 border-success',
      error:   'bg-base-200 border-error',
      warning: 'bg-base-200 border-warning',
      info:    'bg-base-200 border-info',
    };
    return map[t.type] ?? base;
  }

  iconClass(type: string): string {
    const map: Record<string, string> = {
      success: 'text-success',
      error:   'text-error',
      warning: 'text-warning',
      info:    'text-info',
    };
    return map[type] ?? 'text-base-content';
  }

  progressBgClass(type: string): string {
    const map: Record<string, string> = {
      success: 'bg-success/20',
      error:   'bg-error/20',
      warning: 'bg-warning/20',
      info:    'bg-info/20',
    };
    return map[type] ?? 'bg-base-300';
  }

  progressBarClass(type: string): string {
    const map: Record<string, string> = {
      success: 'bg-success',
      error:   'bg-error',
      warning: 'bg-warning',
      info:    'bg-info',
    };
    return map[type] ?? 'bg-primary';
  }
}

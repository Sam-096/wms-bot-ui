import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);

  private readonly _dark = signal<boolean>(
    localStorage.getItem('wms-theme') === 'wms-pro' ||
      (!localStorage.getItem('wms-theme') &&
        window.matchMedia('(prefers-color-scheme: dark)').matches),
  );

  readonly isDark = this._dark.asReadonly();
  readonly current = computed(() => (this._dark() ? 'wms-pro' : 'wms-light'));

  constructor() {
    // Apply theme on init without animation
    effect(() => {
      this.doc.documentElement.setAttribute('data-theme', this.current());
      localStorage.setItem('wms-theme', this.current());
    });
  }

  /**
   * Toggle with circular ripple animation from click origin.
   * Falls back to instant swap if View Transitions not supported.
   * @param event — pass the click MouseEvent from the toggle button
   */
  toggle(event?: MouseEvent): void {
    if (!('startViewTransition' in document)) {
      this._dark.update((v) => !v);
      return;
    }

    const goingDark = !this._dark(); // what the NEW state will be

    // Dark mode:  ripple FROM top-right → sweeps to bottom-left
    // Light mode: ripple FROM bottom-left → sweeps to top-right
    const x = goingDark ? window.innerWidth : 0;
    const y = goingDark ? 0 : window.innerHeight;

    const radius = Math.hypot(window.innerWidth, window.innerHeight);

    const clipPath = [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`];

    (document as any)
      .startViewTransition(() => {
        this._dark.update((v) => !v);
      })
      .ready.then(() => {
        document.documentElement.animate(
          { clipPath },
          {
            duration: 250,
            easing: 'cubic-bezier(0.25, 0, 0.3, 1)',
            pseudoElement: '::view-transition-new(root)',
          },
        );
      });
  }
}

import { Injectable, signal, computed, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _dark = signal<boolean>(
    localStorage.getItem('wms-theme') === 'wms-pro' ||
      (!localStorage.getItem('wms-theme') &&
        window.matchMedia('(prefers-color-scheme: dark)').matches),
  );

  readonly isDark = this._dark.asReadonly();
  readonly current = computed(() => (this._dark() ? 'wms-pro' : 'wms-light'));

  constructor() {
    effect(() => {
      document.documentElement.setAttribute('data-theme', this.current());
      localStorage.setItem('wms-theme', this._dark() ? 'wms-pro' : 'wms-light');
    });
  }

  toggle(): void {
    this._dark.update((v) => !v);
  }
}

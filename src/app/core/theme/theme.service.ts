import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'nimbusflow.theme';

  readonly mode = signal<ThemeMode>('light');

  init(): void {
    const saved = localStorage.getItem(this.storageKey);
    this.applyMode(this.normalize(saved), false);

    window.addEventListener('storage', (event: StorageEvent) => {
      if (event.key === this.storageKey && event.newValue) {
        this.applyMode(this.normalize(event.newValue), false);
      }
    });
  }

  toggle(): void {
    this.setMode(this.mode() === 'dark' ? 'light' : 'dark');
  }

  setMode(mode: ThemeMode): void {
    this.applyMode(mode, true);
  }

  private applyMode(mode: ThemeMode, persist: boolean): void {
    this.mode.set(mode);

    const root = document.documentElement;
    root.classList.toggle('dark', mode === 'dark');
    root.style.colorScheme = mode;

    if (persist) {
      localStorage.setItem(this.storageKey, mode);
    }
  }

  private normalize(value: string | null): ThemeMode {
    return value === 'dark' ? 'dark' : 'light';
  }
}

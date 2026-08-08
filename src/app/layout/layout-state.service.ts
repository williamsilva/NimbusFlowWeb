import { Injectable, effect, signal } from '@angular/core';

/**
 * Estado de layout (Sakai-like) compartilhado entre Topbar/Sidebar/Layout.
 * Mantém o app 100% standalone e simples (signals).
 */
@Injectable({ providedIn: 'root' })
export class LayoutStateService {
  private static readonly STORAGE_KEY = 'nimbusflow-security.layout.sidebarVisible';

  /** Controla se o menu lateral está visível. */
  readonly sidebarVisible = signal(true);

  constructor() {
    // Persistência simples no navegador (localStorage)
    if (!this.isBrowser()) return;

    const saved = window.localStorage.getItem(LayoutStateService.STORAGE_KEY);
    if (saved === 'true' || saved === 'false') {
      this.sidebarVisible.set(saved === 'true');
    }

    // Sempre que mudar, salva.
    effect(() => {
      window.localStorage.setItem(
        LayoutStateService.STORAGE_KEY,
        String(this.sidebarVisible())
      );
    });
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  toggleSidebar(): void {
    this.sidebarVisible.update((v) => !v);
  }

  showSidebar(): void {
    this.sidebarVisible.set(true);
  }

  hideSidebar(): void {
    this.sidebarVisible.set(false);
  }
}

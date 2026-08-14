import { Injectable, effect, signal } from '@angular/core';

/**
 * Estado de layout (Sakai-like) compartilhado entre Topbar/Sidebar/Layout.
 * Mantém o app 100% standalone e simples (signals).
 */
@Injectable({ providedIn: 'root' })
export class LayoutStateService {
  private static readonly STORAGE_KEY = 'nimbusflow.layout.sidebarVisible';

  /** Controla se o menu lateral está visível. */
  readonly sidebarVisible = signal(true);

  constructor() {
    if (!this.isBrowser()) return;

    // No mobile (ver breakpoint em layout.component.css/bottom-nav.component.css) esta mesma
    // flag vira o overlay de tela cheia aberto pelo botão "Mais" - precisa SEMPRE nascer
    // fechada ali (nunca lembrar entre sessões, diferente do desktop), senão o app abre com o
    // menu travado cobrindo a tela inteira (o botão de esconder - hambúrguer - some no mobile,
    // então nada nunca zerava essa flag de volta). Ignora o valor salvo nesse caso de propósito.
    const isMobileViewport = window.innerWidth <= 768;
    if (isMobileViewport) {
      this.sidebarVisible.set(false);
    } else {
      // Persistência simples no navegador (localStorage) - só faz sentido no desktop, onde o
      // usuário de fato escolhe esconder/mostrar via o botão do topbar.
      const saved = window.localStorage.getItem(LayoutStateService.STORAGE_KEY);
      if (saved === 'true' || saved === 'false') {
        this.sidebarVisible.set(saved === 'true');
      }
    }

    // Sempre que mudar, salva (no mobile isso grava "true" enquanto o overlay estiver aberto,
    // mas não importa - o próximo boot força false de novo, acima, antes de ler isso).
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

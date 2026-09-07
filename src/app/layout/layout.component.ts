import { filter } from 'rxjs';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, ChangeDetectionStrategy, DestroyRef, inject } from '@angular/core';

import { TopbarComponent } from './topbar/topbar.component';
import { FooterComponent } from '@williamsilva/nimbus-web-commons';
import { LayoutStateService } from './layout-state.service';
import { SidebarComponent } from './sidebar/sidebar.component';
import { BottomNavComponent } from './bottom-nav/bottom-nav.component';

@Component({
  standalone: true,
  selector: 'app-layout',
  styleUrl: './layout.component.css',
  templateUrl: './layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, TopbarComponent, SidebarComponent, FooterComponent, BottomNavComponent],
})
export class LayoutComponent {
  private readonly layout = inject(LayoutStateService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  /** Exposto para template (signals) */
  readonly sidebarVisible = this.layout.sidebarVisible;

  constructor() {
    // Fecha o overlay do menu no mobile sozinho ao navegar (escolheu um item, fecha - igual
    // gaveta de app nativo) - checado a cada navegação (não só no boot, ver
    // LayoutStateService) porque rotação de tela/redimensionar podem mudar a largura depois.
    // No desktop isso não tem efeito visual (a sidebar já é coluna do grid, não overlay), mas
    // seria incômodo fechar ela sozinha a cada navegação lá - por isso o check de largura.
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        if (typeof window !== 'undefined' && window.innerWidth <= 768) {
          this.layout.hideSidebar();
        }
      });
  }

  /** Fecha o overlay do menu no mobile (ver layout.component.css) - clique no fundo escurecido.
   *  No desktop isso não tem efeito visual (a sidebar já é uma coluna do grid, não um overlay),
   *  então é seguro chamar sem checar breakpoint aqui. */
  closeSidebarOverlay(): void {
    this.layout.hideSidebar();
  }
}

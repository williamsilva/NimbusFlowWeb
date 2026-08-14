import { RouterLink, RouterLinkActive } from '@angular/router';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';

import { TranslateModule } from '@ngx-translate/core';

import { LayoutStateService } from '../layout-state.service';

/**
 * Barra inferior estilo app nativo, visível só em telas estreitas (ver CSS - o breakpoint
 * combina com o já usado em topbar.component.css). O menu completo (sidebar) continua sendo a
 * fonte única de verdade de navegação/permissões - esta barra é só um atalho fixo pros 3 fluxos
 * de maior uso no celular (confirmado com o usuário), mais um "Mais" que abre o mesmo sidebar já
 * existente como overlay de tela cheia (ver layout.component.css) em vez de duplicar a lista de
 * itens/permissões aqui.
 */
@Component({
  standalone: true,
  selector: 'app-bottom-nav',
  styleUrl: './bottom-nav.component.css',
  templateUrl: './bottom-nav.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, TranslateModule],
})
export class BottomNavComponent {
  private readonly layout = inject(LayoutStateService);

  readonly sidebarVisible = this.layout.sidebarVisible;

  openMore(): void {
    this.layout.showSidebar();
  }
}

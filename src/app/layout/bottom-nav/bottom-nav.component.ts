import { RouterLink, RouterLinkActive } from '@angular/router';
import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';

import { TranslateModule } from '@ngx-translate/core';

import { PERMISSIONS } from '@core/auth/permissions.constants';
import { PermissionService } from '@core/auth/permission.service';
import { LayoutStateService } from '../layout-state.service';

/**
 * Barra inferior estilo app nativo, visível só em telas estreitas (ver CSS - o breakpoint
 * combina com o já usado em topbar.component.css). O menu completo (sidebar) continua sendo a
 * fonte única de verdade de navegação/permissões - esta barra é só um atalho fixo pros 3 fluxos
 * de maior uso no celular (confirmado com o usuário), mais um "Mais" que abre o mesmo sidebar já
 * existente como overlay de tela cheia (ver layout.component.css) em vez de duplicar a lista de
 * itens/permissões aqui. Os 2 atalhos (Frentes de Serviço/Medições) precisam checar permissão do
 * mesmo jeito que menu.data.ts checa pro sidebar - achado real 2026-09-19 (pedido do usuário):
 * sem isso, um usuário sem OBRA_CONSULT/MEDICAO_CONSULT via e conseguia tocar nesses atalhos aqui
 * mesmo não tendo acesso nenhum às telas.
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
  private readonly perms = inject(PermissionService);

  readonly sidebarVisible = this.layout.sidebarVisible;

  readonly canViewWorks = computed(() => this.perms.hasSupportOr(PERMISSIONS.OBRA.VIEW));
  readonly canViewMeasurements = computed(() => this.perms.hasSupportOr(PERMISSIONS.MEDICAO.VIEW));

  /** Alterna (não só abre) - senão tocar em "Mais" de novo pra fechar não faz nada, e o único
   *  jeito de fechar vira tocar no fundo escurecido (ver layout.component.html), o que não é
   *  óbvio pra quem espera o próprio botão fechar de volta. */
  openMore(): void {
    this.layout.toggleSidebar();
  }
}

import { RouterOutlet } from '@angular/router';

import { Component, ChangeDetectionStrategy, inject } from '@angular/core';

import { TopbarComponent } from './topbar/topbar.component';
import { FooterComponent } from './footer/footer.component';
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

  /** Exposto para template (signals) */
  readonly sidebarVisible = this.layout.sidebarVisible;

  /** Fecha o overlay do menu no mobile (ver layout.component.css) - clique no fundo escurecido
   *  ou em qualquer item de navegação dentro do sidebar. No desktop isso não tem efeito visual
   *  (a sidebar já é uma coluna do grid, não um overlay), então é seguro chamar sem checar
   *  breakpoint aqui. */
  closeSidebarOverlay(): void {
    this.layout.hideSidebar();
  }
}

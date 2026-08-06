import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { TranslatePipe } from '@ngx-translate/core';

import { I18nService } from '../../core/i18n/i18n.service';

export interface ActiveFilterEntry {
  label: string;
  value: string;
}

/**
 * Painel "Filtrar" colapsável (cabeçalho + campos via content projection + Buscar/Limpar) - casca
 * genérica reaproveitada pelas telas de Usuários/Grupos (cada uma define seus próprios campos),
 * padrão visual do CardSyncWeb. Não sabe nada sobre os campos em si, só orquestra
 * expandir/colapsar e emitir search()/clear() pro componente pai aplicar o filtro.
 *
 * O ícone (i) abre um popup (mat-menu) com o resumo "label: valor" de cada filtro ativo - antes
 * disso era só uma dica estática (matTooltip), não mostrava o que de fato estava filtrando.
 */
@Component({
  selector: 'app-filter-panel',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatMenuModule, TranslatePipe],
  templateUrl: './filter-panel.component.html',
  styleUrl: './filter-panel.component.scss',
})
export class FilterPanelComponent {
  @Input() activeFilters: ActiveFilterEntry[] = [];
  @Output() search = new EventEmitter<void>();
  @Output() clear = new EventEmitter<void>();

  expanded = true;

  constructor(private readonly i18n: I18nService) {}

  toggle(): void {
    this.expanded = !this.expanded;
  }

  get statusLabel(): string {
    const count = this.activeFilters.length;
    if (count === 0) {
      return this.i18n.tUi('common.filters.none');
    }
    // Sem suporte a ICU/plural no I18nService.tUi() (só interpolação simples) - escolhe entre as
    // duas chaves manualmente, mesma convenção "items"/"items_plural" já usada em account.profile.
    return this.i18n.tUi(count === 1 ? 'common.filters.activeCount' : 'common.filters.activeCount_plural', { count });
  }
}

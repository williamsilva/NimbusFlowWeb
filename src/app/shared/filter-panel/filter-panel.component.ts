import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { PopoverModule } from 'primeng/popover';
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
    imports: [ButtonModule, PopoverModule, TranslatePipe],
    templateUrl: './filter-panel.component.html',
    styleUrl: './filter-panel.component.scss'
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

  // common.filters.activeCount é uma expressão ICU plural (=0/one/other, resolvida pelo
  // TranslateMessageFormatCompiler) - já cobre o caso de zero, não precisa de um "if (count === 0)"
  // separado aqui.
  get statusLabel(): string {
    return this.i18n.tUi('common.filters.activeCount', { count: this.activeFilters.length });
  }
}

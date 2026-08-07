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
 * Painel "Filtrar" colapsável (cabeçalho + campos via content projection + Buscar/Limpar) - mesmo
 * papel do cs-filters-panel do CardSyncWeb, reaproveitado por todas as telas de lista. Não sabe
 * nada sobre os campos em si, só orquestra expandir/colapsar e emitir search()/clear() pro
 * componente pai aplicar o filtro (tipicamente via NbStatefulListPage).
 *
 * O ícone (i) abre um popup com o resumo "label: valor" de cada filtro ativo.
 */
@Component({
  standalone: true,
  selector: 'nb-filters-panel',
  imports: [ButtonModule, PopoverModule, TranslatePipe],
  templateUrl: './nb-filters-panel.component.html',
  styleUrl: './nb-filters-panel.component.scss',
})
export class NbFiltersPanelComponent {
  @Input() activeFilters: ActiveFilterEntry[] = [];
  @Input() actionsAlign: 'start' | 'center' | 'end' = 'end';
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

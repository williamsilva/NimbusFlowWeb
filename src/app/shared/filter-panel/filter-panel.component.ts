import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';

import { I18nService } from '../../core/i18n/i18n.service';

/**
 * Painel "Filtrar" colapsável (cabeçalho + campos via content projection + Buscar/Limpar) - casca
 * genérica reaproveitada pelas telas de Usuários/Grupos (cada uma define seus próprios campos),
 * padrão visual do CardSyncWeb. Não sabe nada sobre os campos em si, só orquestra
 * expandir/colapsar e emitir search()/clear() pro componente pai aplicar o filtro.
 */
@Component({
  selector: 'app-filter-panel',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatTooltipModule, TranslatePipe],
  templateUrl: './filter-panel.component.html',
  styleUrl: './filter-panel.component.scss',
})
export class FilterPanelComponent {
  @Input() activeCount = 0;
  @Output() search = new EventEmitter<void>();
  @Output() clear = new EventEmitter<void>();

  expanded = true;

  constructor(private readonly i18n: I18nService) {}

  toggle(): void {
    this.expanded = !this.expanded;
  }

  get statusLabel(): string {
    return this.activeCount > 0
      ? this.i18n.tUi('common.filters.activeCount', { count: this.activeCount })
      : this.i18n.tUi('common.filters.none');
  }
}

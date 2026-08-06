import { Injectable, effect, inject } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { Subject } from 'rxjs';

import { I18nService } from '../../core/i18n/i18n.service';

/**
 * MatPaginatorIntl traduzido - por padrão vem só em inglês ("Items per page", "1 - 2 of 2"), o
 * que ficaria destoante do resto do app (tudo localizado em PT/EN/ES). Fornecido por componente
 * (não global) via `providers: [{ provide: MatPaginatorIntl, useClass: NfPaginatorIntl }]` -
 * só as telas de Usuários/Grupos usam paginator por enquanto.
 */
@Injectable()
export class NfPaginatorIntl extends MatPaginatorIntl {
  private readonly i18n = inject(I18nService);
  override changes = new Subject<void>();

  constructor() {
    super();
    // Reage à troca de idioma em runtime (mesmo padrão do dashboard - effect() lendo o signal
    // appliedLang) - a 1ª execução (idioma ainda não mudou) já popula os labels iniciais.
    effect(() => {
      this.i18n.appliedLang();
      this.translateLabels();
      this.changes.next();
    });
  }

  override getRangeLabel = (page: number, pageSize: number, length: number): string => {
    if (length === 0 || pageSize === 0) {
      return this.i18n.tUi('common.paginator.rangeEmpty', { length });
    }
    const startIndex = page * pageSize;
    const endIndex = startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize;
    return this.i18n.tUi('common.paginator.range', { start: startIndex + 1, end: endIndex, length });
  };

  private translateLabels(): void {
    this.itemsPerPageLabel = this.i18n.tUi('common.paginator.itemsPerPage');
    this.nextPageLabel = this.i18n.tUi('common.paginator.nextPage');
    this.previousPageLabel = this.i18n.tUi('common.paginator.previousPage');
    this.firstPageLabel = this.i18n.tUi('common.paginator.firstPage');
    this.lastPageLabel = this.i18n.tUi('common.paginator.lastPage');
  }
}

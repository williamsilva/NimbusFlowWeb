import { Injectable, inject, signal } from '@angular/core';

import { Observable, finalize, tap } from 'rxjs';

import { EquipamentosApiService } from '@features/service/equipamentos.api.service';
import { EquipamentosAdvancedFilters } from '@features/filter/equipamentos.filters';
import { ListQueryDto } from '@shared/features/list-query/list-query.types';
import {
  EquipamentoModel,
  EquipamentoOptionModel,
  EquipamentoUpsertInput,
} from '@models/equipamentos.models';

type LastQuery = ListQueryDto<EquipamentosAdvancedFilters>;

/** Também consumido por Manutenções/Agenda de Manutenção/Histórico (via `options`) pro seletor de
 *  Equipamento em seus formulários - centralizado aqui em vez de duplicado em cada facade. */
@Injectable({ providedIn: 'root' })
export class EquipamentosFacade {
  private readonly api = inject(EquipamentosApiService);

  private readonly _total = signal(0);
  private readonly _loading = signal(false);
  private readonly _loadedOnce = signal(false);
  private readonly _items = signal<EquipamentoModel[]>([]);
  private readonly _lastQuery = signal<LastQuery | null>(null);

  private readonly _options = signal<EquipamentoOptionModel[]>([]);
  private readonly _optionsLoadedOnce = signal(false);

  readonly loading = this._loading.asReadonly();
  readonly loadedOnce = this._loadedOnce.asReadonly();
  readonly items = this._items.asReadonly();
  readonly totalRecords = this._total.asReadonly();
  readonly options = this._options.asReadonly();

  /** Listagem completa sem paginação, usada pelos seletores/dashboard. A tela de listagem usa
   *  `loadPage()` abaixo. */
  load(): void {
    this._loading.set(true);

    this.api
      .list()
      .pipe(
        finalize(() => {
          this._loading.set(false);
          this._loadedOnce.set(true);
        }),
      )
      .subscribe({
        next: (items) => this._items.set(items),
        error: () => this._items.set([]),
      });
  }

  loadPage(q: LastQuery): void {
    if (this._loading()) return;

    this._loading.set(true);
    this._lastQuery.set(q);

    this.api
      .searchPaged(q)
      .pipe(
        finalize(() => {
          this._loading.set(false);
          this._loadedOnce.set(true);
        }),
      )
      .subscribe({
        next: (res) => {
          this._items.set(res?._embedded?.content ?? []);
          this._total.set(res?.page?.totalElements ?? 0);
        },
        error: () => {
          this._items.set([]);
          this._total.set(0);
        },
      });
  }

  reloadLast(): void {
    const last = this._lastQuery();
    if (!last) return;

    this.loadPage(last);
  }

  loadOptions(force = false): void {
    if (!force && this._optionsLoadedOnce()) return;

    this.api.options().subscribe({
      next: (items) => {
        this._options.set(items);
        this._optionsLoadedOnce.set(true);
      },
      error: () => {
        this._options.set([]);
        this._optionsLoadedOnce.set(true);
      },
    });
  }

  create(input: EquipamentoUpsertInput): Observable<EquipamentoModel> {
    return this.api.create(input).pipe(tap(() => this.reloadLast()));
  }

  update(id: string, input: EquipamentoUpsertInput): Observable<EquipamentoModel> {
    return this.api.update(id, input).pipe(tap(() => this.reloadLast()));
  }
}

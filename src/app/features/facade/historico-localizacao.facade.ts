import { Injectable, inject, signal } from '@angular/core';

import { Observable, finalize, tap } from 'rxjs';

import { HistoricoLocalizacaoApiService } from '@features/service/historico-localizacao.api.service';
import { HistoricoLocalizacaoAdvancedFilters } from '@features/filter/historico-localizacao.filters';
import { ListQueryDto } from '@williamsilva/nimbus-web-commons';
import {
  HistoricoLocalizacaoModel,
  HistoricoLocalizacaoUpsertInput,
} from '@models/historico-localizacao.models';

type LastQuery = ListQueryDto<HistoricoLocalizacaoAdvancedFilters>;

@Injectable({ providedIn: 'root' })
export class HistoricoLocalizacaoFacade {
  private readonly api = inject(HistoricoLocalizacaoApiService);

  private readonly _total = signal(0);
  private readonly _loading = signal(false);
  private readonly _loadedOnce = signal(false);
  private readonly _items = signal<HistoricoLocalizacaoModel[]>([]);
  private readonly _lastQuery = signal<LastQuery | null>(null);

  readonly loading = this._loading.asReadonly();
  readonly loadedOnce = this._loadedOnce.asReadonly();
  readonly items = this._items.asReadonly();
  readonly totalRecords = this._total.asReadonly();

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

  create(input: HistoricoLocalizacaoUpsertInput): Observable<HistoricoLocalizacaoModel> {
    return this.api.create(input).pipe(tap(() => this.reloadLast()));
  }

  update(id: string, input: HistoricoLocalizacaoUpsertInput): Observable<HistoricoLocalizacaoModel> {
    return this.api.update(id, input).pipe(tap(() => this.reloadLast()));
  }

  delete(id: string): Observable<void> {
    return this.api.delete(id).pipe(tap(() => this.reloadLast()));
  }
}

import { Injectable, inject, signal } from '@angular/core';

import { Observable, finalize, tap } from 'rxjs';

import { AddendumsApiService } from '@features/service/addendums.api.service';
import { AddendumsAdvancedFilters } from '@features/filter/addendums.filters';
import { ListQueryDto } from '@shared/features/list-query/list-query.types';
import {
  AddendumDecisionInput,
  AddendumModel,
  AddendumUpdateInput,
  AddendumWithWorkModel,
} from '@models/addendums.models';

type LastQuery = ListQueryDto<AddendumsAdvancedFilters>;

/**
 * Estado separado de AddendumsFacade (que é por obra) - a listagem global (menu "Aditivos", todas
 * as obras) precisa do campo workName e é paginada/filtrada/ordenada no backend (mesmo padrão de
 * WorksFacade), recarregando a última página buscada (reloadLast()) após aprovar/reprovar.
 */
@Injectable({ providedIn: 'root' })
export class AddendumsGlobalFacade {
  private readonly api = inject(AddendumsApiService);

  private readonly _total = signal(0);
  private readonly _loading = signal(false);
  private readonly _loadedOnce = signal(false);
  private readonly _items = signal<AddendumWithWorkModel[]>([]);
  private readonly _lastQuery = signal<LastQuery | null>(null);

  readonly loading = this._loading.asReadonly();
  readonly items = this._items.asReadonly();
  readonly totalRecords = this._total.asReadonly();
  readonly loadedOnce = this._loadedOnce.asReadonly();

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

  update(id: string, input: AddendumUpdateInput): Observable<AddendumModel> {
    return this.api.update(id, input).pipe(tap(() => this.reloadLast()));
  }

  approve(id: string, input: AddendumDecisionInput): Observable<AddendumModel> {
    return this.api.approve(id, input).pipe(tap(() => this.reloadLast()));
  }

  reject(id: string, input: AddendumDecisionInput): Observable<AddendumModel> {
    return this.api.reject(id, input).pipe(tap(() => this.reloadLast()));
  }

  resendNotification(id: string): Observable<AddendumModel> {
    return this.api.resendNotification(id).pipe(tap(() => this.reloadLast()));
  }
}

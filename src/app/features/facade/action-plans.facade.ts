import { Injectable, inject, signal } from '@angular/core';

import { Observable, finalize, tap } from 'rxjs';

import { ActionPlansApiService } from '@features/service/action-plans.api.service';
import { ActionPlansAdvancedFilters } from '@features/filter/action-plans.filters';
import { ListQueryDto } from '@shared/features/list-query/list-query.types';
import { ActionPlanModel, ActionPlanUpsertInput } from '@models/action-plans.models';

type LastQuery = ListQueryDto<ActionPlansAdvancedFilters>;

@Injectable({ providedIn: 'root' })
export class ActionPlansFacade {
  private readonly api = inject(ActionPlansApiService);

  private readonly _total = signal(0);
  private readonly _loading = signal(false);
  private readonly _loadedOnce = signal(false);
  private readonly _data = signal<ActionPlanModel[]>([]);
  private readonly _lastQuery = signal<LastQuery | null>(null);

  readonly loading = this._loading.asReadonly();
  readonly actionPlans = this._data.asReadonly();
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
          this._data.set(res?._embedded?.content ?? []);
          this._total.set(res?.page?.totalElements ?? 0);
        },
        error: () => {
          this._data.set([]);
          this._total.set(0);
        },
      });
  }

  reloadLast(): void {
    const last = this._lastQuery();
    if (!last) return;

    this.loadPage(last);
  }

  getById(id: string): Observable<ActionPlanModel> {
    return this.api.getById(id);
  }

  /**
   * Sem marcar `_loading` aqui (mesmo motivo de TicketsFacade/SuggestionsFacade): esse signal é o
   * guard de `loadPage()`, e setá-lo antes de chamar a API bloquearia silenciosamente o
   * `reloadLast()` do `tap` abaixo.
   */
  create(input: ActionPlanUpsertInput): Observable<ActionPlanModel> {
    return this.api.create(input).pipe(tap(() => this.reloadLast()));
  }

  update(id: string, input: ActionPlanUpsertInput): Observable<ActionPlanModel> {
    return this.api.update(id, input).pipe(tap(() => this.reloadLast()));
  }

  start(id: string): Observable<ActionPlanModel> {
    return this.api.start(id).pipe(tap(() => this.reloadLast()));
  }

  complete(id: string): Observable<ActionPlanModel> {
    return this.api.complete(id).pipe(tap(() => this.reloadLast()));
  }

  cancel(id: string): Observable<ActionPlanModel> {
    return this.api.cancel(id).pipe(tap(() => this.reloadLast()));
  }
}

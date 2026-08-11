import { Injectable, inject, signal } from '@angular/core';

import { Observable, finalize, tap } from 'rxjs';

import { MeasurementsApiService } from '@features/service/measurements.api.service';
import { MeasurementsAdvancedFilters } from '@features/filter/measurements.filters';
import { ListQueryDto } from '@shared/features/list-query/list-query.types';
import {
  MeasurementDecisionInput,
  MeasurementModel,
  MeasurementWithContextModel,
} from '@models/measurements.models';

type LastQuery = ListQueryDto<MeasurementsAdvancedFilters>;

/**
 * Estado separado de MeasurementsFacade (que é por obra) - a listagem global (menu "Medições",
 * todas as obras) precisa do campo workName e é paginada/filtrada/ordenada no backend (mesmo
 * padrão de WorksFacade), recarregando a última página buscada (reloadLast()) após aprovar/
 * reprovar.
 */
@Injectable({ providedIn: 'root' })
export class MeasurementsGlobalFacade {
  private readonly api = inject(MeasurementsApiService);

  private readonly _total = signal(0);
  private readonly _loading = signal(false);
  private readonly _loadedOnce = signal(false);
  private readonly _items = signal<MeasurementWithContextModel[]>([]);
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

  approve(id: string, input: MeasurementDecisionInput): Observable<MeasurementModel> {
    return this.api.approve(id, input).pipe(tap(() => this.reloadLast()));
  }

  reject(id: string, input: MeasurementDecisionInput): Observable<MeasurementModel> {
    return this.api.reject(id, input).pipe(tap(() => this.reloadLast()));
  }
}

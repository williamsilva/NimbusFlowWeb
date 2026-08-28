import { Injectable, inject, signal } from '@angular/core';

import { Observable, catchError, concatMap, finalize, from, map, of, tap, toArray } from 'rxjs';

import { MeasurementsApiService } from '@features/service/measurements.api.service';
import { MeasurementsAdvancedFilters } from '@features/filter/measurements.filters';
import { ListQueryDto } from '@shared/features/list-query/list-query.types';
import {
  MeasurementDecisionInput,
  MeasurementModel,
  MeasurementBatchApproveResult,
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

  /** Aprova N medições selecionadas (checkbox na tela "Medições") - não existe endpoint em lote no
   *  backend (cada aprovação tem efeito colateral independente por obra, ver
   *  MeasurementService.approveMeasurement/PaymentOrderService.createFromMeasurement, então não há
   *  invariante entre itens do lote que exija tudo-ou-nada como em InstallmentService.send).
   *  Reaproveita o endpoint de aprovação individual (api.approve), uma chamada por medição, EM
   *  SÉRIE (concatMap, não em paralelo) - evita disputar a mesma obra concorrentemente dentro do
   *  próprio lote, e mantém best-effort: cada item tem seu próprio resultado (sucesso ou erro),
   *  então uma medição que falhe (ex.: valor excede o total da obra) não desfaz as demais que já
   *  passaram. reloadLast() só UMA vez ao final (não por item, que recarregaria a lista N vezes). */
  approveMany(
    ids: string[],
    input: MeasurementDecisionInput,
  ): Observable<MeasurementBatchApproveResult[]> {
    return from(ids).pipe(
      concatMap((id) =>
        this.api.approve(id, input).pipe(
          map((): MeasurementBatchApproveResult => ({ id, success: true })),
          catchError((error) => of<MeasurementBatchApproveResult>({ id, success: false, error })),
        ),
      ),
      toArray(),
      tap(() => this.reloadLast()),
    );
  }

  delete(id: string): Observable<void> {
    return this.api.delete(id).pipe(tap(() => this.reloadLast()));
  }
}

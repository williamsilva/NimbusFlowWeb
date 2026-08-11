import { Injectable, inject, signal } from '@angular/core';

import { Observable, finalize, tap } from 'rxjs';

import { InstallmentsApiService } from '@features/service/installments.api.service';
import { InstallmentsAdvancedFilters } from '@features/filter/installments.filters';
import { ListQueryDto } from '@shared/features/list-query/list-query.types';
import { InstallmentModel, InstallmentWithWorkModel } from '@models/installments.models';

type LastQuery = ListQueryDto<InstallmentsAdvancedFilters>;

/**
 * Estado separado de InstallmentsFacade (que é por obra) - a listagem global (menu "Pagamentos",
 * todas as obras) precisa do campo workName e é paginada/filtrada/ordenada no backend (mesmo
 * padrão de WorksFacade), recarregando a última página buscada (reloadLast()) após liberar/marcar
 * como pago.
 */
@Injectable({ providedIn: 'root' })
export class InstallmentsGlobalFacade {
  private readonly api = inject(InstallmentsApiService);

  private readonly _total = signal(0);
  private readonly _loading = signal(false);
  private readonly _loadedOnce = signal(false);
  private readonly _items = signal<InstallmentWithWorkModel[]>([]);
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

  release(id: string): Observable<InstallmentModel> {
    return this.api.release(id).pipe(tap(() => this.reloadLast()));
  }

  markPaid(id: string): Observable<InstallmentModel> {
    return this.api.markPaid(id).pipe(tap(() => this.reloadLast()));
  }
}

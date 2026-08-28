import { Injectable, inject, signal } from '@angular/core';

import { Observable, finalize, tap } from 'rxjs';

import { PaymentsApiService } from '@features/service/payments.api.service';
import { PaymentsAdvancedFilters } from '@features/filter/payments.filters';
import { ListQueryDto } from '@shared/features/list-query/list-query.types';
import { PaymentModel } from '@models/payments.models';

type LastQuery = ListQueryDto<PaymentsAdvancedFilters>;

/** Estado da listagem paginada/filtrada/ordenada da tela "Pagamentos" (mesmo padrão de
 *  InstallmentsGlobalFacade, do lado da Ordem), recarregando a última página buscada
 *  (reloadLast()) depois de marcar como pago. */
@Injectable({ providedIn: 'root' })
export class PaymentsFacade {
  private readonly api = inject(PaymentsApiService);

  private readonly _total = signal(0);
  private readonly _loading = signal(false);
  private readonly _loadedOnce = signal(false);
  private readonly _items = signal<PaymentModel[]>([]);
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

  markPaid(id: string, paidAt: string): Observable<PaymentModel> {
    return this.api.markPaid(id, paidAt).pipe(tap(() => this.reloadLast()));
  }

  /** Não altera nada no Pagamento (só reenvia um e-mail) - sem necessidade de reloadLast() como
   *  markPaid faz. */
  resendNotification(id: string): Observable<PaymentModel> {
    return this.api.resendNotification(id);
  }

  /** Desfaz markAsPaid - volta o Pagamento de PAID pra SENT. */
  undoMarkPaid(id: string): Observable<PaymentModel> {
    return this.api.undoMarkPaid(id).pipe(tap(() => this.reloadLast()));
  }

  /** Desfaz o envio - o Pagamento deixa de existir (cada Ordem incluída volta pra
   *  MEASUREMENT_APPROVED). */
  undoSend(id: string): Observable<void> {
    return this.api.undoSend(id).pipe(tap(() => this.reloadLast()));
  }
}

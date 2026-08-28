import { Injectable, inject, signal } from '@angular/core';

import { Observable, finalize, tap } from 'rxjs';

import { InstallmentsApiService } from '@features/service/installments.api.service';
import { InstallmentsAdvancedFilters } from '@features/filter/installments.filters';
import { ListQueryDto } from '@shared/features/list-query/list-query.types';
import {
  InstallmentModel,
  InstallmentWithWorkModel,
  SendPaymentOrderResultModel,
} from '@models/installments.models';

type LastQuery = ListQueryDto<InstallmentsAdvancedFilters>;

/**
 * Estado separado de InstallmentsFacade (que é por obra) - a listagem global (menu "Parcelas
 * Liberadas", todas as obras) precisa do campo workName e é paginada/filtrada/ordenada no backend
 * (mesmo padrão de WorksFacade), recarregando a última página buscada (reloadLast()) após
 * liberar/reenviar notificação/enviar. Só mostra Ordens que ainda não entraram num envio - uma
 * vez enviada (sendPaymentOrder), a Ordem some da lista no reload; ver PaymentsFacade pro
 * Pagamento em si.
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

  resendNotification(id: string): Observable<InstallmentModel> {
    return this.api.resendNotification(id).pipe(tap(() => this.reloadLast()));
  }

  /** Ordens enviadas ganham installmentId - somem da lista (ver PaymentOrderService.
   *  filterOrders) no reload, por isso reloadLast() aqui também. */
  sendPaymentOrder(paymentOrderIds: string[]): Observable<SendPaymentOrderResultModel> {
    return this.api.sendPaymentOrder(paymentOrderIds).pipe(tap(() => this.reloadLast()));
  }

  /** Cancela a Ordem (ainda não enviada) e reabre a Medição que a gerou pra PENDING. */
  cancel(id: string): Observable<unknown> {
    return this.api.cancel(id).pipe(tap(() => this.reloadLast()));
  }
}

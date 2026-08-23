import { Injectable, inject, signal } from '@angular/core';

import { Observable, finalize, tap } from 'rxjs';

import { PaymentsApiService } from '@features/service/payments.api.service';
import { PaymentModel } from '@models/payments.models';

@Injectable({ providedIn: 'root' })
export class PaymentsFacade {
  private readonly api = inject(PaymentsApiService);

  private readonly _loading = signal(false);
  private readonly _loadedOnce = signal(false);
  private readonly _items = signal<PaymentModel[]>([]);

  readonly loading = this._loading.asReadonly();
  readonly loadedOnce = this._loadedOnce.asReadonly();
  readonly items = this._items.asReadonly();

  loadAll(): void {
    this._loading.set(true);

    this.api
      .findAll()
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

  markPaid(id: string, paidAt: string): Observable<PaymentModel> {
    return this.api.markPaid(id, paidAt).pipe(tap(() => this.loadAll()));
  }
}

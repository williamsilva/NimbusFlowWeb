import { Injectable, inject, signal } from '@angular/core';

import { Observable, finalize, tap } from 'rxjs';

import { InstallmentsApiService } from '@features/service/installments.api.service';
import { InstallmentModel } from '@models/installments.models';

@Injectable({ providedIn: 'root' })
export class InstallmentsFacade {
  private readonly api = inject(InstallmentsApiService);

  private readonly _loading = signal(false);
  private readonly _loadedOnce = signal(false);
  private readonly _items = signal<InstallmentModel[]>([]);
  private readonly _workId = signal<string | null>(null);

  readonly loading = this._loading.asReadonly();
  readonly loadedOnce = this._loadedOnce.asReadonly();
  readonly items = this._items.asReadonly();

  loadByWork(workId: string): void {
    this._workId.set(workId);
    this._loading.set(true);

    this.api
      .findByWork(workId)
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

  private reload(): void {
    const workId = this._workId();
    if (workId) {
      this.loadByWork(workId);
    }
  }

  release(id: string): Observable<InstallmentModel> {
    return this.api.release(id).pipe(tap(() => this.reload()));
  }

  markPaid(id: string, paidAt: string): Observable<InstallmentModel> {
    return this.api.markPaid(id, paidAt).pipe(tap(() => this.reload()));
  }

  resendNotification(id: string): Observable<InstallmentModel> {
    return this.api.resendNotification(id).pipe(tap(() => this.reload()));
  }
}

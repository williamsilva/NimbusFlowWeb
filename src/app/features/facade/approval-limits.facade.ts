import { Injectable, inject, signal } from '@angular/core';

import { Observable, finalize, tap } from 'rxjs';

import { ApprovalLimitsApiService } from '@features/service/approval-limits.api.service';
import { ApprovalLimitInput, ApprovalLimitModel } from '@models/approval-limits.models';

@Injectable({ providedIn: 'root' })
export class ApprovalLimitsFacade {
  private readonly api = inject(ApprovalLimitsApiService);

  private readonly _loading = signal(false);
  private readonly _loadedOnce = signal(false);
  private readonly _items = signal<ApprovalLimitModel[]>([]);

  readonly loading = this._loading.asReadonly();
  readonly loadedOnce = this._loadedOnce.asReadonly();
  readonly items = this._items.asReadonly();

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

  create(input: ApprovalLimitInput): Observable<ApprovalLimitModel> {
    return this.api.create(input).pipe(tap(() => this.load()));
  }

  update(id: string, input: ApprovalLimitInput): Observable<ApprovalLimitModel> {
    return this.api.update(id, input).pipe(tap(() => this.load()));
  }

  delete(id: string): Observable<void> {
    return this.api.delete(id).pipe(tap(() => this.load()));
  }
}

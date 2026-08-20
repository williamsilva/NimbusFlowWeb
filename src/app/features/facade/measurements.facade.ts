import { Injectable, inject, signal } from '@angular/core';

import { Observable, finalize, tap } from 'rxjs';

import { MeasurementsApiService } from '@features/service/measurements.api.service';
import {
  MeasurementDecisionInput,
  MeasurementModel,
  MeasurementSubmitInput,
  MeasurementUpdateInput,
} from '@models/measurements.models';

@Injectable({ providedIn: 'root' })
export class MeasurementsFacade {
  private readonly api = inject(MeasurementsApiService);

  private readonly _loading = signal(false);
  private readonly _loadedOnce = signal(false);
  private readonly _items = signal<MeasurementModel[]>([]);
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

  submit(workId: string, input: MeasurementSubmitInput): Observable<MeasurementModel> {
    return this.api.submit(workId, input).pipe(tap(() => this.reload()));
  }

  update(id: string, input: MeasurementUpdateInput): Observable<MeasurementModel> {
    return this.api.update(id, input).pipe(tap(() => this.reload()));
  }

  approve(id: string, input: MeasurementDecisionInput): Observable<MeasurementModel> {
    return this.api.approve(id, input).pipe(tap(() => this.reload()));
  }

  reject(id: string, input: MeasurementDecisionInput): Observable<MeasurementModel> {
    return this.api.reject(id, input).pipe(tap(() => this.reload()));
  }
}

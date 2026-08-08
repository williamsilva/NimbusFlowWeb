import { Injectable, inject, signal } from '@angular/core';

import { Observable, finalize, tap } from 'rxjs';

import { WorksApiService } from '@features/service/works.api.service';
import { WorksAdvancedFilters } from '@features/filter/works.filters';
import { ListQueryDto } from '@shared/features/list-query/list-query.types';
import { WorkModel, WorkUpsertInput } from '@models/works.models';

type LastQuery = ListQueryDto<WorksAdvancedFilters>;

@Injectable({ providedIn: 'root' })
export class WorksFacade {
  private readonly api = inject(WorksApiService);

  private readonly _total = signal(0);
  private readonly _loading = signal(false);
  private readonly _loadedOnce = signal(false);
  private readonly _data = signal<WorkModel[]>([]);
  private readonly _lastQuery = signal<LastQuery | null>(null);

  readonly loading = this._loading.asReadonly();
  readonly works = this._data.asReadonly();
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

  getById(id: string): Observable<WorkModel> {
    return this.api.getById(id);
  }

  create(input: WorkUpsertInput): Observable<WorkModel> {
    this._loading.set(true);
    return this.api.create(input).pipe(
      tap(() => this.reloadLast()),
      finalize(() => this._loading.set(false)),
    );
  }

  update(id: string, input: WorkUpsertInput): Observable<WorkModel> {
    this._loading.set(true);
    return this.api.update(id, input).pipe(
      tap(() => this.reloadLast()),
      finalize(() => this._loading.set(false)),
    );
  }
}

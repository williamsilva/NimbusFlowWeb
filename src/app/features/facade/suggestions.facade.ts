import { Injectable, inject, signal } from '@angular/core';

import { Observable, finalize, tap } from 'rxjs';

import { SuggestionsApiService } from '@features/service/suggestions.api.service';
import { SuggestionsAdvancedFilters } from '@features/filter/suggestions.filters';
import { ListQueryDto } from '@shared/features/list-query/list-query.types';
import { SuggestionStatusEnum } from '@models/enums/suggestion-status.enum';
import { SuggestionModel, SuggestionCreateInput } from '@models/suggestions.models';

type LastQuery = ListQueryDto<SuggestionsAdvancedFilters>;

@Injectable({ providedIn: 'root' })
export class SuggestionsFacade {
  private readonly api = inject(SuggestionsApiService);

  private readonly _total = signal(0);
  private readonly _loading = signal(false);
  private readonly _loadedOnce = signal(false);
  private readonly _data = signal<SuggestionModel[]>([]);
  private readonly _lastQuery = signal<LastQuery | null>(null);

  readonly loading = this._loading.asReadonly();
  readonly totalRecords = this._total.asReadonly();
  readonly loadedOnce = this._loadedOnce.asReadonly();
  readonly suggestions = this._data.asReadonly();

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

  create(input: SuggestionCreateInput): Observable<SuggestionModel> {
    this._loading.set(true);
    return this.api.create(input).pipe(
      tap(() => this.reloadLast()),
      finalize(() => this._loading.set(false)),
    );
  }

  updateStatus(id: string, status: SuggestionStatusEnum): Observable<SuggestionModel> {
    return this.api.updateStatus(id, status).pipe(tap(() => this.reloadLast()));
  }
}

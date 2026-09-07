import { Injectable, inject, signal } from '@angular/core';

import { Observable, finalize, tap } from 'rxjs';

import { TicketsApiService } from '@features/service/tickets.api.service';
import { TicketsAdvancedFilters } from '@features/filter/tickets.filters';
import { ListQueryDto } from '@williamsilva/nimbus-web-commons';
import {
  TicketModel,
  TicketCreateInput,
  TicketUpsertInput,
  TicketCloseInput,
  TicketWorkLinkInput,
} from '@models/tickets.models';

type LastQuery = ListQueryDto<TicketsAdvancedFilters>;

@Injectable({ providedIn: 'root' })
export class TicketsFacade {
  private readonly api = inject(TicketsApiService);

  private readonly _total = signal(0);
  private readonly _loading = signal(false);
  private readonly _loadedOnce = signal(false);
  private readonly _data = signal<TicketModel[]>([]);
  private readonly _lastQuery = signal<LastQuery | null>(null);

  readonly loading = this._loading.asReadonly();
  readonly tickets = this._data.asReadonly();
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

  /**
   * Sem marcar `_loading` aqui (mesmo motivo de SuggestionsFacade/WorksFacade): esse signal é o
   * guard de `loadPage()`, e setá-lo antes de chamar a API bloquearia silenciosamente o
   * `reloadLast()` do `tap` abaixo.
   */
  create(input: TicketCreateInput): Observable<TicketModel> {
    return this.api.create(input).pipe(tap(() => this.reloadLast()));
  }

  update(id: string, input: TicketUpsertInput): Observable<TicketModel> {
    return this.api.update(id, input).pipe(tap(() => this.reloadLast()));
  }

  close(id: string, input: TicketCloseInput): Observable<TicketModel> {
    return this.api.close(id, input).pipe(tap(() => this.reloadLast()));
  }

  cancel(id: string): Observable<TicketModel> {
    return this.api.cancel(id).pipe(tap(() => this.reloadLast()));
  }

  linkWork(id: string, input: TicketWorkLinkInput): Observable<TicketModel> {
    return this.api.linkWork(id, input).pipe(tap(() => this.reloadLast()));
  }
}

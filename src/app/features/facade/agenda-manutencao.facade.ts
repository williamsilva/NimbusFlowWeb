import { Injectable, inject, signal } from '@angular/core';

import { Observable, finalize, tap } from 'rxjs';

import { AgendaManutencaoApiService } from '@features/service/agenda-manutencao.api.service';
import { AgendaManutencaoModel, AgendaManutencaoUpsertInput } from '@models/agenda-manutencao.models';

@Injectable({ providedIn: 'root' })
export class AgendaManutencaoFacade {
  private readonly api = inject(AgendaManutencaoApiService);

  private readonly _loading = signal(false);
  private readonly _loadedOnce = signal(false);
  private readonly _items = signal<AgendaManutencaoModel[]>([]);

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

  create(input: AgendaManutencaoUpsertInput): Observable<AgendaManutencaoModel> {
    return this.api.create(input).pipe(tap(() => this.load()));
  }

  update(id: string, input: AgendaManutencaoUpsertInput): Observable<AgendaManutencaoModel> {
    return this.api.update(id, input).pipe(tap(() => this.load()));
  }

  delete(id: string): Observable<void> {
    return this.api.delete(id).pipe(tap(() => this.load()));
  }
}

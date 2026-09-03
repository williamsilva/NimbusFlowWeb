import { Injectable, inject, signal } from '@angular/core';

import { Observable, finalize, tap } from 'rxjs';

import { EquipamentosFacade } from '@features/facade/equipamentos.facade';
import { ManutencoesApiService } from '@features/service/manutencoes.api.service';
import { ManutencoesAdvancedFilters } from '@features/filter/manutencoes.filters';
import { ListQueryDto } from '@shared/features/list-query/list-query.types';
import { ManutencaoModel, ManutencaoUpsertInput } from '@models/manutencoes.models';

type LastQuery = ListQueryDto<ManutencoesAdvancedFilters>;

@Injectable({ providedIn: 'root' })
export class ManutencoesFacade {
  private readonly api = inject(ManutencoesApiService);
  private readonly equipamentosFacade = inject(EquipamentosFacade);

  private readonly _total = signal(0);
  private readonly _loading = signal(false);
  private readonly _loadedOnce = signal(false);
  private readonly _items = signal<ManutencaoModel[]>([]);
  private readonly _lastQuery = signal<LastQuery | null>(null);

  readonly loading = this._loading.asReadonly();
  readonly loadedOnce = this._loadedOnce.asReadonly();
  readonly items = this._items.asReadonly();
  readonly totalRecords = this._total.asReadonly();

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

  /** Toda mutação também recarrega Equipamentos: abrir/receber uma manutenção move o Equipamento
   *  entre Almoxarifado/Autorizada no backend (ver ManutencaoService) - sem isto, a tela de
   *  Equipamentos ficaria com o status desatualizado até um refresh manual. */
  create(input: ManutencaoUpsertInput): Observable<ManutencaoModel> {
    return this.api.create(input).pipe(
      tap(() => {
        this.reloadLast();
        this.equipamentosFacade.load();
      }),
    );
  }

  update(id: string, input: ManutencaoUpsertInput): Observable<ManutencaoModel> {
    return this.api.update(id, input).pipe(
      tap(() => {
        this.reloadLast();
        this.equipamentosFacade.load();
      }),
    );
  }

  delete(id: string): Observable<void> {
    return this.api.delete(id).pipe(tap(() => this.reloadLast()));
  }
}

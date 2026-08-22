import { Injectable, inject, signal } from '@angular/core';

import { Observable, finalize, tap } from 'rxjs';

import { EquipamentosFacade } from '@features/facade/equipamentos.facade';
import { ManutencoesApiService } from '@features/service/manutencoes.api.service';
import { ManutencaoModel, ManutencaoUpsertInput } from '@models/manutencoes.models';

@Injectable({ providedIn: 'root' })
export class ManutencoesFacade {
  private readonly api = inject(ManutencoesApiService);
  private readonly equipamentosFacade = inject(EquipamentosFacade);

  private readonly _loading = signal(false);
  private readonly _loadedOnce = signal(false);
  private readonly _items = signal<ManutencaoModel[]>([]);

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

  /** Toda mutação também recarrega Equipamentos: abrir/receber uma manutenção move o Equipamento
   *  entre Almoxarifado/Autorizada no backend (ver ManutencaoService) - sem isto, a tela de
   *  Equipamentos ficaria com o status desatualizado até um refresh manual. */
  create(input: ManutencaoUpsertInput): Observable<ManutencaoModel> {
    return this.api.create(input).pipe(
      tap(() => {
        this.load();
        this.equipamentosFacade.load();
      }),
    );
  }

  update(id: string, input: ManutencaoUpsertInput): Observable<ManutencaoModel> {
    return this.api.update(id, input).pipe(
      tap(() => {
        this.load();
        this.equipamentosFacade.load();
      }),
    );
  }

  delete(id: string): Observable<void> {
    return this.api.delete(id).pipe(tap(() => this.load()));
  }
}

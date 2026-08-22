import { Injectable, inject, signal } from '@angular/core';

import { Observable, finalize, tap } from 'rxjs';

import { EquipamentosApiService } from '@features/service/equipamentos.api.service';
import {
  EquipamentoModel,
  EquipamentoOptionModel,
  EquipamentoUpsertInput,
} from '@models/equipamentos.models';

/** Também consumido por Manutenções/Agenda de Manutenção/Histórico (via `options`) pro seletor de
 *  Equipamento em seus formulários - centralizado aqui em vez de duplicado em cada facade. */
@Injectable({ providedIn: 'root' })
export class EquipamentosFacade {
  private readonly api = inject(EquipamentosApiService);

  private readonly _loading = signal(false);
  private readonly _loadedOnce = signal(false);
  private readonly _items = signal<EquipamentoModel[]>([]);

  private readonly _options = signal<EquipamentoOptionModel[]>([]);
  private readonly _optionsLoadedOnce = signal(false);

  readonly loading = this._loading.asReadonly();
  readonly loadedOnce = this._loadedOnce.asReadonly();
  readonly items = this._items.asReadonly();
  readonly options = this._options.asReadonly();

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

  loadOptions(force = false): void {
    if (!force && this._optionsLoadedOnce()) return;

    this.api.options().subscribe({
      next: (items) => {
        this._options.set(items);
        this._optionsLoadedOnce.set(true);
      },
      error: () => {
        this._options.set([]);
        this._optionsLoadedOnce.set(true);
      },
    });
  }

  create(input: EquipamentoUpsertInput): Observable<EquipamentoModel> {
    return this.api.create(input).pipe(tap(() => this.load()));
  }

  update(id: string, input: EquipamentoUpsertInput): Observable<EquipamentoModel> {
    return this.api.update(id, input).pipe(tap(() => this.load()));
  }
}

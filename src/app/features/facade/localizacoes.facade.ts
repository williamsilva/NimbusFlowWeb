import { Injectable, inject, signal } from '@angular/core';

import { Observable, finalize, tap } from 'rxjs';

import { LocalizacoesApiService } from '@features/service/localizacoes.api.service';
import {
  LocalizacaoModel,
  LocalizacaoOptionModel,
  LocalizacaoUpsertInput,
} from '@models/localizacoes.models';

/** Também consumido pelo formulário de Histórico de Localização (via `options`). */
@Injectable({ providedIn: 'root' })
export class LocalizacoesFacade {
  private readonly api = inject(LocalizacoesApiService);

  private readonly _loading = signal(false);
  private readonly _loadedOnce = signal(false);
  private readonly _items = signal<LocalizacaoModel[]>([]);

  private readonly _options = signal<LocalizacaoOptionModel[]>([]);
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

  create(input: LocalizacaoUpsertInput): Observable<LocalizacaoModel> {
    return this.api.create(input).pipe(tap(() => this.load()));
  }

  update(id: string, input: LocalizacaoUpsertInput): Observable<LocalizacaoModel> {
    return this.api.update(id, input).pipe(tap(() => this.load()));
  }

  delete(id: string): Observable<void> {
    return this.api.delete(id).pipe(tap(() => this.load()));
  }
}

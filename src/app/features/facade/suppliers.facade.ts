import { Injectable, inject, signal } from '@angular/core';

import { Observable, finalize, tap } from 'rxjs';

import { SuppliersApiService } from '@features/service/suppliers.api.service';
import { SuppliersAdvancedFilters } from '@features/filter/suppliers.filters';
import { ListQueryDto } from '@williamsilva/nimbus-web-commons';
import { SelectOptionGroup } from '@models/select-option.model';
import { SupplierModel, SupplierUpsertInput } from '@models/suppliers.models';

type LastQuery = ListQueryDto<SuppliersAdvancedFilters>;

@Injectable({ providedIn: 'root' })
export class SuppliersFacade {
  private readonly api = inject(SuppliersApiService);

  private readonly _total = signal(0);
  private readonly _loading = signal(false);
  private readonly _loadedOnce = signal(false);
  private readonly _optionsLoading = signal(false);
  private readonly _data = signal<SupplierModel[]>([]);
  private readonly _optionsLoadedOnce = signal(false);
  private readonly _lastQuery = signal<LastQuery | null>(null);
  private readonly _options = signal<SelectOptionGroup<string>[]>([]);

  readonly loading = this._loading.asReadonly();
  readonly suppliers = this._data.asReadonly();
  readonly options = this._options.asReadonly();
  readonly totalRecords = this._total.asReadonly();
  readonly loadedOnce = this._loadedOnce.asReadonly();
  readonly optionsLoading = this._optionsLoading.asReadonly();
  readonly optionsLoadedOnce = this._optionsLoadedOnce.asReadonly();

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

  /** Options ativas+inativas - quem consome (ex.: seletor de Obra) filtra por `active` se quiser. */
  loadSupplierOptions(force = false): void {
    if (this._optionsLoading()) return;
    if (!force && this._optionsLoadedOnce()) return;

    this._optionsLoading.set(true);

    this.api
      .options()
      .pipe(
        finalize(() => {
          this._optionsLoading.set(false);
          this._optionsLoadedOnce.set(true);
        }),
      )
      .subscribe({
        next: (list) => {
          this._options.set(
            (list ?? [])
              .filter((s) => s.active)
              .map((s) => ({ label: s.companyName, value: s.id, description: '' })),
          );
        },
        error: () => {
          this._options.set([]);
        },
      });
  }

  reloadOptions(): void {
    this._optionsLoadedOnce.set(false);
    this.loadSupplierOptions(true);
  }

  getById(id: string): Observable<SupplierModel> {
    return this.api.getById(id);
  }

  /**
   * Sem marcar `_loading` aqui: esse signal é o guard de `loadPage()` (evita corrida entre
   * paginações concorrentes) - se create/update/deactivate também o setassem antes de chamar a
   * API, o `reloadLast()` do `tap` abaixo rodaria enquanto `_loading` ainda está `true` (o `next`
   * do tap sempre roda antes do `finalize` do próprio create/update, mesmo com uma única emissão)
   * e o guard de `loadPage()` bloquearia silenciosamente o reload - mesmo bug corrigido em
   * WorksFacade. `reloadLast()`/`loadPage()` já controlam seu próprio `_loading` sem ajuda externa.
   */
  create(input: SupplierUpsertInput): Observable<SupplierModel> {
    return this.api.create(input).pipe(
      tap(() => {
        this.reloadLast();
        this.reloadOptions();
      }),
    );
  }

  update(id: string, input: SupplierUpsertInput): Observable<SupplierModel> {
    return this.api.update(id, input).pipe(
      tap(() => {
        this.reloadLast();
        this.reloadOptions();
      }),
    );
  }

  deactivate(id: string): Observable<void> {
    return this.api.deactivate(id).pipe(
      tap(() => {
        this.reloadLast();
        this.reloadOptions();
      }),
    );
  }

  activate(id: string): Observable<void> {
    return this.api.activate(id).pipe(
      tap(() => {
        this.reloadLast();
        this.reloadOptions();
      }),
    );
  }
}

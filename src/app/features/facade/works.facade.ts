import { Injectable, inject, signal } from '@angular/core';

import { Observable, finalize, tap } from 'rxjs';

import { WorksApiService } from '@features/service/works.api.service';
import { WorksAdvancedFilters } from '@features/filter/works.filters';
import { WorkStatusEnum } from '@models/enums/work-status.enum';
import { ListQueryDto } from '@williamsilva/nimbus-web-commons';
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

  private readonly _options = signal<{ label: string; value: string; status: WorkStatusEnum }[]>([]);
  private readonly _optionsLoadedOnce = signal(false);

  readonly loading = this._loading.asReadonly();
  readonly works = this._data.asReadonly();
  readonly totalRecords = this._total.asReadonly();
  readonly loadedOnce = this._loadedOnce.asReadonly();
  readonly options = this._options.asReadonly();

  /** Pro multiselect de Frente de Serviço em Chamados/Planos de Ação/Dashboard/Medições/Parcelas/
   *  Aditivos e no diálogo de criação de Obra - consome `/works/options` (sem gate de permissão no
   *  backend), não `findAll()` (que agora exige OBRA_CONSULT, só usado pela própria tela de
   *  Obras). */
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

  /**
   * Sem marcar `_loading` aqui: esse signal é o guard de `loadPage()` (evita corrida entre
   * paginações concorrentes) - se create/update também o setassem antes de chamar a API, o
   * `reloadLast()` do `tap` abaixo rodaria enquanto `_loading` ainda está `true` (o `next` do tap
   * sempre roda antes do `finalize` do próprio create/update, mesmo com uma única emissão) e o
   * guard de `loadPage()` bloquearia silenciosamente o reload - é exatamente por isso que salvar
   * uma Frente de Serviço não atualizava a listagem. `reloadLast()`/`loadPage()` já controlam seu
   * próprio `_loading` sem ajuda externa.
   */
  create(input: WorkUpsertInput): Observable<WorkModel> {
    return this.api.create(input).pipe(tap(() => this.reloadLast()));
  }

  update(id: string, input: WorkUpsertInput): Observable<WorkModel> {
    return this.api.update(id, input).pipe(tap(() => this.reloadLast()));
  }

  delete(id: string): Observable<void> {
    return this.api.delete(id).pipe(tap(() => this.reloadLast()));
  }
}

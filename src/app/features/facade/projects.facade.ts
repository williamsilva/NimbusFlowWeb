import { Injectable, computed, inject, signal } from '@angular/core';

import { Observable, finalize, tap } from 'rxjs';

import { ProjectsApiService } from '@features/service/projects.api.service';
import { ProjectsAdvancedFilters } from '@features/filter/projects.filters';
import { ListQueryDto } from '@shared/features/list-query/list-query.types';
import { ProjectStatusEnum } from '@models/enums/project-status.enum';
import { ProjectModel, ProjectOptionModel, ProjectUpsertInput } from '@models/projects.models';

type LastQuery = ListQueryDto<ProjectsAdvancedFilters>;

@Injectable({ providedIn: 'root' })
export class ProjectsFacade {
  private readonly api = inject(ProjectsApiService);

  // Cache completo (sem paginação, findAll() - exige PROJETO_CONSULT) - usado só pelo widget de
  // Projetos do Dashboard, que mostra dados financeiros de verdade (contratado/pago/restante).
  private readonly _loading = signal(false);
  private readonly _loadedOnce = signal(false);
  private readonly _items = signal<ProjectModel[]>([]);

  readonly loading = this._loading.asReadonly();
  readonly loadedOnce = this._loadedOnce.asReadonly();
  readonly items = this._items.asReadonly();

  // Lista leve (options() - sem gate de permissão) - usada como opções em outras telas (filtro/
  // formulário de Frente de Serviço, planta do Projeto em Medições), nunca pela tela de listagem
  // de Projetos nem pelo widget financeiro do Dashboard (esses usam _items/loadAll acima).
  private readonly _optionsLoading = signal(false);
  private readonly _optionsLoadedOnce = signal(false);
  private readonly _optionsItems = signal<ProjectOptionModel[]>([]);

  readonly optionsItems = this._optionsItems.asReadonly();

  // Paginado (StatefulListPage) - usado só pela tela de listagem de Projetos.
  private readonly _total = signal(0);
  private readonly _pagedLoading = signal(false);
  private readonly _pagedLoadedOnce = signal(false);
  private readonly _pagedItems = signal<ProjectModel[]>([]);
  private readonly _lastQuery = signal<LastQuery | null>(null);

  readonly projects = this._pagedItems.asReadonly();
  readonly totalRecords = this._total.asReadonly();
  readonly projectsLoading = this._pagedLoading.asReadonly();
  readonly projectsLoadedOnce = this._pagedLoadedOnce.asReadonly();

  /** Opções gerais de Projeto (filtro da listagem de Frentes de Serviço, filtro do dashboard) - todos os status. */
  readonly options = computed(() => this.optionsItems().map((p) => ({ label: p.name, value: p.id })));

  /**
   * Opções pro seletor de Projeto no formulário de Frente de Serviço (Work) - só projetos
   * Em andamento ou Pausado aceitam novas frentes de serviço (Planejado ainda não iniciou,
   * Concluído/Cancelado não recebem mais nada).
   */
  readonly assignableOptions = computed(() =>
    this.optionsItems()
      .filter(
        (p) => p.status === ProjectStatusEnum.IN_PROGRESS || p.status === ProjectStatusEnum.PAUSED,
      )
      .map((p) => ({ label: p.name, value: p.id })),
  );

  loadAll(force = false): void {
    if (this._loading()) return;
    if (!force && this._loadedOnce()) return;

    this._loading.set(true);
    this.api.findAll().subscribe({
      next: (items) => {
        this._items.set(items);
        this._loading.set(false);
        this._loadedOnce.set(true);
      },
      error: () => {
        this._items.set([]);
        this._loading.set(false);
        this._loadedOnce.set(true);
      },
    });
  }

  /** Pro multiselect de Projeto em Obras/Dashboard e no diálogo de criação de Obra, e pra
   *  resolver a planta do Projeto em Medições - consome /projects/options (sem gate de
   *  permissão), não findAll() (que agora exige PROJETO_CONSULT, só usado pelo widget financeiro
   *  do Dashboard via loadAll() acima). */
  loadOptions(force = false): void {
    if (this._optionsLoading()) return;
    if (!force && this._optionsLoadedOnce()) return;

    this._optionsLoading.set(true);
    this.api.options().subscribe({
      next: (items) => {
        this._optionsItems.set(items);
        this._optionsLoading.set(false);
        this._optionsLoadedOnce.set(true);
      },
      error: () => {
        this._optionsItems.set([]);
        this._optionsLoading.set(false);
        this._optionsLoadedOnce.set(true);
      },
    });
  }

  /**
   * Sem marcar `_pagedLoading` aqui - mesmo motivo do WorksFacade.create/update: esse signal é o
   * guard de loadPage() (evita corrida entre paginações concorrentes), e reloadLast()/loadPage()
   * já controlam seu próprio estado sem ajuda externa.
   */
  loadPage(q: LastQuery): void {
    if (this._pagedLoading()) return;

    this._pagedLoading.set(true);
    this._lastQuery.set(q);

    this.api
      .searchPaged(q)
      .pipe(
        finalize(() => {
          this._pagedLoading.set(false);
          this._pagedLoadedOnce.set(true);
        }),
      )
      .subscribe({
        next: (res) => {
          this._pagedItems.set(res?._embedded?.content ?? []);
          this._total.set(res?.page?.totalElements ?? 0);
        },
        error: () => {
          this._pagedItems.set([]);
          this._total.set(0);
        },
      });
  }

  reloadLast(): void {
    const last = this._lastQuery();
    if (!last) return;

    this.loadPage(last);
  }

  getById(id: string): Observable<ProjectModel> {
    return this.api.getById(id);
  }

  create(input: ProjectUpsertInput): Observable<ProjectModel> {
    return this.api.create(input).pipe(
      tap(() => {
        this.reloadLast();
        this.loadAll(true);
        this.loadOptions(true);
      }),
    );
  }

  update(id: string, input: ProjectUpsertInput): Observable<ProjectModel> {
    return this.api.update(id, input).pipe(
      tap(() => {
        this.reloadLast();
        this.loadAll(true);
        this.loadOptions(true);
      }),
    );
  }

  uploadSitePlan(id: string, file: File): Observable<ProjectModel> {
    return this.api.uploadSitePlan(id, file).pipe(
      tap(() => {
        this.reloadLast();
        this.loadAll(true);
        this.loadOptions(true);
      }),
    );
  }

  changeStatus(id: string, status: ProjectStatusEnum): Observable<ProjectModel> {
    return this.api.changeStatus(id, status).pipe(
      tap(() => {
        this.reloadLast();
        this.loadAll(true);
        this.loadOptions(true);
      }),
    );
  }
}

import { Injectable, computed, inject, signal } from '@angular/core';

import { Observable, finalize, tap } from 'rxjs';

import { ProjectsApiService } from '@features/service/projects.api.service';
import { ProjectsAdvancedFilters } from '@features/filter/projects.filters';
import { ListQueryDto } from '@shared/features/list-query/list-query.types';
import { ProjectStatusEnum } from '@models/enums/project-status.enum';
import { ProjectModel, ProjectUpsertInput } from '@models/projects.models';

type LastQuery = ListQueryDto<ProjectsAdvancedFilters>;

@Injectable({ providedIn: 'root' })
export class ProjectsFacade {
  private readonly api = inject(ProjectsApiService);

  // Cache completo (sem paginação) - usado como opções em outras telas (filtro/formulário de
  // Frente de Serviço, ver options/assignableOptions), não pela tela de listagem de Projetos.
  private readonly _loading = signal(false);
  private readonly _loadedOnce = signal(false);
  private readonly _items = signal<ProjectModel[]>([]);

  readonly loading = this._loading.asReadonly();
  readonly loadedOnce = this._loadedOnce.asReadonly();
  readonly items = this._items.asReadonly();

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
  readonly options = computed(() => this.items().map((p) => ({ label: p.name, value: p.id })));

  /**
   * Opções pro seletor de Projeto no formulário de Frente de Serviço (Work) - só projetos
   * Em andamento ou Pausado aceitam novas frentes de serviço (Planejado ainda não iniciou,
   * Concluído/Cancelado não recebem mais nada).
   */
  readonly assignableOptions = computed(() =>
    this.items()
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
      }),
    );
  }

  update(id: string, input: ProjectUpsertInput): Observable<ProjectModel> {
    return this.api.update(id, input).pipe(
      tap(() => {
        this.reloadLast();
        this.loadAll(true);
      }),
    );
  }

  uploadSitePlan(id: string, file: File): Observable<ProjectModel> {
    return this.api.uploadSitePlan(id, file).pipe(
      tap(() => {
        this.reloadLast();
        this.loadAll(true);
      }),
    );
  }
}

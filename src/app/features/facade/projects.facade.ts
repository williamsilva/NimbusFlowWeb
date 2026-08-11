import { Injectable, computed, inject, signal } from '@angular/core';

import { Observable, tap } from 'rxjs';

import { ProjectsApiService } from '@features/service/projects.api.service';
import { ProjectStatusEnum } from '@models/enums/project-status.enum';
import { ProjectModel, ProjectUpsertInput } from '@models/projects.models';

@Injectable({ providedIn: 'root' })
export class ProjectsFacade {
  private readonly api = inject(ProjectsApiService);

  private readonly _loading = signal(false);
  private readonly _loadedOnce = signal(false);
  private readonly _items = signal<ProjectModel[]>([]);

  readonly loading = this._loading.asReadonly();
  readonly loadedOnce = this._loadedOnce.asReadonly();
  readonly items = this._items.asReadonly();

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

  getById(id: string): Observable<ProjectModel> {
    return this.api.getById(id);
  }

  create(input: ProjectUpsertInput): Observable<ProjectModel> {
    return this.api.create(input).pipe(tap(() => this.loadAll(true)));
  }

  update(id: string, input: ProjectUpsertInput): Observable<ProjectModel> {
    return this.api.update(id, input).pipe(tap(() => this.loadAll(true)));
  }
}

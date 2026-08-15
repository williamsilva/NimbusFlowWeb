import { Injectable, inject, signal } from '@angular/core';

import { Observable, finalize, tap } from 'rxjs';

import { TasksApiService } from '@features/service/tasks.api.service';
import { TasksAdvancedFilters } from '@features/filter/tasks.filters';
import { ListQueryDto } from '@shared/features/list-query/list-query.types';
import {
  TaskModel,
  TaskStatusInput,
  TaskUpsertInput,
  TaskWithActionPlanModel,
} from '@models/tasks.models';

type LastQuery = ListQueryDto<TasksAdvancedFilters>;

/** Listagem global (menu "Tarefas", através de todos os planos) + atalho "Minhas tarefas" - mesmo
 *  par AddendumsFacade/AddendumsGlobalFacade, aqui só o lado global (a versão aninhada por plano
 *  é TasksFacade). */
@Injectable({ providedIn: 'root' })
export class TasksGlobalFacade {
  private readonly api = inject(TasksApiService);

  private readonly _total = signal(0);
  private readonly _loading = signal(false);
  private readonly _loadedOnce = signal(false);
  private readonly _data = signal<TaskWithActionPlanModel[]>([]);
  private readonly _lastQuery = signal<LastQuery | null>(null);

  private readonly _mine = signal(false);
  private readonly _mineLoading = signal(false);
  private readonly _mineLoadedOnce = signal(false);
  private readonly _mineItems = signal<TaskWithActionPlanModel[]>([]);

  readonly loading = this._loading.asReadonly();
  readonly tasks = this._data.asReadonly();
  readonly totalRecords = this._total.asReadonly();
  readonly loadedOnce = this._loadedOnce.asReadonly();

  readonly mineLoading = this._mineLoading.asReadonly();
  readonly mineLoadedOnce = this._mineLoadedOnce.asReadonly();
  readonly mineItems = this._mineItems.asReadonly();

  loadPage(q: LastQuery): void {
    if (this._loading()) return;

    this._loading.set(true);
    this._lastQuery.set(q);
    this._mine.set(false);

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
    if (this._mine()) {
      this.loadMine(true);
      return;
    }
    const last = this._lastQuery();
    if (!last) return;

    this.loadPage(last);
  }

  loadMine(force = false): void {
    if (this._mineLoading()) return;
    if (!force && this._mineLoadedOnce()) return;

    this._mine.set(true);
    this._mineLoading.set(true);

    this.api
      .findMine()
      .pipe(
        finalize(() => {
          this._mineLoading.set(false);
          this._mineLoadedOnce.set(true);
        }),
      )
      .subscribe({
        next: (items) => this._mineItems.set(items),
        error: () => this._mineItems.set([]),
      });
  }

  update(id: string, input: TaskUpsertInput): Observable<TaskModel> {
    return this.api.update(id, input).pipe(tap(() => this.reloadLast()));
  }

  updateStatus(id: string, input: TaskStatusInput): Observable<TaskModel> {
    return this.api.updateStatus(id, input).pipe(tap(() => this.reloadLast()));
  }
}

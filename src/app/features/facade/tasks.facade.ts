import { Injectable, inject, signal } from '@angular/core';

import { Observable, finalize, tap } from 'rxjs';

import { TasksApiService } from '@features/service/tasks.api.service';
import { TaskModel, TaskStatusInput, TaskUpsertInput } from '@models/tasks.models';

/** Tarefas de UM Plano de Ação (tela aninhada action-plans/:actionPlanId/tasks) - sem paginação,
 *  lista curta, mesmo padrão de AddendumsFacade.loadByWork. */
@Injectable({ providedIn: 'root' })
export class TasksFacade {
  private readonly api = inject(TasksApiService);

  private readonly _loading = signal(false);
  private readonly _loadedOnce = signal(false);
  private readonly _items = signal<TaskModel[]>([]);
  private readonly _actionPlanId = signal<string | null>(null);

  readonly loading = this._loading.asReadonly();
  readonly loadedOnce = this._loadedOnce.asReadonly();
  readonly items = this._items.asReadonly();

  loadByActionPlan(actionPlanId: string): void {
    this._actionPlanId.set(actionPlanId);
    this._loading.set(true);

    this.api
      .findByActionPlan(actionPlanId)
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

  private reload(): void {
    const actionPlanId = this._actionPlanId();
    if (actionPlanId) {
      this.loadByActionPlan(actionPlanId);
    }
  }

  create(actionPlanId: string, input: TaskUpsertInput): Observable<TaskModel> {
    return this.api.create(actionPlanId, input).pipe(tap(() => this.reload()));
  }

  update(id: string, input: TaskUpsertInput): Observable<TaskModel> {
    return this.api.update(id, input).pipe(tap(() => this.reload()));
  }

  updateStatus(id: string, input: TaskStatusInput): Observable<TaskModel> {
    return this.api.updateStatus(id, input).pipe(tap(() => this.reload()));
  }
}

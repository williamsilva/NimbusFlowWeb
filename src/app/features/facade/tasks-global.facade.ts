import { Injectable, inject, signal } from '@angular/core';

import { Observable, catchError, finalize, from, concatMap, map, of, tap, toArray } from 'rxjs';

import { TasksApiService } from '@features/service/tasks.api.service';
import { TasksAdvancedFilters } from '@features/filter/tasks.filters';
import { ListQueryDto } from '@williamsilva/nimbus-web-commons';
import {
  TaskModel,
  TaskStatusInput,
  TaskAssigneeInput,
  TaskUpsertInput,
  TaskWithActionPlanModel,
} from '@models/tasks.models';

type LastQuery = ListQueryDto<TasksAdvancedFilters>;

/** Resultado de uma operação em lote (pedido do usuário 2026-09-23, ver #updateStatusMany/
 *  #updateAssigneeMany) - mesmo formato de MeasurementBatchApproveResult. */
export interface TaskBatchResult {
  id: string;
  success: boolean;
  error?: unknown;
}

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

  /** Tarefa avulsa (pedido do usuário 2026-09-21) - única forma de criar sem estar dentro de um
   *  Plano de Ação; TasksFacade (a versão aninhada) continua sendo quem cria vinculada a um
   *  plano específico. */
  create(input: TaskUpsertInput): Observable<TaskModel> {
    return this.api.createStandalone(input).pipe(tap(() => this.reloadLast()));
  }

  update(id: string, input: TaskUpsertInput): Observable<TaskModel> {
    return this.api.update(id, input).pipe(tap(() => this.reloadLast()));
  }

  updateStatus(id: string, input: TaskStatusInput): Observable<TaskModel> {
    return this.api.updateStatus(id, input).pipe(tap(() => this.reloadLast()));
  }

  updateAssignee(id: string, input: TaskAssigneeInput): Observable<TaskModel> {
    return this.api.updateAssignee(id, input).pipe(tap(() => this.reloadLast()));
  }

  /** "Alterar status" em lote (pedido do usuário 2026-09-23, tela de lista de Tarefas) - mesma
   *  técnica de MeasurementsGlobalFacade#approveMany: best-effort, um request por tarefa (não
   *  existe endpoint de bulk no backend), reloadLast() só UMA vez ao final. */
  updateStatusMany(ids: string[], input: TaskStatusInput): Observable<TaskBatchResult[]> {
    return from(ids).pipe(
      concatMap((id) =>
        this.api.updateStatus(id, input).pipe(
          map((): TaskBatchResult => ({ id, success: true })),
          catchError((error) => of<TaskBatchResult>({ id, success: false, error })),
        ),
      ),
      toArray(),
      tap(() => this.reloadLast()),
    );
  }

  /** "Transferir" em lote (pedido do usuário 2026-09-23) - mesma técnica de #updateStatusMany. */
  updateAssigneeMany(ids: string[], input: TaskAssigneeInput): Observable<TaskBatchResult[]> {
    return from(ids).pipe(
      concatMap((id) =>
        this.api.updateAssignee(id, input).pipe(
          map((): TaskBatchResult => ({ id, success: true })),
          catchError((error) => of<TaskBatchResult>({ id, success: false, error })),
        ),
      ),
      toArray(),
      tap(() => this.reloadLast()),
    );
  }

  /** Criação em lote a partir de um Modelo (pedido do usuário 2026-09-24, "Análise da água" por
   *  piscina/local x turno) - mesma técnica best-effort de #updateStatusMany/#updateAssigneeMany:
   *  não existe endpoint de bulk no backend, então 1 POST por combinação (ver
   *  TaskTemplatePickerDialogComponent/AllTasksListComponent#onBatchCreateRequested, que monta
   *  cada `TaskUpsertInput` a partir do Modelo + 1 combinação Local/Turno). `id` do resultado é o
   *  título já sufixado (só informativo pro toast agregado - #reportBulkResult usa só `.success`). */
  createMany(inputs: TaskUpsertInput[]): Observable<TaskBatchResult[]> {
    return from(inputs).pipe(
      concatMap((input) =>
        this.api.createStandalone(input).pipe(
          map((): TaskBatchResult => ({ id: input.title, success: true })),
          catchError((error) => of<TaskBatchResult>({ id: input.title, success: false, error })),
        ),
      ),
      toArray(),
      tap(() => this.reloadLast()),
    );
  }
}

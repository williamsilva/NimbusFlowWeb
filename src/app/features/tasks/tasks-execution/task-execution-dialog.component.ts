import { DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, EventEmitter, Output } from '@angular/core';

import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { TranslateModule } from '@ngx-translate/core';

import { I18nService } from '@core/i18n/i18n.service';
import { CsDatePipe } from '@shared/pipes/cs-date.pipe';
import { UsersFacade } from '@features/facade/users.facade';
import { TasksApiService } from '@features/service/tasks.api.service';
import { TasksPermissionPolicy } from '@features/tasks/tasks-permission.policy';
import { TaskActivityExecutionCardComponent } from '@features/tasks/tasks-execution/task-activity-execution-card.component';
import { TaskActivityAnswerInput, TaskActivityModel } from '@models/task-activities.models';
import { TaskStatusEnum, taskStatusLabel, taskStatusTone } from '@models/enums/task-status.enum';
import { TaskWithActionPlanModel, formatTaskNumero, taskAssigneeDisplayName } from '@models/tasks.models';

const TERMINAL_STATUSES = [TaskStatusEnum.DONE, TaskStatusEnum.CANCELLED, TaskStatusEnum.NOT_DONE];

/**
 * Tela de execução da Tarefa (pedido do usuário 2026-09-23, referência visual de um sistema
 * antigo de checklist/inspeção) - aberta ao clicar num cartão do Kanban (ver AllTasksListComponent
 * #onKanbanCardClick). Cada atividade tem seu PRÓPRIO "Salvar" (TaskActivityExecutionCardComponent
 * #answered), gravado direto via TasksApiService - NUNCA a Tarefa inteira, por isso não passa
 * pelas facades (TasksFacade/TasksGlobalFacade), que só sabem recarregar a lista inteira; `updated`
 * é emitido só quando o diálogo fecha, pro pai atualizar a lista então (mesmo padrão de
 * TasksCreateDialogComponent).
 *
 * "Empresa"/"Categoria" do print de referência ficaram de fora - não existe campo equivalente no
 * modelo de Tarefa hoje (não pedido explicitamente, só apareciam no print de referência).
 */
@Component({
  standalone: true,
  selector: 'app-task-execution-dialog',
  templateUrl: './task-execution-dialog.component.html',
  styleUrl: './task-execution-dialog.component.scss',
  imports: [CsDatePipe, DialogModule, TooltipModule, TranslateModule, TaskActivityExecutionCardComponent],
})
export class TaskExecutionDialogComponent {
  visible = input.required<boolean>();
  task = input<TaskWithActionPlanModel | null>(null);

  @Output() readonly visibleChange = new EventEmitter<boolean>();
  /** Emitido só ao fechar (pedido do usuário 2026-09-23) - se alguma atividade foi respondida
   *  durante a sessão, o pai recarrega a lista (mesmo espírito de TasksCreateDialogComponent
   *  #updated), sem precisar de um reload a cada "Salvar" individual. */
  @Output() readonly updated = new EventEmitter<void>();

  private readonly api = inject(TasksApiService);
  private readonly toast = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly usersFacade = inject(UsersFacade);

  readonly i18n = inject(I18nService);
  readonly policy = inject(TasksPermissionPolicy);

  readonly activities = signal<TaskActivityModel[]>([]);
  readonly savingActivityId = signal<string | null>(null);
  private hasAnyAnswer = false;

  readonly canAnswer = computed(() => {
    const task = this.task();
    if (!task) return false;
    if (TERMINAL_STATUSES.includes(task.status)) return false;
    return this.policy.canExecuteOwn(task);
  });

  constructor() {
    effect(() => {
      const task = this.task();
      this.activities.set(task ? [...task.activities].sort((a, b) => a.position - b.position) : []);
      if (!this.visible()) {
        this.hasAnyAnswer = false;
      }
    });
  }

  onHide(): void {
    this.close();
  }

  close(): void {
    this.visibleChange.emit(false);
    if (this.hasAnyAnswer) {
      this.updated.emit();
    }
  }

  formatNumero(numero: number): string {
    return formatTaskNumero(numero);
  }

  assigneeDisplay(): string {
    const task = this.task();
    return task ? (taskAssigneeDisplayName(task) ?? '-') : '-';
  }

  creatorName(): string {
    const task = this.task();
    if (!task) return '-';
    return this.usersFacade.options().find((o) => o.value === task.createdById)?.label ?? task.createdById;
  }

  statusLabel(): string {
    const task = this.task();
    return task ? taskStatusLabel(task.status, this.i18n) : '';
  }

  statusTone(): ReturnType<typeof taskStatusTone> {
    const task = this.task();
    return task ? taskStatusTone(task.status) : 'neutral';
  }

  isNotDone(): boolean {
    return this.task()?.status === TaskStatusEnum.NOT_DONE;
  }

  onAnswered(activity: TaskActivityModel, event: { input: TaskActivityAnswerInput; file: File | null }): void {
    const task = this.task();
    if (!task) return;

    this.savingActivityId.set(activity.id);
    this.api
      .answerActivity(task.id, activity.id, event.input, event.file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (saved) => {
          this.savingActivityId.set(null);
          this.hasAnyAnswer = true;
          this.activities.update((activities) => activities.map((a) => (a.id === saved.id ? saved : a)));
          this.toast.add({
            severity: 'success',
            summary: this.i18n.tUi('common.success'),
            detail: this.i18n.tUi('tasks.execution.saved' as never),
          });
        },
        error: () => {
          this.savingActivityId.set(null);
          this.toast.add({
            severity: 'error',
            summary: this.i18n.tUi('common.error'),
            detail: this.i18n.tUi('tasks.execution.saveError' as never),
          });
        },
      });
  }
}

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
import { taskShiftRangeLabel } from '@models/enums/task-shift.enum';
import { TaskShiftSettingsFacade } from '@features/facade/task-shift-settings.facade';

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
  private readonly taskShiftSettingsFacade = inject(TaskShiftSettingsFacade);

  readonly activities = signal<TaskActivityModel[]>([]);
  readonly savingActivityId = signal<string | null>(null);
  private hasAnyAnswer = false;

  /** Status "ao vivo" da Tarefa durante a sessão do diálogo (pedido do usuário 2026-09-23:
   *  responder uma atividade pode mover TODO->IN_PROGRESS no backend - ver TaskService
   *  #answerActivity - sem isto o pill de status e canAnswer()/canEditAnswered() ficariam presos
   *  no valor de quando o diálogo abriu até o próximo reload da lista inteira). Inicializado a
   *  partir de task() e atualizado otimisticamente em #onAnswered (mesma regra determinística do
   *  backend: só sai de TODO). */
  readonly currentStatus = signal<TaskStatusEnum | null>(null);

  readonly canAnswer = computed(() => {
    const task = this.task();
    const status = this.currentStatus();
    if (!task || !status) return false;
    if (TERMINAL_STATUSES.includes(status)) return false;
    return this.policy.canExecuteOwn(task);
  });

  /** Reabrir uma atividade já respondida só é permitido com a Tarefa ainda IN_PROGRESS (pedido do
   *  usuário 2026-09-23) - uma vez em REVIEW (que agora exige todas as atividades respondidas,
   *  ver TaskService#allActivitiesAnswered), as respostas ficam travadas pro revisor. */
  readonly canEditAnswered = computed(() => this.currentStatus() === TaskStatusEnum.IN_PROGRESS && this.canAnswer());

  constructor() {
    this.taskShiftSettingsFacade.load();

    effect(() => {
      const task = this.task();
      this.activities.set(task ? [...task.activities].sort((a, b) => a.position - b.position) : []);
      this.currentStatus.set(task?.status ?? null);
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

  /** Local/Turno sempre opcionais (pedido do usuário 2026-09-24) - mostra só as partes presentes. */
  locationShiftDisplay(): string {
    const task = this.task();
    if (!task) return '-';
    const shiftLabel = task.shift
      ? taskShiftRangeLabel(task.shift, this.taskShiftSettingsFacade.settings(), this.i18n)
      : null;
    return [task.locationName, shiftLabel].filter((part): part is string => !!part).join(' - ');
  }

  creatorName(): string {
    const task = this.task();
    if (!task) return '-';
    return this.usersFacade.options().find((o) => o.value === task.createdById)?.label ?? task.createdById;
  }

  statusLabel(): string {
    const status = this.currentStatus();
    return status ? taskStatusLabel(status, this.i18n) : '';
  }

  statusTone(): ReturnType<typeof taskStatusTone> {
    const status = this.currentStatus();
    return status ? taskStatusTone(status) : 'neutral';
  }

  isNotDone(): boolean {
    return this.currentStatus() === TaskStatusEnum.NOT_DONE;
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
          if (this.currentStatus() === TaskStatusEnum.TODO) {
            this.currentStatus.set(TaskStatusEnum.IN_PROGRESS);
          }
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

import { Component, EventEmitter, Input, Output, computed, inject, signal } from '@angular/core';

import { TooltipModule } from 'primeng/tooltip';
import { TranslateModule } from '@ngx-translate/core';

import { I18nService } from '@core/i18n/i18n.service';
import { CsDatePipe } from '@shared/pipes/cs-date.pipe';
import { TaskWithActionPlanModel } from '@models/tasks.models';
import { TASK_STATUS_VALUES, TaskStatusEnum, taskStatusTone } from '@models/enums/task-status.enum';

export interface TaskKanbanDropEvent {
  task: TaskWithActionPlanModel;
  status: TaskStatusEnum;
}

/**
 * Quadro Kanban da lista geral de Tarefas (pedido do usuário 2026-09-21, alternativa à tabela já
 * existente) - agrupa as tarefas já carregadas por status, com drag-and-drop nativo (HTML5, sem
 * dependência nova - Angular CDK não estava instalado) pra mover entre colunas.
 *
 * Componente "burro" de propósito: quem decide SE um drop é permitido é o `canDrop` (função
 * injetada via @Input, não hardcoded aqui) - a regra de negócio (TAREFA_MANAGE muda pra qualquer
 * status; TAREFA_EXECUTE só avança a própria tarefa um passo, respeitando dependência) já existe
 * em AllTasksListComponent/TasksPermissionPolicy, não deveria ser duplicada aqui. Um drop recusado
 * simplesmente não emite `drop` - o card volta pro lugar sozinho porque a lista de tarefas (fonte
 * da verdade) nunca mudou.
 */
@Component({
  standalone: true,
  selector: 'app-tasks-kanban-board',
  templateUrl: './tasks-kanban-board.component.html',
  styleUrl: './tasks-kanban-board.component.scss',
  imports: [CsDatePipe, TooltipModule, TranslateModule],
})
export class TasksKanbanBoardComponent {
  private readonly i18n = inject(I18nService);

  @Input() tasks: TaskWithActionPlanModel[] = [];
  @Input() loading = false;
  @Input() canDrop: (task: TaskWithActionPlanModel, status: TaskStatusEnum) => boolean = () => false;

  @Output() readonly drop = new EventEmitter<TaskKanbanDropEvent>();

  readonly statuses = TASK_STATUS_VALUES;

  private readonly draggingTask = signal<TaskWithActionPlanModel | null>(null);
  readonly dragOverStatus = signal<TaskStatusEnum | null>(null);

  readonly columns = computed(() => {
    const byStatus = new Map<TaskStatusEnum, TaskWithActionPlanModel[]>();
    for (const status of this.statuses) byStatus.set(status, []);

    for (const task of this.tasks) {
      byStatus.get(task.status)?.push(task);
    }

    return this.statuses.map((status) => ({ status, tasks: byStatus.get(status) ?? [] }));
  });

  tone(status: TaskStatusEnum): ReturnType<typeof taskStatusTone> {
    return taskStatusTone(status);
  }

  statusLabel(status: TaskStatusEnum): string {
    return this.i18n.tUi(`tasks.status.${status}` as never);
  }

  /** "1ª letra de até 2 palavras" - mesmo padrão de TicketsListComponent#initials (pedido do
   *  usuário 2026-09-22, referência visual dos cartões de Chamados). */
  initials(name: string | null): string {
    const trimmed = name?.trim();
    return trimmed ? trimmed.slice(0, 2).toUpperCase() : '?';
  }

  private static readonly AVATAR_PALETTE = [
    '#7c3aed',
    '#0891b2',
    '#059669',
    '#d97706',
    '#dc2626',
    '#4f46e5',
    '#0d9488',
    '#65a30d',
  ];

  /** Mesma técnica de hash de TicketsListComponent#avatarColor - mesmo nome sempre cai na mesma
   *  cor, paleta fixa. */
  avatarColor(name: string | null): string {
    if (!name) return TasksKanbanBoardComponent.AVATAR_PALETTE[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    }
    return TasksKanbanBoardComponent.AVATAR_PALETTE[hash % TasksKanbanBoardComponent.AVATAR_PALETTE.length];
  }

  /** Prazo vencido vira um destaque vermelho no cartão - mesmo racional do card de "Data de
   *  vencimento" na referência visual, mas orientado a dado (atrasado vs não) em vez de cor fixa. */
  isOverdue(task: TaskWithActionPlanModel): boolean {
    if (!task.dueDate || task.status === TaskStatusEnum.DONE || task.status === TaskStatusEnum.CANCELLED) {
      return false;
    }
    return new Date(task.dueDate) < new Date(new Date().toDateString());
  }

  isDropAllowed(status: TaskStatusEnum): boolean {
    const task = this.draggingTask();
    return !!task && this.canDrop(task, status);
  }

  onDragStart(task: TaskWithActionPlanModel): void {
    this.draggingTask.set(task);
  }

  onDragEnd(): void {
    this.draggingTask.set(null);
    this.dragOverStatus.set(null);
  }

  onDragEnterColumn(status: TaskStatusEnum): void {
    this.dragOverStatus.set(status);
  }

  onDragLeaveColumn(status: TaskStatusEnum): void {
    if (this.dragOverStatus() === status) this.dragOverStatus.set(null);
  }

  onDropOnColumn(status: TaskStatusEnum): void {
    const task = this.draggingTask();
    this.dragOverStatus.set(null);
    this.draggingTask.set(null);

    if (!task || task.status === status || !this.canDrop(task, status)) return;

    this.drop.emit({ task, status });
  }
}

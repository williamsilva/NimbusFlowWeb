import { Component, EventEmitter, Output, computed, inject, input, signal } from '@angular/core';

import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TranslateModule } from '@ngx-translate/core';

import { I18nService } from '@core/i18n/i18n.service';
import { CsDatePipe } from '@shared/pipes/cs-date.pipe';
import { TaskWithActionPlanModel, formatTaskNumero, taskAssigneeDisplayName } from '@models/tasks.models';
import { TASK_STATUS_VALUES, TaskStatusEnum, taskStatusTone } from '@models/enums/task-status.enum';
import { taskShiftLabel } from '@models/enums/task-shift.enum';
import { TaskAssigneeTypeEnum } from '@models/enums/task-assignee-type.enum';

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
  imports: [CsDatePipe, ButtonModule, TooltipModule, TranslateModule],
})
export class TasksKanbanBoardComponent {
  private readonly i18n = inject(I18nService);

  /** input() (sinal), não @Input() de propriedade simples (achado real 2026-09-22) - `columns`
   *  abaixo é um computed() que lê `tasks()`; computed() só rastreia SINAIS como dependência, uma
   *  propriedade simples atualizada via @Input() nunca disparava o recálculo. Na prática: o quadro
   *  calculava as colunas UMA VEZ com a lista vazia (antes da resposta da API chegar) e nunca mais
   *  recomputava depois que os dados reais chegavam - só "funcionava" quando o componente nascia
   *  DEPOIS dos dados já carregados (ex.: trocar de Lista, que já tinha os dados, pra Kanban). */
  readonly tasks = input<TaskWithActionPlanModel[]>([]);
  readonly loading = input(false);
  readonly canDrop = input<(task: TaskWithActionPlanModel, status: TaskStatusEnum) => boolean>(
    () => false,
  );

  /** Nome "drop" batia com o evento nativo do DOM (@angular-eslint/no-output-native) - o
   *  <div (drop)="onDropOnColumn(...)"> no template é o listener NATIVO de drag-and-drop HTML5,
   *  sem relação com este @Output (notificação pro pai depois que canDrop() já aprovou). */
  @Output() readonly taskDrop = new EventEmitter<TaskKanbanDropEvent>();
  /** Clique no cartão (pedido do usuário 2026-09-23, redefinido 2026-09-23 pra abrir a EXECUÇÃO
   *  em vez da edição - ver #editClick abaixo pro botão novo de lápis) - "burro" igual ao resto do
   *  componente: só emite, quem decide o que fazer (abrir execução, checar permissão) é o pai
   *  (AllTasksListComponent). Nunca dispara junto de um drag-and-drop - o próprio navegador não
   *  gera "click" depois de um "dragend" real. */
  @Output() readonly taskClick = new EventEmitter<TaskWithActionPlanModel>();
  /** Botão de lápis no canto superior direito do cartão, mesma linha do número (pedido do usuário
   *  2026-09-23) - abre a EDIÇÃO/configuração (o clique no resto do cartão abre a execução, ver
   *  #taskClick). Precisa de stopPropagation no template - é um elemento dentro da área
   *  clicável do cartão inteiro. */
  @Output() readonly editClick = new EventEmitter<TaskWithActionPlanModel>();
  /** Drop recusado (pedido do usuário 2026-09-23 - o usuário precisa saber POR QUE não pôde
   *  mover) - "burro" igual ao resto: só avisa QUE foi recusado, quem decide o motivo exato (texto
   *  traduzido) é o pai, que já tem toda a regra de negócio via canDrop/isDependencySatisfied. */
  @Output() readonly dropRejected = new EventEmitter<TaskKanbanDropEvent>();

  /** Cancelada não vira coluna aqui (pedido do usuário 2026-09-24) - o Kanban é uma visão de
   *  trabalho ativo/do dia, não um histórico; a aba "Cancelada" continua disponível na Lista (ver
   *  AllTasksListComponent.statusTabs, que usa TASK_STATUS_VALUES cheio). */
  readonly statuses = TASK_STATUS_VALUES.filter((status) => status !== TaskStatusEnum.CANCELLED);

  private readonly draggingTask = signal<TaskWithActionPlanModel | null>(null);
  readonly dragOverStatus = signal<TaskStatusEnum | null>(null);

  /** Concluída/Não fez só mostram o que aconteceu HOJE (pedido do usuário 2026-09-24) - sem isto
   *  as duas colunas só cresceriam pra sempre, acumulando todo o histórico. DONE usa completedAt
   *  (setado só na transição pra DONE, ver TaskService#updateStatus); NOT_DONE não tem um campo
   *  equivalente (completedAt só é setado quando completingNow, nunca em NOT_DONE) - usa updatedAt
   *  como proxy, seguro porque NOT_DONE é terminal (fora de EDITABLE_STATUSES no backend, nunca
   *  mais editado depois, então updatedAt fica congelado no exato momento da transição). */
  readonly columns = computed(() => {
    const byStatus = new Map<TaskStatusEnum, TaskWithActionPlanModel[]>();
    for (const status of this.statuses) byStatus.set(status, []);

    const todayKey = new Date().toDateString();
    for (const task of this.tasks()) {
      const bucket = byStatus.get(task.status);
      if (!bucket) continue;
      if (task.status === TaskStatusEnum.DONE && !this.isSameDay(task.completedAt, todayKey)) continue;
      if (task.status === TaskStatusEnum.NOT_DONE && !this.isSameDay(task.updatedAt, todayKey)) continue;
      bucket.push(task);
    }

    return this.statuses.map((status) => ({ status, tasks: byStatus.get(status) ?? [] }));
  });

  private isSameDay(dateStr: string | null, todayKey: string): boolean {
    return !!dateStr && new Date(dateStr).toDateString() === todayKey;
  }

  tone(status: TaskStatusEnum): ReturnType<typeof taskStatusTone> {
    return taskStatusTone(status);
  }

  statusLabel(status: TaskStatusEnum): string {
    return this.i18n.tUi(`tasks.status.${status}` as never);
  }

  formatNumero(numero: number): string {
    return formatTaskNumero(numero);
  }

  /** Local/Turno sempre opcionais (pedido do usuário 2026-09-24) - mostra só as partes presentes,
   *  unidas por " - " (mesma convenção de título usada na criação em lote a partir de Modelo). */
  locationShiftDisplay(task: TaskWithActionPlanModel): string {
    return [task.locationName, task.shift ? taskShiftLabel(task.shift, this.i18n) : null]
      .filter((part): part is string => !!part)
      .join(' - ');
  }

  /** stopPropagation pra não também disparar #taskClick (o botão fica DENTRO da área clicável do
   *  cartão inteiro, ver template) - pedido do usuário 2026-09-23. */
  onEditClick(event: Event, task: TaskWithActionPlanModel): void {
    event.stopPropagation();
    this.editClick.emit(task);
  }

  readonly TaskAssigneeTypeEnum = TaskAssigneeTypeEnum;

  /** Departamento inteiro (pedido do usuário 2026-09-22) não tem uma única pessoa pra mostrar
   *  iniciais/cor de avatar - ver isDepartmentAssignee no template, que troca por um ícone fixo. */
  assigneeDisplay(task: TaskWithActionPlanModel): string | null {
    return taskAssigneeDisplayName(task);
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
    if (
      !task.dueDate ||
      task.status === TaskStatusEnum.REVIEW ||
      task.status === TaskStatusEnum.DONE ||
      task.status === TaskStatusEnum.CANCELLED ||
      task.status === TaskStatusEnum.NOT_DONE
    ) {
      return false;
    }
    return new Date(task.dueDate) < new Date(new Date().toDateString());
  }

  isDropAllowed(status: TaskStatusEnum): boolean {
    const task = this.draggingTask();
    return !!task && this.canDrop()(task, status);
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

    if (!task || task.status === status) return;

    if (!this.canDrop()(task, status)) {
      this.dropRejected.emit({ task, status });
      return;
    }

    this.taskDrop.emit({ task, status });
  }

  /** Sem dependência = nunca bloqueia. Pura leitura de dado (dependsOnTaskStatus já vem resolvido
   *  pelo backend), diferente de canDrop - não depende de permissão, então não precisa ser
   *  injetada de fora (pedido do usuário 2026-09-23 - indicar no próprio cartão). */
  isDependencyBlocking(task: TaskWithActionPlanModel): boolean {
    return !!task.dependsOnTaskId && task.dependsOnTaskStatus !== TaskStatusEnum.DONE;
  }
}

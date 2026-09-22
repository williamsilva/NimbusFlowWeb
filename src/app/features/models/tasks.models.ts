import { TaskStatusEnum } from '@models/enums/task-status.enum';
import { PeriodEnum } from '@models/enums/period.enum';
import { TaskAssigneeTypeEnum } from '@models/enums/task-assignee-type.enum';
import { TaskRecurrenceFrequencyEnum } from '@models/enums/task-recurrence-frequency.enum';
import { DayOfWeekEnum } from '@models/enums/day-of-week.enum';

/** Espelha com.nimbusflow.tasks.dto.response.TaskResponse do NimbusFlowServer. */
export interface TaskModel {
  id: string;
  /** Nulo = tarefa avulsa, sem vínculo com nenhum Plano de Ação (pedido do usuário 2026-09-21). */
  actionPlanId: string | null;
  title: string;
  description: string | null;
  /** USER usa assigneeId/assigneeName, DEPARTMENT usa assigneeDepartmentId/assigneeDepartmentName -
   *  exatamente um dos dois preenchido (pedido do usuário 2026-09-22, mesmo padrão de
   *  Ticket.targetType). */
  assigneeType: TaskAssigneeTypeEnum;
  assigneeId: string | null;
  assigneeName: string | null;
  assigneeDepartmentId: string | null;
  assigneeDepartmentName: string | null;
  status: TaskStatusEnum;
  dueDate: string | null;
  /** Método alternativo de definir o prazo (Data de início + Dias para executar) - quando os dois
   *  vêm preenchidos, o servidor recalcula dueDate; nulos = tarefa criada só com dueDate direto
   *  (compatibilidade) ou ocorrência gerada por recorrência (ver TaskService#createNextOccurrence). */
  startDate: string | null;
  durationDays: number | null;
  /** Repetição por calendário (pedido do usuário 2026-09-23) - gerada 1x/dia por
   *  com.nimbusflow.tasks.recurrence.TaskRecurrenceJob, independente de conclusão. NONE = não
   *  repete. DAILY/WEEKLY/MONTHLY/YEARLY usam recurrenceInterval; WEEKLY_DAYS/MONTHLY_DAYS usam
   *  recurrenceWeekDays/recurrenceMonthDays. */
  recurrenceFrequency: TaskRecurrenceFrequencyEnum;
  recurrenceInterval: number | null;
  recurrenceWeekDays: DayOfWeekEnum[];
  recurrenceMonthDays: number[];
  /** Nulo = nunca expira. */
  recurrenceExpiresAt: string | null;
  notifyAssigneeOnRecurrence: boolean;
  /** Horário de liberação da tarefa (pedido do usuário 2026-09-23) - nulo = sempre visível; senão
   *  a tarefa fica escondida das listagens até este horário passar, só no dia do vencimento. */
  releaseTime: string | null;
  /** "Se a tarefa estiver vencida, movê-la automaticamente para o status 'Não fez'" (pedido do
   *  usuário 2026-09-23) - aplicável a qualquer tarefa, não só recorrente. */
  autoMoveOverdueToNotDone: boolean;
  /** Vínculo opcional com outra Tarefa do MESMO Plano de Ação - nulo = sem dependência.
   *  dependsOnTaskStatus já vem resolvido pelo backend (evita uma segunda chamada só pra saber
   *  se a dependência já foi concluída, ver TasksListComponent#canAdvance). */
  dependsOnTaskId: string | null;
  dependsOnTaskTitle: string | null;
  dependsOnTaskStatus: TaskStatusEnum | null;
  completedAt: string | null;
  completedById: string | null;
  createdById: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export type TaskApiModel = TaskModel;

/** Mesmos campos de TaskModel + actionPlanTitle - espelha TaskWithActionPlanResponse (listagem
 *  global e "Minhas tarefas", através de todos os planos). */
export interface TaskWithActionPlanModel extends TaskModel {
  actionPlanTitle: string;
}

export type TaskWithActionPlanApiModel = TaskWithActionPlanModel;

export interface TaskUpsertInput {
  title: string;
  description: string | null;
  assigneeType: TaskAssigneeTypeEnum;
  /** Obrigatório só quando assigneeType=USER - ver TaskService#resolveAssignee no backend. */
  assigneeId: string | null;
  /** Obrigatório só quando assigneeType=DEPARTMENT. */
  assigneeDepartmentId: string | null;
  /** Preservado tal como veio do TaskModel quando o usuário não mexe em startDate/durationDays
   *  (edição de tarefa antiga sem esses dois campos) - o servidor só recalcula quando ambos vêm
   *  preenchidos, ver TaskService#computeDueDate. */
  dueDate: string | null;
  startDate: string | null;
  durationDays: number | null;
  recurrenceFrequency: TaskRecurrenceFrequencyEnum;
  /** Obrigatório (>= 1) só quando recurrenceFrequency é DAILY/WEEKLY/MONTHLY/YEARLY. */
  recurrenceInterval: number | null;
  /** Obrigatório e não-vazio só quando recurrenceFrequency=WEEKLY_DAYS. */
  recurrenceWeekDays: DayOfWeekEnum[];
  /** Obrigatório e não-vazio (1-31) só quando recurrenceFrequency=MONTHLY_DAYS. */
  recurrenceMonthDays: number[];
  /** Nulo = nunca expira. */
  recurrenceExpiresAt: string | null;
  notifyAssigneeOnRecurrence: boolean;
  /** Nulo = sempre visível - ver TaskModel.releaseTime. */
  releaseTime: string | null;
  autoMoveOverdueToNotDone: boolean;
  dependsOnTaskId: string | null;
  /** Só lido pela criação avulsa (TasksApiService#createStandalone) - a criação aninhada por
   *  plano ignora este campo e usa o actionPlanId da própria rota. */
  actionPlanId?: string | null;
}

export interface TaskStatusInput {
  status: TaskStatusEnum;
}

export interface TasksFiltersState {
  title: string;
  status: string[] | null;
  assigneeIds: string[] | null;
  actionPlanIds: string[] | null;
  createdAt: string | string[] | null;
  periodCreatedAt: PeriodEnum | null;
}

/** Nome de exibição do responsável - pessoa (assigneeName) ou departamento inteiro
 *  (assigneeDepartmentName), de acordo com assigneeType (pedido do usuário 2026-09-22, ver
 *  TasksListComponent/AllTasksListComponent/TasksKanbanBoardComponent). */
export function taskAssigneeDisplayName(task: TaskModel): string | null {
  return task.assigneeType === TaskAssigneeTypeEnum.DEPARTMENT ? task.assigneeDepartmentName : task.assigneeName;
}

export function mapTaskApiModel(input: TaskApiModel): TaskModel {
  return { ...input };
}

export function mapTaskApiModels(items: TaskApiModel[] | null | undefined): TaskModel[] {
  return (items ?? []).map(mapTaskApiModel);
}

export function mapTaskWithActionPlanApiModel(
  input: TaskWithActionPlanApiModel,
): TaskWithActionPlanModel {
  return { ...input };
}

export function mapTaskWithActionPlanApiModels(
  items: TaskWithActionPlanApiModel[] | null | undefined,
): TaskWithActionPlanModel[] {
  return (items ?? []).map(mapTaskWithActionPlanApiModel);
}

import { TaskStatusEnum } from '@models/enums/task-status.enum';
import { PeriodEnum } from '@models/enums/period.enum';

/** Espelha com.nimbusflow.tasks.dto.response.TaskResponse do NimbusFlowServer. */
export interface TaskModel {
  id: string;
  actionPlanId: string;
  title: string;
  description: string | null;
  assigneeId: string;
  assigneeName: string | null;
  status: TaskStatusEnum;
  dueDate: string | null;
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
  assigneeId: string;
  dueDate: string | null;
  dependsOnTaskId: string | null;
}

export interface TaskStatusInput {
  status: TaskStatusEnum;
}

export type TasksFiltersState = {
  title: string;
  status: string[] | null;
  assigneeIds: string[] | null;
  actionPlanIds: string[] | null;
  createdAt: string | string[] | null;
  periodCreatedAt: PeriodEnum | null;
};

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

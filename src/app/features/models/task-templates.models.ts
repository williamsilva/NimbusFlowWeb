import { TaskActivityConfigModel, TaskActivityInput, TaskActivityOptionModel } from '@models/task-activities.models';

/**
 * Categoria de Tarefa (pedido do usuário 2026-09-24, menu Configurações > Modelos de Tarefas) -
 * espelha com.nimbusflow.tasks.dto.response.TaskCategoryResponse. Os 3 conjuntos allowedXxxIds
 * formam o "Gerenciar permissões" (ver TaskCategoryPermissionsInput) - vazios nos 3 = categoria
 * visível pra todo mundo (fail-open, mesma regra do backend).
 */
export interface TaskCategoryModel {
  id: string;
  name: string;
  allowedDepartmentIds: string[];
  allowedCargoIds: string[];
  allowedUserIds: string[];
  createdAt: string | null;
  updatedAt: string | null;
}

export type TaskCategoryApiModel = TaskCategoryModel;

export interface TaskCategoryOptionModel {
  id: string;
  name: string;
}

export type TaskCategoryOptionApiModel = TaskCategoryOptionModel;

export interface TaskCategoryInput {
  name: string;
}

export interface TaskCategoryPermissionsInput {
  allowedDepartmentIds: string[];
  allowedCargoIds: string[];
  allowedUserIds: string[];
}

/** Espelha com.nimbusflow.tasks.dto.response.TaskSubcategoryResponse. */
export interface TaskSubcategoryModel {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export type TaskSubcategoryApiModel = TaskSubcategoryModel;

export interface TaskSubcategoryOptionModel {
  id: string;
  name: string;
}

export type TaskSubcategoryOptionApiModel = TaskSubcategoryOptionModel;

export interface TaskSubcategoryInput {
  categoryId: string;
  name: string;
}

/**
 * Modelo de Tarefa - espelha com.nimbusflow.tasks.dto.response.TaskTemplateResponse.
 * `activities` reaproveita TaskActivityConfigModel/TaskActivityInput diretamente (mesmo shape
 * "config sem resposta" que TaskTemplateActivityResponse/TaskActivityRequest usam no backend) -
 * sem responsável padrão de propósito (decisão do usuário 2026-09-24: o responsável é sempre
 * escolhido na hora de criar a Tarefa a partir do modelo).
 */
export interface TaskTemplateModel {
  id: string;
  subcategoryId: string;
  subcategoryName: string;
  categoryId: string;
  categoryName: string;
  name: string;
  title: string;
  description: string | null;
  durationDays: number | null;
  activities: TaskActivityConfigModel[];
  createdAt: string | null;
  updatedAt: string | null;
}

export type TaskTemplateApiModel = TaskTemplateModel;

export interface TaskTemplateInput {
  subcategoryId: string;
  name: string;
  title: string;
  description: string | null;
  durationDays: number | null;
  activities: TaskActivityInput[];
}

function mapTaskActivityConfigApiModel(input: TaskActivityConfigModel): TaskActivityConfigModel {
  return { ...input, options: (input.options ?? []) as TaskActivityOptionModel[] };
}

export function mapTaskCategoryApiModel(input: TaskCategoryApiModel): TaskCategoryModel {
  return {
    ...input,
    allowedDepartmentIds: input.allowedDepartmentIds ?? [],
    allowedCargoIds: input.allowedCargoIds ?? [],
    allowedUserIds: input.allowedUserIds ?? [],
  };
}

export function mapTaskCategoryApiModels(items: TaskCategoryApiModel[] | null | undefined): TaskCategoryModel[] {
  return (items ?? []).map(mapTaskCategoryApiModel);
}

export function mapTaskSubcategoryApiModel(input: TaskSubcategoryApiModel): TaskSubcategoryModel {
  return { ...input };
}

export function mapTaskSubcategoryApiModels(
  items: TaskSubcategoryApiModel[] | null | undefined,
): TaskSubcategoryModel[] {
  return (items ?? []).map(mapTaskSubcategoryApiModel);
}

export function mapTaskTemplateApiModel(input: TaskTemplateApiModel): TaskTemplateModel {
  return { ...input, activities: (input.activities ?? []).map(mapTaskActivityConfigApiModel) };
}

export function mapTaskTemplateApiModels(items: TaskTemplateApiModel[] | null | undefined): TaskTemplateModel[] {
  return (items ?? []).map(mapTaskTemplateApiModel);
}

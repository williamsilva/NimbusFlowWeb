/**
 * Espelha com.nimbusflow.tasks.dto.{request.TaskLocationRequest,response.TaskLocationResponse}
 * do NimbusFlowServer - catálogo simples (Configurações > Locais), sem escopo de permissão por
 * usuário (diferente de Department/Cargo).
 */
export interface TaskLocationModel {
  id: string;
  name: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export type TaskLocationApiModel = TaskLocationModel;

export interface TaskLocationInput {
  name: string;
}

export function mapTaskLocationApiModel(input: TaskLocationApiModel): TaskLocationModel {
  return { ...input };
}

export function mapTaskLocationApiModels(items: TaskLocationApiModel[] | null | undefined): TaskLocationModel[] {
  return (items ?? []).map(mapTaskLocationApiModel);
}

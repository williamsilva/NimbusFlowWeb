import { ProjectStatusEnum } from '@models/enums/project-status.enum';

/**
 * Espelha com.nimbusflow.works.dto.{request.ProjectRequest,response.ProjectResponse} do
 * NimbusFlowServer. serviceFrontsCount/totalContractedAmount/totalPaidAmount/remainingAmount/
 * progressPercentage/startDate/expectedEndDate vêm sempre computados pelo backend a partir das
 * Frentes de Serviço (Work) do projeto - startDate/expectedEndDate são nulos quando o projeto
 * ainda não tem nenhuma Frente cadastrada.
 */
export interface ProjectModel {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatusEnum;
  serviceFrontsCount: number;
  totalContractedAmount: number;
  totalPaidAmount: number;
  remainingAmount: number;
  progressPercentage: number;
  startDate: string | null;
  expectedEndDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export type ProjectApiModel = ProjectModel;

export interface ProjectUpsertInput {
  name: string;
  description: string | null;
  status: ProjectStatusEnum | null;
}

export function mapProjectApiModel(input: ProjectApiModel): ProjectModel {
  return { ...input };
}

export function mapProjectApiModels(items: ProjectApiModel[] | null | undefined): ProjectModel[] {
  return (items ?? []).map(mapProjectApiModel);
}

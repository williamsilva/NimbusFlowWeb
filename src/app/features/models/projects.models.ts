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
  /** URL assinada e temporária da planta/imagem do empreendimento - nulo até alguém enviar uma
   *  (ver ProjectsApiService.uploadSitePlan). Frente de Serviço/Medição marcam um ponto (x/y)
   *  relativo a esta imagem, ver WorkModel.planPositionX/Y. */
  siteplanUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export type ProjectApiModel = ProjectModel;

/** Lista leve (options() - sem gate de permissão no backend) pro seletor de Projeto em Obras/
 *  Dashboard e no diálogo de criação de Obra, e pra resolver a planta do Projeto em Medições -
 *  espelha com.nimbusflow.works.dto.response.ProjectOptionResponse. */
export interface ProjectOptionModel {
  id: string;
  name: string;
  status: ProjectStatusEnum;
  siteplanUrl: string | null;
}

export interface ProjectUpsertInput {
  name: string;
  description: string | null;
  status: ProjectStatusEnum | null;
}

/** Estado persistido do painel de filtros avançados da listagem de Projetos. */
export type ProjectsFiltersState = {
  name: string;
  status: string[] | null;
  serviceFrontsCountFrom: number | null;
  serviceFrontsCountTo: number | null;
  totalContractedAmountFrom: number | null;
  totalContractedAmountTo: number | null;
  totalPaidAmountFrom: number | null;
  totalPaidAmountTo: number | null;
  remainingAmountFrom: number | null;
  remainingAmountTo: number | null;
  progressPercentageFrom: number | null;
  progressPercentageTo: number | null;
};

export function mapProjectApiModel(input: ProjectApiModel): ProjectModel {
  return { ...input };
}

export function mapProjectApiModels(items: ProjectApiModel[] | null | undefined): ProjectModel[] {
  return (items ?? []).map(mapProjectApiModel);
}

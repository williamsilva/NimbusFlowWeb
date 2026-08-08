import { WorkStatusEnum } from '@models/enums/work-status.enum';

/**
 * Espelha com.nimbusflow.works.dto.{request.WorkRequest,response.WorkResponse} do
 * NimbusFlowServer (ver PROJECT_SPEC.md seção 3.2). `supplierName` já vem denormalizado no
 * response (evita um segundo request só pra exibir o nome do fornecedor na listagem).
 * `ownerId`/`approvedById` existem no backend mas não são exibidos nesta tela - o fluxo de
 * aprovação de Obra nunca foi implementado em nenhuma fase (só Aditivo tem aprovação), e
 * `ownerId` é sempre o usuário autenticado que cria a obra (sem seletor de usuário).
 */
export interface WorkModel {
  id: string;
  name: string;
  supplierId: string;
  supplierName: string;
  ownerId: string | null;
  approvedById: string | null;
  approvedAt: string | null;
  startDate: string;
  expectedEndDate: string;
  actualEndDate: string | null;
  initialAmount: number;
  totalAmount: number;
  status: WorkStatusEnum;
  latitude: number | null;
  longitude: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export type WorkApiModel = WorkModel;

export interface WorkUpsertInput {
  name: string;
  supplierId: string;
  startDate: string;
  expectedEndDate: string;
  actualEndDate: string | null;
  initialAmount: number;
  latitude: number;
  longitude: number;
  status: WorkStatusEnum | null;
}

export type WorksFiltersState = {
  name: string;
  supplierId: string[] | null;
  status: string[] | null;
  startDateRange: [string, string] | null;
  expectedEndDateRange: [string, string] | null;
  totalAmountFrom: number | null;
  totalAmountTo: number | null;
};

export function mapWorkApiModel(input: WorkApiModel): WorkModel {
  return { ...input };
}

export function mapWorkApiModels(items: WorkApiModel[] | null | undefined): WorkModel[] {
  return (items ?? []).map(mapWorkApiModel);
}

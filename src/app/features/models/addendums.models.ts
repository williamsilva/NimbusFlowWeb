import { PeriodEnum } from '@models/enums/period.enum';
import { AddendumStatusEnum, ApprovalTierEnum } from '@models/enums/addendum-status.enum';

/**
 * Espelha com.nimbusflow.works.dto.{request.AddendumRequest,request.AddendumDecisionRequest,
 * response.AddendumResponse} do NimbusFlowServer. Diferente de WorkModel, esta lista não é
 * paginada no backend (GET /bff/v1/works/{workId}/addendums retorna tudo da obra de uma vez).
 */
export interface AddendumModel {
  id: string;
  workId: string;
  amount: number;
  justification: string;
  status: AddendumStatusEnum;
  requiredTier: ApprovalTierEnum;
  requestedById: string;
  approvedById: string | null;
  decisionDate: string | null;
  decisionNote: string | null;
  supersedesId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export type AddendumApiModel = AddendumModel;

/** Espelha AddendumWithWorkResponse - usado pela listagem global (menu "Aditivos", através de todas as obras). */
export interface AddendumWithWorkModel extends AddendumModel {
  workName: string;
}

export type AddendumWithWorkApiModel = AddendumWithWorkModel;

/** Estado persistido do painel de filtros avançados da listagem global (menu "Aditivos"). */
export type AddendumsFiltersState = {
  workName: string;
  justification: string;
  status: string[] | null;
  requiredTier: string[] | null;
  amountFrom: number | null;
  amountTo: number | null;
  createdAt: string | string[] | null;
  periodCreatedAt: PeriodEnum | null;
};

export interface AddendumRequestInput {
  amount: number;
  justification: string;
  supersedesId: string | null;
}

export interface AddendumDecisionInput {
  decisionNote: string | null;
}

export function mapAddendumApiModel(input: AddendumApiModel): AddendumModel {
  return { ...input };
}

export function mapAddendumApiModels(
  items: AddendumApiModel[] | null | undefined,
): AddendumModel[] {
  return (items ?? []).map(mapAddendumApiModel);
}

export function mapAddendumWithWorkApiModel(input: AddendumWithWorkApiModel): AddendumWithWorkModel {
  return { ...input };
}

export function mapAddendumWithWorkApiModels(
  items: AddendumWithWorkApiModel[] | null | undefined,
): AddendumWithWorkModel[] {
  return (items ?? []).map(mapAddendumWithWorkApiModel);
}

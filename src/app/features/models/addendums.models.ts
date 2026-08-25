import { PeriodEnum } from '@models/enums/period.enum';
import { UserMinimalModel } from '@models/user-minimal.models';
import { AddendumStatusEnum } from '@models/enums/addendum-status.enum';

/** Espelha com.nimbusflow.works.dto.response.ApprovalRangeResponse - faixa de Configurações >
 *  Alçada que cobre o valor do aditivo, calculada pelo backend no momento da resposta. */
export interface ApprovalRangeModel {
  minAmount: number;
  maxAmount: number | null;
}

/**
 * Espelha com.nimbusflow.works.dto.{request.AddendumRequest,request.AddendumDecisionRequest,
 * response.AddendumResponse} do NimbusFlowServer. Diferente de WorkModel, esta lista não é
 * paginada no backend (GET /bff/v1/works/{workId}/addendums retorna tudo da obra de uma vez).
 */
export interface AddendumModel {
  id: string;
  workId: string;
  /** Sequencial por obra (1, 2, 3...) - exibido com prefixo "ADT-" via formatSequentialNumber
   *  (ex.: ADT-0001). Ver Addendum.number no backend. */
  number: number;
  amount: number;
  justification: string;
  status: AddendumStatusEnum;
  /** Se o usuário logado pode aprovar/reprovar ESTE aditivo agora - já resolvido pelo backend
   *  (status PENDING + permissão de aprovar + dentro da faixa de Configurações > Alçada). Usar
   *  direto em vez de recalcular no cliente (era a causa do bug da coluna "Alçada" desalinhada). */
  canDecide: boolean;
  /** Se o usuário logado pode EDITAR este aditivo agora - já resolvido pelo backend (authority +
   *  a frente de serviço ainda aceita edição + ainda sobra valor pra medir na frente). Editar um
   *  aditivo já decidido o reabre (volta pra Pendente). */
  canEdit: boolean;
  /** Faixas de Configurações > Alçada que cobrem `amount` agora - mostrado na coluna "Alçada". */
  approvalRanges: ApprovalRangeModel[];
  requestedById: string;
  approvedById: string | null;
  /** Nome/username de approvedById, resolvido pelo backend (UserDirectoryService) - null
   *  enquanto pendente ou se o NimbusAuth não puder ser consultado. */
  approvedBy: UserMinimalModel | null;
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

/** Espelha AddendumRequest também (reaproveitado no backend pro update, sem supersedesId - editar
 *  não muda o encadeamento de reenvio). Editar um aditivo já decidido o devolve pra Pendente. */
export interface AddendumUpdateInput {
  amount: number;
  justification: string;
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

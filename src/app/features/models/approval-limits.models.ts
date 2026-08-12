/**
 * Espelha com.nimbusflow.works.dto.{request.ApprovalLimitRequest,response.ApprovalLimitResponse}
 * do NimbusFlowServer. Sem paginação (GET /bff/v1/approval-limits retorna tudo de uma vez - lista
 * pequena, mesma premissa de AddendumModel/InstallmentModel dentro de uma obra).
 */
export interface ApprovalLimitModel {
  id: string;
  minAmount: number;
  /** Nulo = sem limite superior. */
  maxAmount: number | null;
  /** Ids do NimbusAuth (não há tabela própria de usuário no NimbusFlowServer) - a tela resolve
   *  o nome exibido cruzando contra UsersApiService.getOptions(). */
  userIds: string[];
  createdAt: string | null;
  updatedAt: string | null;
}

export type ApprovalLimitApiModel = ApprovalLimitModel;

export interface ApprovalLimitInput {
  minAmount: number;
  maxAmount: number | null;
  userIds: string[];
}

export function mapApprovalLimitApiModel(input: ApprovalLimitApiModel): ApprovalLimitModel {
  return { ...input, userIds: input.userIds ?? [] };
}

export function mapApprovalLimitApiModels(
  items: ApprovalLimitApiModel[] | null | undefined,
): ApprovalLimitModel[] {
  return (items ?? []).map(mapApprovalLimitApiModel);
}

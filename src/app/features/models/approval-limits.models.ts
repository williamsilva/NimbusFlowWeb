import { UserMinimalModel } from '@models/user-minimal.models';

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
  /** Ids do NimbusAuth (não há tabela própria de usuário no NimbusFlowServer) - usado só pra
   *  prefill do multiselect do formulário de edição (candidatos vêm de
   *  UsersApiService.getOptions()). Não usar pra exibir o nome na listagem - ver `users`. */
  userIds: string[];
  /** Nome/username de cada userIds, já resolvido pelo backend (UserDirectoryService) - ao
   *  contrário de `userIds` cruzado com UsersApiService.getOptions() (restrito a quem atualmente
   *  pertence a algum grupo do nimbusflow), isso resolve mesmo um usuário já removido de todo
   *  grupo - usar isso pra exibir na listagem, nunca userIds cru. */
  users: UserMinimalModel[];
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
  return { ...input, userIds: input.userIds ?? [], users: input.users ?? [] };
}

export function mapApprovalLimitApiModels(
  items: ApprovalLimitApiModel[] | null | undefined,
): ApprovalLimitModel[] {
  return (items ?? []).map(mapApprovalLimitApiModel);
}

import { UserMinimalModel } from '@models/user-minimal.models';

/**
 * Espelha com.nimbusflow.tickets.dto.{request.DepartmentRequest,response.DepartmentResponse} do
 * NimbusFlowServer. Sem paginação (GET /bff/v1/departments retorna tudo de uma vez - lista
 * pequena, mesma premissa de ApprovalLimitModel).
 */
export interface DepartmentModel {
  id: string;
  name: string;
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

export type DepartmentApiModel = DepartmentModel;

export interface DepartmentInput {
  name: string;
  userIds: string[];
}

export function mapDepartmentApiModel(input: DepartmentApiModel): DepartmentModel {
  return { ...input, userIds: input.userIds ?? [], users: input.users ?? [] };
}

export function mapDepartmentApiModels(
  items: DepartmentApiModel[] | null | undefined,
): DepartmentModel[] {
  return (items ?? []).map(mapDepartmentApiModel);
}

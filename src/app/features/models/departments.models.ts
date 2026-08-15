/**
 * Espelha com.nimbusflow.tickets.dto.{request.DepartmentRequest,response.DepartmentResponse} do
 * NimbusFlowServer. Sem paginação (GET /bff/v1/departments retorna tudo de uma vez - lista
 * pequena, mesma premissa de ApprovalLimitModel).
 */
export interface DepartmentModel {
  id: string;
  name: string;
  /** Ids do NimbusAuth (não há tabela própria de usuário no NimbusFlowServer) - a tela resolve
   *  o nome exibido cruzando contra UsersApiService.getOptions(). */
  userIds: string[];
  createdAt: string | null;
  updatedAt: string | null;
}

export type DepartmentApiModel = DepartmentModel;

export interface DepartmentInput {
  name: string;
  userIds: string[];
}

export function mapDepartmentApiModel(input: DepartmentApiModel): DepartmentModel {
  return { ...input, userIds: input.userIds ?? [] };
}

export function mapDepartmentApiModels(
  items: DepartmentApiModel[] | null | undefined,
): DepartmentModel[] {
  return (items ?? []).map(mapDepartmentApiModel);
}

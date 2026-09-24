import { UserMinimalModel } from '@models/user-minimal.models';

/**
 * Espelha com.nimbusflow.tickets.dto.{request.CargoRequest,response.CargoResponse} do
 * NimbusFlowServer - cópia 1:1 de DepartmentModel (ver departments.models.ts), usado pelo
 * diálogo "Gerenciar permissões" de Categoria de Tarefa.
 */
export interface CargoModel {
  id: string;
  name: string;
  /** Ids do NimbusCore - usado só pra prefill do multiselect do formulário de edição (candidatos
   *  vêm de UsersApiService.getOptions()). Não usar pra exibir o nome na listagem - ver `users`. */
  userIds: string[];
  /** Nome/username de cada userIds, já resolvido pelo backend (UserDirectoryService) - usar isso
   *  pra exibir na listagem, nunca userIds cru. */
  users: UserMinimalModel[];
  createdAt: string | null;
  updatedAt: string | null;
}

export type CargoApiModel = CargoModel;

export interface CargoInput {
  name: string;
  userIds: string[];
}

export function mapCargoApiModel(input: CargoApiModel): CargoModel {
  return { ...input, userIds: input.userIds ?? [], users: input.users ?? [] };
}

export function mapCargoApiModels(items: CargoApiModel[] | null | undefined): CargoModel[] {
  return (items ?? []).map(mapCargoApiModel);
}

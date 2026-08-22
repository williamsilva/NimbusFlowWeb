import { GeracaoRegistro, StatusLocalizacao } from '@models/patrimonio-enums';

/** Espelha com.nimbusflow.patrimonio.dto.{request.LocalizacaoRequest,response.LocalizacaoResponse}
 *  do NimbusFlowServer. Sem paginação (lista pequena, mesma premissa de DepartmentModel).
 *  geracao=SISTEMA identifica "Autorizada"/"Almoxarifado" (ver Localizacao.AUTORIZADA_ID/
 *  ALMOXARIFADO_ID no backend) - protegidas contra edição/exclusão. */
export interface LocalizacaoModel {
  id: string;
  descricao: string;
  status: StatusLocalizacao;
  geracao: GeracaoRegistro;
  createdAt: string | null;
  updatedAt: string | null;
}

export type LocalizacaoApiModel = LocalizacaoModel;

export interface LocalizacaoUpsertInput {
  descricao: string;
  status: StatusLocalizacao;
}

export interface LocalizacaoOptionModel {
  id: string;
  descricao: string;
}

export function mapLocalizacaoApiModel(input: LocalizacaoApiModel): LocalizacaoModel {
  return { ...input };
}

export function mapLocalizacaoApiModels(
  items: LocalizacaoApiModel[] | null | undefined,
): LocalizacaoModel[] {
  return (items ?? []).map(mapLocalizacaoApiModel);
}

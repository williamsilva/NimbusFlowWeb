import { PeriodEnum } from '@models/enums/period.enum';
import { GeracaoRegistro, StatusLocalizacao } from '@models/patrimonio-enums';

/** Espelha com.nimbusflow.patrimonio.dto.{request.LocalizacaoRequest,response.LocalizacaoResponse}
 *  do NimbusFlowServer. A tela de listagem usa `/localizacoes/search` (paginação/filtro/
 *  ordenação em memória, ver LocalizacaoService#search) - `list()`/`GET` continua servindo o
 *  seletor de Localização no formulário de Histórico. geracao=SISTEMA identifica "Autorizada"/
 *  "Almoxarifado" (ver Localizacao.AUTORIZADA_ID/ALMOXARIFADO_ID no backend) - protegidas contra
 *  edição/exclusão. */
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

export type LocalizacoesFiltersState = {
  descricao: string;
  status: string[] | null;
  createdAt: string | string[] | null;
  periodCreatedAt: PeriodEnum | null;
};

export function mapLocalizacaoApiModel(input: LocalizacaoApiModel): LocalizacaoModel {
  return { ...input };
}

export function mapLocalizacaoApiModels(
  items: LocalizacaoApiModel[] | null | undefined,
): LocalizacaoModel[] {
  return (items ?? []).map(mapLocalizacaoApiModel);
}

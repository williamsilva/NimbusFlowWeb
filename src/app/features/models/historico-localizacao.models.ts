import { PeriodEnum } from '@models/enums/period.enum';
import { GeracaoRegistro, StatusHistoricoLocalizacao } from '@models/patrimonio-enums';
import { EquipamentoOptionModel } from '@models/equipamentos.models';
import { LocalizacaoOptionModel } from '@models/localizacoes.models';

/** Espelha com.nimbusflow.patrimonio.dto.{request.HistoricoLocalizacaoRequest,
 *  response.HistoricoLocalizacaoResponse} do NimbusFlowServer. geracao=SISTEMA identifica
 *  registros criados automaticamente (ao cadastrar um Equipamento, ou ao abrir/receber uma
 *  Manutenção) - protegidos contra edição/exclusão. */
export interface HistoricoLocalizacaoModel {
  id: string;
  equipamento: EquipamentoOptionModel;
  localizacao: LocalizacaoOptionModel;
  status: StatusHistoricoLocalizacao;
  geracao: GeracaoRegistro;
  dataInicial: string;
  dataFinal: string | null;
  observacao: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export type HistoricoLocalizacaoApiModel = HistoricoLocalizacaoModel;

export interface HistoricoLocalizacaoUpsertInput {
  equipamentoId: string;
  localizacaoId: string;
  status: StatusHistoricoLocalizacao;
  dataInicial: string;
  dataFinal: string | null;
  observacao: string | null;
}

export type HistoricoLocalizacaoFiltersState = {
  equipamento: string;
  localizacao: string;
  status: string[] | null;
  dataInicial: string | string[] | null;
  periodDataInicial: PeriodEnum | null;
};

export function mapHistoricoLocalizacaoApiModel(
  input: HistoricoLocalizacaoApiModel,
): HistoricoLocalizacaoModel {
  return { ...input };
}

export function mapHistoricoLocalizacaoApiModels(
  items: HistoricoLocalizacaoApiModel[] | null | undefined,
): HistoricoLocalizacaoModel[] {
  return (items ?? []).map(mapHistoricoLocalizacaoApiModel);
}

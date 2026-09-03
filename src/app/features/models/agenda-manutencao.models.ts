import { PeriodEnum } from '@models/enums/period.enum';
import {
  FrequenciaManutencao,
  PerfilNotificacao,
  StatusAgendaManutencao,
  TipoManutencao,
} from '@models/patrimonio-enums';
import { EquipamentoOptionModel } from '@models/equipamentos.models';

/** Espelha com.nimbusflow.patrimonio.dto.{request.AgendaManutencaoRequest,
 *  response.AgendaManutencaoResponse} do NimbusFlowServer. `proximaManutencao` é sempre
 *  recalculado no backend a partir da frequência e da última Manutencao.dataEnvio do equipamento -
 *  não faz parte do input, só da resposta (ver AgendaManutencaoService). */
export interface AgendaManutencaoModel {
  id: string;
  equipamento: EquipamentoOptionModel;
  status: StatusAgendaManutencao;
  frequencia: FrequenciaManutencao;
  tipoManutencao: TipoManutencao;
  perfilNotificacao: PerfilNotificacao;
  proximaManutencao: string;
  observacao: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export type AgendaManutencaoApiModel = AgendaManutencaoModel;

export interface AgendaManutencaoUpsertInput {
  equipamentoId: string;
  status: StatusAgendaManutencao;
  frequencia: FrequenciaManutencao;
  tipoManutencao: TipoManutencao;
  perfilNotificacao: PerfilNotificacao;
  observacao: string | null;
}

export type AgendaManutencaoFiltersState = {
  equipamento: string;
  status: string[] | null;
  frequencia: string[] | null;
  tipoManutencao: string[] | null;
  perfilNotificacao: string[] | null;
  proximaManutencao: string | string[] | null;
  periodProximaManutencao: PeriodEnum | null;
};

export function mapAgendaManutencaoApiModel(input: AgendaManutencaoApiModel): AgendaManutencaoModel {
  return { ...input };
}

export function mapAgendaManutencaoApiModels(
  items: AgendaManutencaoApiModel[] | null | undefined,
): AgendaManutencaoModel[] {
  return (items ?? []).map(mapAgendaManutencaoApiModel);
}

import { StatusManutencao, TipoManutencao } from '@models/patrimonio-enums';
import { EquipamentoOptionModel } from '@models/equipamentos.models';

/** Espelha com.nimbusflow.patrimonio.dto.{request.ManutencaoRequest,response.ManutencaoResponse}
 *  do NimbusFlowServer. Abrir uma manutenção nova ou recebê-la de volta move automaticamente o
 *  Equipamento entre Almoxarifado/Autorizada no backend (ver ManutencaoService) - o frontend só
 *  precisa recarregar Equipamentos/Histórico se essas telas estiverem abertas (não faz isso
 *  automaticamente hoje). */
export interface ManutencaoModel {
  id: string;
  equipamento: EquipamentoOptionModel;
  autorizadaNome: string;
  status: StatusManutencao;
  tipoManutencao: TipoManutencao;
  preco: number;
  dataEnvio: string;
  dataRetorno: string | null;
  inicioGarantia: string | null;
  fimGarantia: string | null;
  descricao: string;
  observacao: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export type ManutencaoApiModel = ManutencaoModel;

export interface ManutencaoUpsertInput {
  equipamentoId: string;
  autorizadaNome: string;
  status: StatusManutencao;
  tipoManutencao: TipoManutencao;
  preco: number | null;
  dataEnvio: string;
  dataRetorno: string | null;
  inicioGarantia: string | null;
  fimGarantia: string | null;
  descricao: string;
  observacao: string | null;
}

export function mapManutencaoApiModel(input: ManutencaoApiModel): ManutencaoModel {
  return { ...input };
}

export function mapManutencaoApiModels(
  items: ManutencaoApiModel[] | null | undefined,
): ManutencaoModel[] {
  return (items ?? []).map(mapManutencaoApiModel);
}

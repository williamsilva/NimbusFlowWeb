import { StatusManutencao } from '@models/patrimonio-enums';

/** Espelha com.nimbusflow.patrimonio.dto.response.{TotalEquipamentosResponse,
 *  TotalManutencoesResponse,TopEquipamentoResponse,ManutencoesPorStatusResponse} do
 *  NimbusFlowServer. */
export interface TotalEquipamentosModel {
  totalEquipamentos: number;
  valorTotal: number;
}

export interface TotalManutencoesModel {
  totalEquipamentosEmManutencao: number;
  totalManutencoes: number;
  valorTotal: number;
}

export interface TopEquipamentoModel {
  equipamentoId: string;
  numeroPatrimonio: number;
  descricao: string;
  totalManutencoes: number;
  valorTotal: number;
}

export interface ManutencoesPorStatusModel {
  status: StatusManutencao;
  total: number;
}

import { StatusEquipamento, VoltagemEquipamento } from '@models/patrimonio-enums';

/** Espelha com.nimbusflow.patrimonio.dto.{request.EquipamentoRequest,response.EquipamentoResponse}
 *  do NimbusFlowServer. Sem paginação server-side (volume pequeno, dezenas de registros) - lista
 *  carregada por completo via GET, mesmo racional de DepartmentModel. */
export interface EquipamentoModel {
  id: string;
  numeroPatrimonio: number;
  descricao: string;
  fornecedorNome: string;
  status: StatusEquipamento;
  voltagem: VoltagemEquipamento | null;
  preco: number;
  dataCompra: string | null;
  dataChegada: string | null;
  inicioGarantia: string | null;
  fimGarantia: string | null;
  observacao: string | null;
  totalManutencoes: number;
  ultimaManutencao: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export type EquipamentoApiModel = EquipamentoModel;

export interface EquipamentoUpsertInput {
  numeroPatrimonio: number;
  descricao: string;
  fornecedorNome: string;
  status: StatusEquipamento | null;
  voltagem: VoltagemEquipamento | null;
  preco: number | null;
  dataCompra: string | null;
  dataChegada: string | null;
  inicioGarantia: string | null;
  fimGarantia: string | null;
  observacao: string | null;
}

/** Pros seletores de Equipamento nos formulários de Manutenção/Agenda/Histórico. */
export interface EquipamentoOptionModel {
  id: string;
  numeroPatrimonio: number;
  descricao: string;
  status: StatusEquipamento;
}

export function mapEquipamentoApiModel(input: EquipamentoApiModel): EquipamentoModel {
  return { ...input };
}

export function mapEquipamentoApiModels(
  items: EquipamentoApiModel[] | null | undefined,
): EquipamentoModel[] {
  return (items ?? []).map(mapEquipamentoApiModel);
}

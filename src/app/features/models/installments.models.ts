import { PeriodEnum } from '@models/enums/period.enum';
import { ApprovalRangeModel } from '@models/addendums.models';
import { InstallmentStatusEnum } from '@models/enums/installment-status.enum';

/**
 * Espelha com.nimbusflow.works.dto.response.InstallmentResponse do NimbusFlowServer. Parcela
 * (ordem de pagamento) não é mais cadastrada manualmente - nasce automaticamente quando uma
 * Medição da obra é aprovada (ver measurements.models.ts). Lista não paginada (GET
 * /bff/v1/works/{workId}/installments retorna todas as parcelas da obra de uma vez).
 */
export interface InstallmentModel {
  id: string;
  workId: string;
  number: number;
  amount: number;
  dueDate: string;
  status: InstallmentStatusEnum;
  /** true se o usuário logado pode liberar ESTA parcela agora (status MEASUREMENT_APPROVED +
   *  permissão de liberar + dentro da faixa de valor de Configurações > Alçada) - mesmo padrão de
   *  AddendumModel.canDecide, ver InstallmentService.canRelease/canReleasePending. */
  canRelease: boolean;
  /** Faixas de Configurações > Alçada que cobrem {@code amount} agora - mesmo papel de
   *  AddendumModel.approvalRanges, exibido na coluna "Alçada" da tela Pagamentos. */
  approvalRanges: ApprovalRangeModel[];
  releasedById: string | null;
  releasedAt: string | null;
  paidAt: string | null;
  cancelledById: string | null;
  cancelledAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export type InstallmentApiModel = InstallmentModel;

/** Espelha InstallmentWithWorkResponse - usado pela listagem global (menu "Pagamentos", através de todas as obras). */
export interface InstallmentWithWorkModel extends InstallmentModel {
  workName: string;
}

export type InstallmentWithWorkApiModel = InstallmentWithWorkModel;

/** Estado persistido do painel de filtros avançados da listagem global (menu "Pagamentos"). */
export type InstallmentsFiltersState = {
  workName: string;
  status: string[] | null;
  amountFrom: number | null;
  amountTo: number | null;
  dueDate: string | string[] | null;
  periodDueDate: PeriodEnum | null;
};

export function mapInstallmentApiModel(input: InstallmentApiModel): InstallmentModel {
  return { ...input };
}

export function mapInstallmentApiModels(
  items: InstallmentApiModel[] | null | undefined,
): InstallmentModel[] {
  return (items ?? []).map(mapInstallmentApiModel);
}

export function mapInstallmentWithWorkApiModel(
  input: InstallmentWithWorkApiModel,
): InstallmentWithWorkModel {
  return { ...input };
}

export function mapInstallmentWithWorkApiModels(
  items: InstallmentWithWorkApiModel[] | null | undefined,
): InstallmentWithWorkModel[] {
  return (items ?? []).map(mapInstallmentWithWorkApiModel);
}

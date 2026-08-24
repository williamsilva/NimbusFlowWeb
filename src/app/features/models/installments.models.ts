import { PeriodEnum } from '@models/enums/period.enum';
import { ApprovalRangeModel } from '@models/addendums.models';
import { UserMinimalModel } from '@models/user-minimal.models';
import { PaymentStatusEnum } from '@models/enums/payment-status.enum';
import { InstallmentStatusEnum } from '@models/enums/installment-status.enum';

/**
 * Espelha com.nimbusflow.works.dto.response.InstallmentResponse do NimbusFlowServer (nome mantido
 * por herança - hoje representa uma Ordem de Pagamento, não mais o ciclo inteiro até o pagamento;
 * ver payments.models.ts pro Pagamento em si). A Ordem não é cadastrada manualmente - nasce
 * automaticamente quando uma Medição da obra é aprovada (ver measurements.models.ts). Lista não
 * paginada (GET /bff/v1/works/{workId}/payment-orders retorna todas as ordens da obra de uma vez).
 */
export interface InstallmentModel {
  id: string;
  workId: string;
  number: number;
  amount: number;
  dueDate: string;
  status: InstallmentStatusEnum;
  /** Fornecedor da obra desta Ordem - usado pra rotular a confirmação de "Marcar como pago". */
  supplierName: string;
  /** Nulo enquanto a Ordem não entrar num envio (tela "Ordens de Pagamento") - a partir daí,
   *  nunca muda. Junto com installmentStatus, decide se a ação "Marcar como pago" aparece. */
  installmentId: string | null;
  installmentStatus: PaymentStatusEnum | null;
  installmentPaidAt: string | null;
  /** Valor TOTAL do Pagamento consolidado (soma de todas as Ordens do mesmo envio, não só o
   *  amount desta Ordem) - é isso que a coluna "Pagamento" mostra pra o usuário conseguir achar
   *  "a parcela" que o envio gerou. */
  installmentAmount: number | null;
  /** Todas as Ordens (podendo ser de obras diferentes) incluídas no mesmo Pagamento - vazia
   *  enquanto installmentId for nulo. Mostrado ao expandir a linha. */
  installmentOrders: InstallmentOrderSummaryModel[];
  /** true se o usuário logado pode liberar ESTA ordem agora (status MEASUREMENT_APPROVED +
   *  permissão de liberar + dentro da faixa de valor de Configurações > Alçada) - mesmo padrão de
   *  AddendumModel.canDecide, ver PaymentOrderService.canRelease/canReleasePending. */
  canRelease: boolean;
  /** Faixas de Configurações > Alçada que cobrem {@code amount} agora - mesmo papel de
   *  AddendumModel.approvalRanges, exibido na coluna "Alçada" da tela Pagamentos. */
  approvalRanges: ApprovalRangeModel[];
  releasedById: string | null;
  /** Nome/username de releasedById, resolvido pelo backend (UserDirectoryService) - null
   *  enquanto a ordem nunca foi liberada ou se o NimbusAuth não puder ser consultado. Exibido
   *  na coluna "Usuário aprovador" da tela Pagamentos. */
  releasedBy: UserMinimalModel | null;
  releasedAt: string | null;
  cancelledById: string | null;
  cancelledAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export type InstallmentApiModel = InstallmentModel;

/** Espelha InstallmentOrderSummaryResponse - 1 Ordem incluída no mesmo Pagamento consolidado. */
export interface InstallmentOrderSummaryModel {
  id: string;
  workName: string;
  number: number;
  amount: number;
  dueDate: string;
}

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

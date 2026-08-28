import { PeriodEnum } from '@models/enums/period.enum';
import { UserMinimalModel } from '@models/user-minimal.models';
import { PaymentStatusEnum } from '@models/enums/payment-status.enum';

/** Espelha InstallmentOrderSummaryResponse - 1 Ordem incluída num Pagamento consolidado. Mesmo
 *  formato usado do lado da Ordem (ver installments.models.ts), reexportado aqui por
 *  conveniência já que quem importa payments.models.ts normalmente precisa dos dois juntos. */
export interface InstallmentOrderSummaryModel {
  id: string;
  workName: string;
  number: number;
  amount: number;
  dueDate: string;
}

/**
 * Espelha com.nimbusflow.works.dto.response.PaymentResponse do NimbusFlowServer - o envio
 * consolidado de N Ordens de Pagamento de um fornecedor (ver installments.models.ts pra Ordem),
 * criado na tela "Ordens de Pagamento" e depois confirmado como pago aqui. Paginado/filtrado/
 * ordenado no backend, mesmo padrão de InstallmentWithWorkModel.
 */
export interface PaymentModel {
  id: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  status: PaymentStatusEnum;
  sentById: string | null;
  sentBy: UserMinimalModel | null;
  sentAt: string | null;
  paidAt: string | null;
  /** Todas as Ordens (podendo ser de obras/projetos diferentes) incluídas neste envio - mostrado
   *  ao expandir a linha. */
  orders: InstallmentOrderSummaryModel[];
  /** true se o usuário logado pode desfazer "marcar como pago" agora (status == PAID + permissão
   *  PARCELA_DESFAZER_PAGAMENTO) - volta pra SENT. */
  canUndoMarkPaid: boolean;
  /** true se o usuário logado pode desfazer o envio agora (status == SENT + permissão
   *  PARCELA_DESFAZER_ENVIO) - as Ordens incluídas voltam a MEASUREMENT_APPROVED (não liberadas) e
   *  este Pagamento é excluído. */
  canUndoSend: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export type PaymentApiModel = PaymentModel;

/** Estado persistido do painel de filtros avançados da tela "Pagamentos". */
export type PaymentsFiltersState = {
  supplierName: string;
  status: string[] | null;
  amountFrom: number | null;
  amountTo: number | null;
  sentAt: string | string[] | null;
  periodSentAt: PeriodEnum | null;
};

export function mapPaymentApiModel(input: PaymentApiModel): PaymentModel {
  return { ...input };
}

export function mapPaymentApiModels(items: PaymentApiModel[] | null | undefined): PaymentModel[] {
  return (items ?? []).map(mapPaymentApiModel);
}

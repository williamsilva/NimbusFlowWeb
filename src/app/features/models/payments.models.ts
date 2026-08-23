import { UserMinimalModel } from '@models/user-minimal.models';
import { PaymentStatusEnum } from '@models/enums/payment-status.enum';

/**
 * Espelha com.nimbusflow.works.dto.response.PaymentResponse do NimbusFlowServer - o envio
 * consolidado de N Ordens de Pagamento de um fornecedor (ver installments.models.ts pra Ordem),
 * criado na tela "Ordens de Pagamento" e depois confirmado como pago na tela "Pagamentos". Lista
 * não paginada (mesmo espírito de findReleasedBySupplier - volume esperado pequeno).
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
  orderCount: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export function mapPaymentApiModel(input: PaymentModel): PaymentModel {
  return { ...input };
}

export function mapPaymentApiModels(items: PaymentModel[] | null | undefined): PaymentModel[] {
  return (items ?? []).map(mapPaymentApiModel);
}

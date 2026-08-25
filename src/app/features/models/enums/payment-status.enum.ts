import { StatusTone } from '@shared/features/status-badge/status-badge.component';

/**
 * Espelha com.nimbusflow.works.model.PaymentStatus do NimbusFlowServer. O Pagamento nasce direto
 * em SENT quando o usuário seleciona N Ordens de Pagamento liberadas do mesmo fornecedor e clica
 * "Enviar" (tela "Ordens de Pagamento") - SENT->PAID via a tela "Pagamentos" (marcar como pago).
 */
export enum PaymentStatusEnum {
  SENT = 'SENT',
  PAID = 'PAID',
}

export const PAYMENT_STATUS_VALUES: PaymentStatusEnum[] = [
  PaymentStatusEnum.SENT,
  PaymentStatusEnum.PAID,
];

const TONE_MAP: Record<PaymentStatusEnum, StatusTone> = {
  [PaymentStatusEnum.SENT]: 'warn',
  [PaymentStatusEnum.PAID]: 'success',
};

export function paymentStatusTone(status: PaymentStatusEnum | string | null | undefined): StatusTone {
  return status ? TONE_MAP[status as PaymentStatusEnum] ?? 'neutral' : 'neutral';
}

/**
 * Extensão só de frontend de PaymentStatusEnum, usada pela coluna/filtro "Pagamento" da tela
 * "Parcelas Liberadas" (`AllInstallmentsListComponent`) - NOT_SENT é um sentinela sem
 * correspondente em com.nimbusflow.works.model.PaymentStatus, representando uma Ordem que ainda
 * não entrou em nenhum Pagamento (installmentId nulo). Ver PaymentOrderService.paymentStatusKey
 * no backend, que usa a mesma string "NOT_SENT" pro filtro/ordenação.
 */
export enum PaymentOrderPaymentStatusEnum {
  NOT_SENT = 'NOT_SENT',
  SENT = 'SENT',
  PAID = 'PAID',
}

export const PAYMENT_ORDER_PAYMENT_STATUS_VALUES: PaymentOrderPaymentStatusEnum[] = [
  PaymentOrderPaymentStatusEnum.NOT_SENT,
  PaymentOrderPaymentStatusEnum.SENT,
  PaymentOrderPaymentStatusEnum.PAID,
];

const ORDER_PAYMENT_TONE_MAP: Record<PaymentOrderPaymentStatusEnum, StatusTone> = {
  [PaymentOrderPaymentStatusEnum.NOT_SENT]: 'neutral',
  [PaymentOrderPaymentStatusEnum.SENT]: 'warn',
  [PaymentOrderPaymentStatusEnum.PAID]: 'success',
};

export function paymentOrderPaymentStatusTone(
  status: PaymentOrderPaymentStatusEnum | string | null | undefined,
): StatusTone {
  return status ? ORDER_PAYMENT_TONE_MAP[status as PaymentOrderPaymentStatusEnum] ?? 'neutral' : 'neutral';
}

/** Deriva a chave de status do Pagamento pra uma linha da Ordem (coluna/filtro "Pagamento") -
 *  mesma regra usada no backend (PaymentOrderService.paymentStatusKey). */
export function paymentOrderPaymentStatusKey(
  installmentId: string | null,
  installmentStatus: PaymentStatusEnum | null,
): PaymentOrderPaymentStatusEnum {
  if (installmentId === null || installmentStatus === null) {
    return PaymentOrderPaymentStatusEnum.NOT_SENT;
  }
  return installmentStatus as unknown as PaymentOrderPaymentStatusEnum;
}

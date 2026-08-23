import { StatusTone } from '@shared/features/status-badge/status-badge.component';

/**
 * Espelha com.nimbusflow.works.model.PaymentStatus do NimbusFlowServer. O Pagamento nasce direto
 * em SENT quando o usuário seleciona N Ordens de Pagamento liberadas do mesmo fornecedor e clica
 * "Enviar" (tela "Ordens de Pagamento") - SENT->PAID via a tela "Parcelas Liberadas" (marcar como
 * pago na linha da Ordem, ver InstallmentWithWorkModel.installmentStatus).
 */
export enum PaymentStatusEnum {
  SENT = 'SENT',
  PAID = 'PAID',
}

const TONE_MAP: Record<PaymentStatusEnum, StatusTone> = {
  [PaymentStatusEnum.SENT]: 'warn',
  [PaymentStatusEnum.PAID]: 'success',
};

export function paymentStatusTone(status: PaymentStatusEnum | string | null | undefined): StatusTone {
  return status ? TONE_MAP[status as PaymentStatusEnum] ?? 'neutral' : 'neutral';
}

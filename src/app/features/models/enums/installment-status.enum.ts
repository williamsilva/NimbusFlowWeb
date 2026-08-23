import { StatusTone } from '@shared/features/status-badge/status-badge.component';

/**
 * Espelha com.nimbusflow.works.model.PaymentOrderStatus do NimbusFlowServer (nome mantido por
 * herança - até 2026-08-23 era com.nimbusflow.works.model.InstallmentStatus, incluindo PAID). A
 * Ordem de Pagamento nasce direto em MEASUREMENT_APPROVED (gerada quando uma Medição da obra é
 * aprovada) - não existe mais um estado "planejada aguardando medição". Sem PAID: isso agora é
 * responsabilidade do Pagamento (ver payment-status.enum.ts), não da Ordem em si.
 */
export enum InstallmentStatusEnum {
  MEASUREMENT_APPROVED = 'MEASUREMENT_APPROVED',
  RELEASED = 'RELEASED',
  /** Medição que a gerou foi editada (ver MeasurementService.updateMeasurement) - só possível
   *  enquanto a Ordem ainda não foi incluída em nenhum Pagamento. */
  CANCELLED = 'CANCELLED',
}

export const INSTALLMENT_STATUS_VALUES: InstallmentStatusEnum[] = [
  InstallmentStatusEnum.MEASUREMENT_APPROVED,
  InstallmentStatusEnum.RELEASED,
  InstallmentStatusEnum.CANCELLED,
];

const TONE_MAP: Record<InstallmentStatusEnum, StatusTone> = {
  [InstallmentStatusEnum.MEASUREMENT_APPROVED]: 'info',
  [InstallmentStatusEnum.RELEASED]: 'warn',
  [InstallmentStatusEnum.CANCELLED]: 'danger',
};

export function installmentStatusTone(
  status: InstallmentStatusEnum | string | null | undefined,
): StatusTone {
  return status ? TONE_MAP[status as InstallmentStatusEnum] ?? 'neutral' : 'neutral';
}

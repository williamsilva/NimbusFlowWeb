import { StatusTone } from '@shared/features/status-badge/status-badge.component';

/**
 * Espelha com.nimbusflow.works.model.InstallmentStatus do NimbusFlowServer. A parcela nasce
 * direto em MEASUREMENT_APPROVED (gerada quando uma Medição da obra é aprovada) - não existe
 * mais um estado "planejada aguardando medição".
 */
export enum InstallmentStatusEnum {
  MEASUREMENT_APPROVED = 'MEASUREMENT_APPROVED',
  RELEASED = 'RELEASED',
  PAID = 'PAID',
  /** Medição que a gerou foi editada (ver MeasurementService.updateMeasurement) - nunca alcançável a partir de PAID. */
  CANCELLED = 'CANCELLED',
}

export const INSTALLMENT_STATUS_VALUES: InstallmentStatusEnum[] = [
  InstallmentStatusEnum.MEASUREMENT_APPROVED,
  InstallmentStatusEnum.RELEASED,
  InstallmentStatusEnum.PAID,
  InstallmentStatusEnum.CANCELLED,
];

const TONE_MAP: Record<InstallmentStatusEnum, StatusTone> = {
  [InstallmentStatusEnum.MEASUREMENT_APPROVED]: 'info',
  [InstallmentStatusEnum.RELEASED]: 'warn',
  [InstallmentStatusEnum.PAID]: 'success',
  [InstallmentStatusEnum.CANCELLED]: 'danger',
};

export function installmentStatusTone(
  status: InstallmentStatusEnum | string | null | undefined,
): StatusTone {
  return status ? TONE_MAP[status as InstallmentStatusEnum] ?? 'neutral' : 'neutral';
}

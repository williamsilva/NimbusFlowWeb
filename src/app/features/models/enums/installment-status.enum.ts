import { StatusTone } from '@shared/features/status-badge/status-badge.component';

/** Espelha com.nimbusflow.works.model.InstallmentStatus do NimbusFlowServer. */
export enum InstallmentStatusEnum {
  PLANNED = 'PLANNED',
  MEASUREMENT_SUBMITTED = 'MEASUREMENT_SUBMITTED',
  MEASUREMENT_APPROVED = 'MEASUREMENT_APPROVED',
  RELEASED = 'RELEASED',
  PAID = 'PAID',
}

export const INSTALLMENT_STATUS_VALUES: InstallmentStatusEnum[] = [
  InstallmentStatusEnum.PLANNED,
  InstallmentStatusEnum.MEASUREMENT_SUBMITTED,
  InstallmentStatusEnum.MEASUREMENT_APPROVED,
  InstallmentStatusEnum.RELEASED,
  InstallmentStatusEnum.PAID,
];

const TONE_MAP: Record<InstallmentStatusEnum, StatusTone> = {
  [InstallmentStatusEnum.PLANNED]: 'neutral',
  [InstallmentStatusEnum.MEASUREMENT_SUBMITTED]: 'info',
  [InstallmentStatusEnum.MEASUREMENT_APPROVED]: 'info',
  [InstallmentStatusEnum.RELEASED]: 'warn',
  [InstallmentStatusEnum.PAID]: 'success',
};

export function installmentStatusTone(
  status: InstallmentStatusEnum | string | null | undefined,
): StatusTone {
  return status ? TONE_MAP[status as InstallmentStatusEnum] ?? 'neutral' : 'neutral';
}

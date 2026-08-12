import { StatusTone } from '@shared/features/status-badge/status-badge.component';

/** Espelha com.nimbusflow.works.model.AddendumStatus do NimbusFlowServer. */
export enum AddendumStatusEnum {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export const ADDENDUM_STATUS_VALUES: AddendumStatusEnum[] = [
  AddendumStatusEnum.PENDING,
  AddendumStatusEnum.APPROVED,
  AddendumStatusEnum.REJECTED,
];

const TONE_MAP: Record<AddendumStatusEnum, StatusTone> = {
  [AddendumStatusEnum.PENDING]: 'warn',
  [AddendumStatusEnum.APPROVED]: 'success',
  [AddendumStatusEnum.REJECTED]: 'danger',
};

export function addendumStatusTone(
  status: AddendumStatusEnum | string | null | undefined,
): StatusTone {
  return status ? TONE_MAP[status as AddendumStatusEnum] ?? 'neutral' : 'neutral';
}

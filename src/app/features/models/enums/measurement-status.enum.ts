import { StatusTone } from '@shared/features/status-badge/status-badge.component';

/** Espelha com.nimbusflow.works.model.MeasurementStatus do NimbusFlowServer. */
export enum MeasurementStatusEnum {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export const MEASUREMENT_STATUS_VALUES: MeasurementStatusEnum[] = [
  MeasurementStatusEnum.PENDING,
  MeasurementStatusEnum.APPROVED,
  MeasurementStatusEnum.REJECTED,
];

const TONE_MAP: Record<MeasurementStatusEnum, StatusTone> = {
  [MeasurementStatusEnum.PENDING]: 'warn',
  [MeasurementStatusEnum.APPROVED]: 'success',
  [MeasurementStatusEnum.REJECTED]: 'danger',
};

export function measurementStatusTone(
  status: MeasurementStatusEnum | string | null | undefined,
): StatusTone {
  return status ? TONE_MAP[status as MeasurementStatusEnum] ?? 'neutral' : 'neutral';
}

/** Espelha com.nimbusflow.works.model.MediaType. */
export enum MediaTypeEnum {
  PHOTO = 'PHOTO',
  VIDEO = 'VIDEO',
}

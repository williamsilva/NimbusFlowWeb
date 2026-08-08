import { StatusTone } from '@shared/features/status-badge/status-badge.component';

/** Espelha com.nimbusflow.works.model.WorkStatus do NimbusFlowServer. */
export enum WorkStatusEnum {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export const WORK_STATUS_VALUES: WorkStatusEnum[] = [
  WorkStatusEnum.PLANNED,
  WorkStatusEnum.IN_PROGRESS,
  WorkStatusEnum.PAUSED,
  WorkStatusEnum.COMPLETED,
  WorkStatusEnum.CANCELLED,
];

const TONE_MAP: Record<WorkStatusEnum, StatusTone> = {
  [WorkStatusEnum.PLANNED]: 'info',
  [WorkStatusEnum.IN_PROGRESS]: 'warn',
  [WorkStatusEnum.PAUSED]: 'neutral',
  [WorkStatusEnum.COMPLETED]: 'success',
  [WorkStatusEnum.CANCELLED]: 'danger',
};

export function workStatusTone(status: WorkStatusEnum | string | null | undefined): StatusTone {
  return status ? TONE_MAP[status as WorkStatusEnum] ?? 'neutral' : 'neutral';
}

import { StatusTone } from '@shared/features/status-badge/status-badge.component';

/** Espelha com.nimbusflow.works.model.ProjectStatus do NimbusFlowServer. */
export enum ProjectStatusEnum {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export const PROJECT_STATUS_VALUES: ProjectStatusEnum[] = [
  ProjectStatusEnum.PLANNED,
  ProjectStatusEnum.IN_PROGRESS,
  ProjectStatusEnum.PAUSED,
  ProjectStatusEnum.COMPLETED,
  ProjectStatusEnum.CANCELLED,
];

const TONE_MAP: Record<ProjectStatusEnum, StatusTone> = {
  [ProjectStatusEnum.PLANNED]: 'info',
  [ProjectStatusEnum.IN_PROGRESS]: 'warn',
  [ProjectStatusEnum.PAUSED]: 'neutral',
  [ProjectStatusEnum.COMPLETED]: 'success',
  [ProjectStatusEnum.CANCELLED]: 'danger',
};

export function projectStatusTone(status: ProjectStatusEnum | string | null | undefined): StatusTone {
  return status ? TONE_MAP[status as ProjectStatusEnum] ?? 'neutral' : 'neutral';
}

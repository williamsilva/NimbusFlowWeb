import { I18nService } from '@core/i18n/i18n.service';
import { StatusTone } from '@shared/features/status-badge/status-badge.component';

/** Espelha com.nimbusflow.actionplans.model.ActionPlanStatus do NimbusFlowServer. */
export enum ActionPlanStatusEnum {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export const ACTION_PLAN_STATUS_VALUES: ActionPlanStatusEnum[] = [
  ActionPlanStatusEnum.DRAFT,
  ActionPlanStatusEnum.IN_PROGRESS,
  ActionPlanStatusEnum.COMPLETED,
  ActionPlanStatusEnum.CANCELLED,
];

const TONE_MAP: Record<ActionPlanStatusEnum, StatusTone> = {
  [ActionPlanStatusEnum.DRAFT]: 'neutral',
  [ActionPlanStatusEnum.IN_PROGRESS]: 'info',
  [ActionPlanStatusEnum.COMPLETED]: 'success',
  [ActionPlanStatusEnum.CANCELLED]: 'danger',
};

export function actionPlanStatusTone(
  status: ActionPlanStatusEnum | string | null | undefined,
): StatusTone {
  return status ? TONE_MAP[status as ActionPlanStatusEnum] ?? 'neutral' : 'neutral';
}

export function actionPlanStatusLabel(
  status: ActionPlanStatusEnum | string | null | undefined,
  i18n: I18nService,
): string {
  if (!status) return '-';
  return i18n.tUi(`actionPlans.status.${status}` as never);
}

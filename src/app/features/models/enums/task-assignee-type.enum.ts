import { I18nService } from '@core/i18n/i18n.service';

/** Espelha com.nimbusflow.tasks.model.TaskAssigneeType do NimbusFlowServer. */
export enum TaskAssigneeTypeEnum {
  USER = 'USER',
  DEPARTMENT = 'DEPARTMENT',
}

export const TASK_ASSIGNEE_TYPE_VALUES: TaskAssigneeTypeEnum[] = [
  TaskAssigneeTypeEnum.USER,
  TaskAssigneeTypeEnum.DEPARTMENT,
];

export function taskAssigneeTypeLabel(
  type: TaskAssigneeTypeEnum | string | null | undefined,
  i18n: I18nService,
): string {
  if (!type) return '-';
  return i18n.tUi(`tasks.assigneeType.${type}` as never);
}

import { I18nService } from '@core/i18n/i18n.service';

/** Espelha com.nimbusflow.tasks.model.TaskRecurrenceFrequency do NimbusFlowServer. */
export enum TaskRecurrenceFrequencyEnum {
  NONE = 'NONE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

export const TASK_RECURRENCE_FREQUENCY_VALUES: TaskRecurrenceFrequencyEnum[] = [
  TaskRecurrenceFrequencyEnum.NONE,
  TaskRecurrenceFrequencyEnum.DAILY,
  TaskRecurrenceFrequencyEnum.WEEKLY,
  TaskRecurrenceFrequencyEnum.MONTHLY,
];

export function taskRecurrenceFrequencyLabel(
  frequency: TaskRecurrenceFrequencyEnum | string | null | undefined,
  i18n: I18nService,
): string {
  if (!frequency) return '-';
  return i18n.tUi(`tasks.recurrenceFrequency.${frequency}` as never);
}

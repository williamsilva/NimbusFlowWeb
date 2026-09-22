import { I18nService } from '@core/i18n/i18n.service';

/** Espelha com.nimbusflow.tasks.model.TaskRecurrenceFrequency do NimbusFlowServer. DAILY/WEEKLY/
 *  MONTHLY/YEARLY usam recurrenceInterval ("A cada X dias/semanas/meses/anos"); WEEKLY_DAYS/
 *  MONTHLY_DAYS usam recurrenceWeekDays/recurrenceMonthDays (dias específicos). */
export enum TaskRecurrenceFrequencyEnum {
  NONE = 'NONE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
  WEEKLY_DAYS = 'WEEKLY_DAYS',
  MONTHLY_DAYS = 'MONTHLY_DAYS',
}

export const TASK_RECURRENCE_FREQUENCY_VALUES: TaskRecurrenceFrequencyEnum[] = [
  TaskRecurrenceFrequencyEnum.NONE,
  TaskRecurrenceFrequencyEnum.DAILY,
  TaskRecurrenceFrequencyEnum.WEEKLY,
  TaskRecurrenceFrequencyEnum.MONTHLY,
  TaskRecurrenceFrequencyEnum.YEARLY,
  TaskRecurrenceFrequencyEnum.WEEKLY_DAYS,
  TaskRecurrenceFrequencyEnum.MONTHLY_DAYS,
];

export function taskRecurrenceFrequencyLabel(
  frequency: TaskRecurrenceFrequencyEnum | string | null | undefined,
  i18n: I18nService,
): string {
  if (!frequency) return '-';
  return i18n.tUi(`tasks.recurrenceFrequency.${frequency}` as never);
}

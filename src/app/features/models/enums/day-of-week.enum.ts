import { I18nService } from '@core/i18n/i18n.service';

/** Espelha java.time.DayOfWeek (serializado pelo backend por nome, ver
 *  Task.recurrenceWeekDays/TaskRequest.recurrenceWeekDays). */
export enum DayOfWeekEnum {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

export const DAY_OF_WEEK_VALUES: DayOfWeekEnum[] = [
  DayOfWeekEnum.MONDAY,
  DayOfWeekEnum.TUESDAY,
  DayOfWeekEnum.WEDNESDAY,
  DayOfWeekEnum.THURSDAY,
  DayOfWeekEnum.FRIDAY,
  DayOfWeekEnum.SATURDAY,
  DayOfWeekEnum.SUNDAY,
];

export function dayOfWeekLabel(day: DayOfWeekEnum | string | null | undefined, i18n: I18nService): string {
  if (!day) return '-';
  return i18n.tUi(`common.dayOfWeek.${day}` as never);
}

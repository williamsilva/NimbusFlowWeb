import { I18nService } from '@core/i18n/i18n.service';

/** Espelha com.nimbusflow.tasks.model.TaskShift do NimbusFlowServer. */
export enum TaskShiftEnum {
  MORNING = 'MORNING',
  AFTERNOON = 'AFTERNOON',
  EVENING = 'EVENING',
}

export const TASK_SHIFT_VALUES: TaskShiftEnum[] = [
  TaskShiftEnum.MORNING,
  TaskShiftEnum.AFTERNOON,
  TaskShiftEnum.EVENING,
];

export function taskShiftLabel(shift: TaskShiftEnum | string | null | undefined, i18n: I18nService): string {
  if (!shift) return '-';
  return i18n.tUi(`tasks.shift.${shift}` as never);
}

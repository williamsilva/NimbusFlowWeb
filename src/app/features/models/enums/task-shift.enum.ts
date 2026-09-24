import { I18nService } from '@core/i18n/i18n.service';
import { TaskShiftSettingsModel, taskShiftEnd, taskShiftStart } from '@models/task-shift-settings.models';

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

/** "Manhã (06:00-12:00)" (pedido do usuário 2026-09-24 - diferente do Prazo, que é só data, o
 *  Turno tem hora de verdade, vale mostrar). `settings` nulo (ainda carregando, ver
 *  TaskShiftSettingsFacade) cai de volta no rótulo simples, sem o intervalo. */
export function taskShiftRangeLabel(
  shift: TaskShiftEnum | string | null | undefined,
  settings: TaskShiftSettingsModel | null,
  i18n: I18nService,
): string {
  const label = taskShiftLabel(shift, i18n);
  if (!shift || !settings) return label;
  const start = taskShiftStart(shift as TaskShiftEnum, settings).slice(0, 5);
  const end = taskShiftEnd(shift as TaskShiftEnum, settings).slice(0, 5);
  return `${label} (${start}-${end})`;
}

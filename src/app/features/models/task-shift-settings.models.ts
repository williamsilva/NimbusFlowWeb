import { TaskShiftEnum } from '@models/enums/task-shift.enum';

/**
 * Espelha com.nimbusflow.tasks.core.{TaskShiftSettingsModel,TaskShiftSettingsRequest} do
 * NimbusFlowServer - horário de início/fim de cada Turno (pedido do usuário 2026-09-24), linha
 * única editável em Configurações > Turnos. Cada campo é uma string "HH:mm:ss" (serialização
 * padrão de java.time.LocalTime).
 */
export interface TaskShiftSettingsModel {
  morningStart: string;
  morningEnd: string;
  afternoonStart: string;
  afternoonEnd: string;
  eveningStart: string;
  eveningEnd: string;
}

export type TaskShiftSettingsInput = TaskShiftSettingsModel;

/** Espelha TaskShiftSettingsModel#startOf/#endOf do backend - centraliza aqui o "qual par de
 *  campos corresponde a qual Turno" pra não espalhar esse switch em quem consome (pedido do
 *  usuário 2026-09-24, mostrar o horário do turno onde já se mostra o nome dele). */
export function taskShiftStart(shift: TaskShiftEnum, settings: TaskShiftSettingsModel): string {
  switch (shift) {
    case TaskShiftEnum.MORNING:
      return settings.morningStart;
    case TaskShiftEnum.AFTERNOON:
      return settings.afternoonStart;
    case TaskShiftEnum.EVENING:
      return settings.eveningStart;
  }
}

export function taskShiftEnd(shift: TaskShiftEnum, settings: TaskShiftSettingsModel): string {
  switch (shift) {
    case TaskShiftEnum.MORNING:
      return settings.morningEnd;
    case TaskShiftEnum.AFTERNOON:
      return settings.afternoonEnd;
    case TaskShiftEnum.EVENING:
      return settings.eveningEnd;
  }
}

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

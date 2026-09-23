import { I18nService } from '@core/i18n/i18n.service';

/** Espelha com.nimbusflow.tasks.model.TaskActivityCriticalCondition - só usada por atividades
 *  MULTIPLE_CHOICE (pedido do usuário 2026-09-23). Condição GLOBAL da atividade: SELECTED =
 *  respostas marcadas como críticas disparam alerta quando ESCOLHIDAS; NOT_SELECTED = disparam
 *  quando NÃO escolhidas (útil pra exigir uma opção obrigatória). SINGLE_CHOICE não usa isso -
 *  lá, marcar uma opção como crítica já significa "crítica quando selecionada" sem ambiguidade. */
export enum TaskActivityCriticalConditionEnum {
  SELECTED = 'SELECTED',
  NOT_SELECTED = 'NOT_SELECTED',
}

export const TASK_ACTIVITY_CRITICAL_CONDITION_VALUES: TaskActivityCriticalConditionEnum[] = [
  TaskActivityCriticalConditionEnum.SELECTED,
  TaskActivityCriticalConditionEnum.NOT_SELECTED,
];

export function taskActivityCriticalConditionLabel(
  condition: TaskActivityCriticalConditionEnum | string | null | undefined,
  i18n: I18nService,
): string {
  if (!condition) return '-';
  return i18n.tUi(`tasks.activityCriticalCondition.${condition}` as never);
}

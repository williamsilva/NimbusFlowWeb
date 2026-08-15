import { I18nService } from '@core/i18n/i18n.service';
import { StatusTone } from '@shared/features/status-badge/status-badge.component';

/** Espelha com.nimbusflow.tasks.model.TaskStatus do NimbusFlowServer. */
export enum TaskStatusEnum {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
}

export const TASK_STATUS_VALUES: TaskStatusEnum[] = [
  TaskStatusEnum.TODO,
  TaskStatusEnum.IN_PROGRESS,
  TaskStatusEnum.DONE,
  TaskStatusEnum.CANCELLED,
];

const TONE_MAP: Record<TaskStatusEnum, StatusTone> = {
  [TaskStatusEnum.TODO]: 'neutral',
  [TaskStatusEnum.IN_PROGRESS]: 'info',
  [TaskStatusEnum.DONE]: 'success',
  [TaskStatusEnum.CANCELLED]: 'danger',
};

export function taskStatusTone(status: TaskStatusEnum | string | null | undefined): StatusTone {
  return status ? TONE_MAP[status as TaskStatusEnum] ?? 'neutral' : 'neutral';
}

export function taskStatusLabel(
  status: TaskStatusEnum | string | null | undefined,
  i18n: I18nService,
): string {
  if (!status) return '-';
  return i18n.tUi(`tasks.status.${status}` as never);
}

/** TODO->IN_PROGRESS->DONE, nunca envolvendo CANCELLED - mesmo caminho que
 *  com.nimbusflow.tasks.core.TaskService.isForwardTransition aceita de PERM_TAREFA_EXECUTE.
 *  Devolve null quando não há próximo passo "pra frente" (DONE/CANCELLED, ou status desconhecido). */
export function nextForwardTaskStatus(status: TaskStatusEnum): TaskStatusEnum | null {
  if (status === TaskStatusEnum.TODO) return TaskStatusEnum.IN_PROGRESS;
  if (status === TaskStatusEnum.IN_PROGRESS) return TaskStatusEnum.DONE;
  return null;
}

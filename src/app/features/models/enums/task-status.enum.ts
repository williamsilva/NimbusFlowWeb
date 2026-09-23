import { I18nService } from '@core/i18n/i18n.service';
import { StatusTone } from '@shared/features/status-badge/status-badge.component';

/** Espelha com.nimbusflow.tasks.model.TaskStatus do NimbusFlowServer. NOT_DONE ("Não fez") é
 *  terminal, mesmo espírito de CANCELLED - só alcançado automaticamente (nunca manualmente) pelo
 *  job diário quando Task.autoMoveOverdueToNotDone=true e o prazo passou (pedido do usuário
 *  2026-09-23, ver TaskService#moveOverdueTasksToNotDone).
 *
 *  REVIEW (pedido do usuário 2026-09-23) - etapa OBRIGATÓRIA entre IN_PROGRESS e DONE, sem
 *  exceção nenhuma (nem pra quem tem TAREFA_MANAGE, ver TaskService#updateStatus no backend): não
 *  dá pra pular IN_PROGRESS->DONE direto. Só quem tem TAREFA_MANAGE aprova REVIEW->DONE - o
 *  próprio executor leva a tarefa até REVIEW e para por aí (ver nextForwardTaskStatus abaixo, que
 *  devolve REVIEW->DONE só como "próximo passo natural", a checagem de QUEM pode de fato clicar
 *  continua em TasksPermissionPolicy/canAdvance de cada tela). */
export enum TaskStatusEnum {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
  NOT_DONE = 'NOT_DONE',
}

export const TASK_STATUS_VALUES: TaskStatusEnum[] = [
  TaskStatusEnum.TODO,
  TaskStatusEnum.IN_PROGRESS,
  TaskStatusEnum.REVIEW,
  TaskStatusEnum.DONE,
  TaskStatusEnum.CANCELLED,
  TaskStatusEnum.NOT_DONE,
];

const TONE_MAP: Record<TaskStatusEnum, StatusTone> = {
  [TaskStatusEnum.TODO]: 'neutral',
  [TaskStatusEnum.IN_PROGRESS]: 'info',
  [TaskStatusEnum.REVIEW]: 'warn',
  [TaskStatusEnum.DONE]: 'success',
  [TaskStatusEnum.CANCELLED]: 'danger',
  [TaskStatusEnum.NOT_DONE]: 'warn',
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

/** TODO->IN_PROGRESS->REVIEW->DONE, nunca envolvendo CANCELLED/NOT_DONE - devolve o próximo passo
 *  "pra frente" na cadeia toda, independente de QUEM pode de fato executá-lo: REVIEW->DONE é
 *  aprovação, só quem tem TAREFA_MANAGE pode (ver TasksPermissionPolicy/canAdvance de cada tela,
 *  que checam isso À PARTE - esta função só descreve o grafo de status, não permissão). Devolve
 *  null quando não há próximo passo (DONE/CANCELLED/NOT_DONE, ou status desconhecido). */
export function nextForwardTaskStatus(status: TaskStatusEnum): TaskStatusEnum | null {
  if (status === TaskStatusEnum.TODO) return TaskStatusEnum.IN_PROGRESS;
  if (status === TaskStatusEnum.IN_PROGRESS) return TaskStatusEnum.REVIEW;
  if (status === TaskStatusEnum.REVIEW) return TaskStatusEnum.DONE;
  return null;
}

import { I18nService } from '@core/i18n/i18n.service';
import { UiKey } from '@core/i18n/ui-keys';

/**
 * com.nimbusflow.tasks lança ResponseStatusException puro (mesmo espírito de
 * com.nimbusflow.works, ver works-error.util.ts) - o corpo é o ProblemDetail padrão do Spring
 * (`{detail: "..."}`), sem o envelope userMessage/code do CardSync que ErrorMapperService
 * entende. Mapeamos as mensagens técnicas conhecidas de TaskService#updateStatus (achado real
 * 2026-09-24: o Kanban mostrava só "Não foi possível atualizar o status da tarefa", sem dizer
 * POR QUE - ex.: tentar mandar pra revisão com atividade pendente) pra algo que o usuário
 * entenda. Os textos de `match` precisam continuar batendo com o texto exato lançado no backend -
 * não é uma checagem estrutural, é substring puro.
 */
const KNOWN_DETAILS: { match: string; key: UiKey }[] = [
  {
    match: 'All activities must be answered before the task can be sent to REVIEW',
    key: 'tasks.action.requiresAllActivitiesAnswered',
  },
  { match: 'Task must be IN_PROGRESS before it can be sent to REVIEW', key: 'tasks.action.requiresInProgress' },
  { match: 'Task must be REVIEW before it can be marked DONE', key: 'tasks.action.requiresReview' },
  { match: 'Task depends on another task that is not yet DONE', key: 'tasks.action.dependencyNotDone' },
  {
    match: 'Cannot move task back to TODO - at least one activity has already been answered',
    key: 'tasks.action.cannotReopenAnswered',
  },
  { match: 'notDoneReason is required', key: 'tasks.action.notDoneReasonRequired' },
  { match: 'Task status does not accept edits', key: 'tasks.action.notEditable' },
];

function rawDetail(err: unknown): string | null {
  const detail = (err as { error?: { detail?: unknown } })?.error?.detail;
  return typeof detail === 'string' && detail.trim() ? detail : null;
}

export function translateTasksErrorDetail(err: unknown, i18n: I18nService): string | null {
  const detail = rawDetail(err);
  if (!detail) return null;

  const known = KNOWN_DETAILS.find((entry) => detail.includes(entry.match));
  return known ? i18n.tUi(known.key) : detail;
}

import { TaskActivityDataTypeEnum } from '@models/enums/task-activity-data-type.enum';
import { TaskActivityCriticalConditionEnum } from '@models/enums/task-activity-critical-condition.enum';

/** Uma resposta de atividade SINGLE_CHOICE/MULTIPLE_CHOICE (pedido do usuário 2026-09-23) -
 *  espelha com.nimbusflow.tasks.dto.response.TaskActivityOptionResponse. requiresPhoto/
 *  requiresDocument/requiresJustification só têm efeito em SINGLE_CHOICE. */
export interface TaskActivityOptionModel {
  id: string;
  label: string;
  critical: boolean;
  requiresPhoto: boolean;
  requiresDocument: boolean;
  requiresJustification: boolean;
}

export type TaskActivityOptionApiModel = TaskActivityOptionModel;

/** Campos de CONFIGURAÇÃO de uma atividade (pedido do usuário 2026-09-23) - separados dos campos
 *  de resposta/execução abaixo de propósito: é a partir DESTA interface (não de TaskActivityModel
 *  inteira) que TaskActivityInput é derivado via Omit, pra nunca "vazar" um campo de resposta
 *  (answerText/executedAt/etc.) pro payload de salvar a lista de atividades (TasksApiService#
 *  update), que só entende configuração. */
export interface TaskActivityConfigModel {
  id: string;
  position: number;
  description: string;
  dataCollectionType: TaskActivityDataTypeEnum;
  instructions: string | null;
  scaleMinValue: number | null;
  scaleMaxValue: number | null;
  scaleMinLabel: string | null;
  scaleMaxLabel: string | null;
  scaleCriticalMinValue: number | null;
  scaleCriticalMaxValue: number | null;
  dateCriticalMin: string | null;
  dateCriticalMax: string | null;
  numberCriticalMin: number | null;
  numberCriticalMax: number | null;
  multipleChoiceCriticalCondition: TaskActivityCriticalConditionEnum | null;
  options: TaskActivityOptionModel[];
}

/** Espelha com.nimbusflow.tasks.dto.response.TaskActivityResponse por completo (configuração +
 *  resposta de execução, pedido do usuário 2026-09-23). */
export interface TaskActivityModel extends TaskActivityConfigModel {
  /** Preenchida só depois de respondida via TasksApiService#answerActivity - nula/vazia enquanto
   *  dataCollectionType não corresponder. */
  answerText: string | null;
  answerDate: string | null;
  answerNumber: number | null;
  answerOptionId: string | null;
  answerOptionIds: string[];
  /** URLs assinadas (temporárias) - nunca guardar/cachear além da sessão de tela. */
  answerSignatureUrl: string | null;
  answerDocumentUrl: string | null;
  answerImageUrl: string | null;
  /** Calculado pelo backend na leitura, nunca enviado (pedido do usuário 2026-09-23: a
   *  justificativa obrigatória era redundante com "Relatar não conformidade ou observação",
   *  removida - isto virou só um aviso visual). Sempre false enquanto não respondida. */
  critical: boolean;
  observationReported: boolean;
  observationText: string | null;
  /** Nulo = ainda não respondida - ver AllTasksListComponent/TaskExecutionDialogComponent. */
  executedAt: string | null;
  executedById: string | null;
  executedByName: string | null;
}

export type TaskActivityApiModel = TaskActivityModel;

/** Payload de UMA resposta na tela de execução (pedido do usuário 2026-09-23) - espelha
 *  com.nimbusflow.tasks.dto.request.TaskActivityAnswerRequest. SIGNATURE/DOCUMENT/IMAGE mandam o
 *  arquivo à parte (multipart), não aqui - ver TasksApiService#answerActivity. */
export interface TaskActivityAnswerInput {
  answerText: string | null;
  answerDate: string | null;
  answerNumber: number | null;
  answerOptionId: string | null;
  answerOptionIds: string[] | null;
  observationReported: boolean;
  observationText: string | null;
}

/** Payload de uma opção nova/editada (pedido do usuário 2026-09-23) - sem id, a lista inteira é
 *  substituída a cada save da Tarefa (ver TaskService#saveActivities no backend). */
export type TaskActivityOptionInput = Omit<TaskActivityOptionModel, 'id'>;

/** Payload de uma atividade nova/editada - sem id/position (a ordem no array É a posição, ver
 *  TasksCreateDialogComponent#save). Derivado de TaskActivityConfigModel (não de
 *  TaskActivityModel inteira) - nunca inclui campo de resposta/execução algum. */
export type TaskActivityInput = Omit<TaskActivityConfigModel, 'id' | 'position' | 'options'> & {
  options: TaskActivityOptionInput[];
};

/** "Rascunho" de atividade usado só dentro do diálogo de criação/edição de Tarefa (pedido do
 *  usuário 2026-09-23) - clientId é uma identidade puramente local (nunca enviada ao backend),
 *  necessária pra reordenar/editar/remover uma atividade da lista ANTES dela ter um id de
 *  verdade (toda atividade nova só ganha id depois que a Tarefa inteira é salva). */
export interface TaskActivityDraft extends Omit<TaskActivityModel, 'id'> {
  id: string | null;
  clientId: string;
}

export function toActivityDraft(activity: TaskActivityModel): TaskActivityDraft {
  return { ...activity, clientId: crypto.randomUUID() };
}

/** Converte uma atividade de CONFIGURAÇÃO (Modelo de Tarefa, sem campos de resposta - pedido do
 *  usuário 2026-09-24) num TaskActivityDraft, preenchendo os campos de resposta/execução com
 *  valores em branco - TasksActivityConfigDialogComponent nunca os lê nem os altera (é só de
 *  configuração), então são inofensivos aqui. Usado tanto por TaskTemplateFormDialogComponent
 *  (editar as atividades do próprio Modelo) quanto por TasksCreateDialogComponent
 *  (#prefillFromTemplate - pré-carrega a lista ao criar uma Tarefa a partir de um Modelo). */
export function toActivityDraftFromConfig(config: TaskActivityConfigModel): TaskActivityDraft {
  return {
    ...config,
    clientId: crypto.randomUUID(),
    answerText: null,
    answerDate: null,
    answerNumber: null,
    answerOptionId: null,
    answerOptionIds: [],
    answerSignatureUrl: null,
    answerDocumentUrl: null,
    answerImageUrl: null,
    critical: false,
    observationReported: false,
    observationText: null,
    executedAt: null,
    executedById: null,
    executedByName: null,
  };
}

export function toActivityInput(draft: TaskActivityDraft): TaskActivityInput {
  return {
    description: draft.description,
    dataCollectionType: draft.dataCollectionType,
    instructions: draft.instructions,
    scaleMinValue: draft.scaleMinValue,
    scaleMaxValue: draft.scaleMaxValue,
    scaleMinLabel: draft.scaleMinLabel,
    scaleMaxLabel: draft.scaleMaxLabel,
    scaleCriticalMinValue: draft.scaleCriticalMinValue,
    scaleCriticalMaxValue: draft.scaleCriticalMaxValue,
    dateCriticalMin: draft.dateCriticalMin,
    dateCriticalMax: draft.dateCriticalMax,
    numberCriticalMin: draft.numberCriticalMin,
    numberCriticalMax: draft.numberCriticalMax,
    multipleChoiceCriticalCondition: draft.multipleChoiceCriticalCondition,
    options: draft.options.map((o) => ({
      label: o.label,
      critical: o.critical,
      requiresPhoto: o.requiresPhoto,
      requiresDocument: o.requiresDocument,
      requiresJustification: o.requiresJustification,
    })),
  };
}

export function mapTaskActivityApiModel(input: TaskActivityApiModel): TaskActivityModel {
  return { ...input, options: input.options ?? [], answerOptionIds: input.answerOptionIds ?? [] };
}

export function mapTaskActivityApiModels(items: TaskActivityApiModel[] | null | undefined): TaskActivityModel[] {
  return (items ?? []).map(mapTaskActivityApiModel);
}

/** Mesma regra de TaskService#allActivitiesAnswered no backend (exigida pra IN_PROGRESS->REVIEW,
 *  ver TaskService#updateStatus) - Tarefa sem nenhuma atividade configurada não é afetada
 *  (vacuosamente "true"). Usado pra bloquear o drop/avanço no cliente ANTES de tentar a chamada
 *  (achado real 2026-09-24: faltava esta checagem em canDropTask/canAdvance, então o Kanban
 *  deixava arrastar pra "Em revisão" com atividade pendente e o backend rejeitava com um erro
 *  confuso). */
export function allActivitiesAnswered(activities: TaskActivityModel[]): boolean {
  return activities.every((a) => a.executedAt != null);
}

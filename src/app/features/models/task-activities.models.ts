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

/** Espelha com.nimbusflow.tasks.dto.response.TaskActivityResponse. Campos específicos de cada
 *  dataCollectionType vêm nulos quando não se aplicam - ver TaskActivityDataTypeEnum. */
export interface TaskActivityModel {
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

export type TaskActivityApiModel = TaskActivityModel;

/** Payload de uma opção nova/editada (pedido do usuário 2026-09-23) - sem id, a lista inteira é
 *  substituída a cada save da Tarefa (ver TaskService#saveActivities no backend). */
export type TaskActivityOptionInput = Omit<TaskActivityOptionModel, 'id'>;

/** Payload de uma atividade nova/editada - sem id/position (a ordem no array É a posição, ver
 *  TasksCreateDialogComponent#save). */
export type TaskActivityInput = Omit<TaskActivityModel, 'id' | 'position' | 'options'> & {
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
  return { ...input, options: input.options ?? [] };
}

export function mapTaskActivityApiModels(items: TaskActivityApiModel[] | null | undefined): TaskActivityModel[] {
  return (items ?? []).map(mapTaskActivityApiModel);
}

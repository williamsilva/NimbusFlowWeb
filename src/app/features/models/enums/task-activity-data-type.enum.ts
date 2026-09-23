import { I18nService } from '@core/i18n/i18n.service';

/** Espelha com.nimbusflow.tasks.model.TaskActivityDataType do NimbusFlowServer (pedido do usuário
 *  2026-09-23, "Atividades da tarefa"). */
export enum TaskActivityDataTypeEnum {
  SIGNATURE = 'SIGNATURE',
  DATE = 'DATE',
  DOCUMENT = 'DOCUMENT',
  LINEAR_SCALE = 'LINEAR_SCALE',
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  IMAGE = 'IMAGE',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  NUMBER = 'NUMBER',
  TEXT = 'TEXT',
}

/** Mesma ordem alfabética do print de referência (dropdown "Tipo coleta"). */
export const TASK_ACTIVITY_DATA_TYPE_VALUES: TaskActivityDataTypeEnum[] = [
  TaskActivityDataTypeEnum.SIGNATURE,
  TaskActivityDataTypeEnum.DATE,
  TaskActivityDataTypeEnum.DOCUMENT,
  TaskActivityDataTypeEnum.LINEAR_SCALE,
  TaskActivityDataTypeEnum.SINGLE_CHOICE,
  TaskActivityDataTypeEnum.IMAGE,
  TaskActivityDataTypeEnum.MULTIPLE_CHOICE,
  TaskActivityDataTypeEnum.NUMBER,
  TaskActivityDataTypeEnum.TEXT,
];

export function taskActivityDataTypeLabel(
  type: TaskActivityDataTypeEnum | string | null | undefined,
  i18n: I18nService,
): string {
  if (!type) return '-';
  return i18n.tUi(`tasks.activityType.${type}` as never);
}

/** Ícone pi-* representativo de cada tipo (usado na lista de atividades, ao lado da descrição). */
export function taskActivityDataTypeIcon(type: TaskActivityDataTypeEnum): string {
  switch (type) {
    case TaskActivityDataTypeEnum.SIGNATURE:
      return 'pi pi-pencil';
    case TaskActivityDataTypeEnum.DATE:
      return 'pi pi-calendar';
    case TaskActivityDataTypeEnum.DOCUMENT:
      return 'pi pi-file';
    case TaskActivityDataTypeEnum.LINEAR_SCALE:
      return 'pi pi-sliders-h';
    case TaskActivityDataTypeEnum.SINGLE_CHOICE:
      return 'pi pi-check-circle';
    case TaskActivityDataTypeEnum.IMAGE:
      return 'pi pi-image';
    case TaskActivityDataTypeEnum.MULTIPLE_CHOICE:
      return 'pi pi-list';
    case TaskActivityDataTypeEnum.NUMBER:
      return 'pi pi-hashtag';
    case TaskActivityDataTypeEnum.TEXT:
      return 'pi pi-align-left';
  }
}

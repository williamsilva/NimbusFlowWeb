import { ActionPlanStatusEnum } from '@models/enums/action-plan-status.enum';
import { PeriodEnum } from '@models/enums/period.enum';

/**
 * Espelha com.nimbusflow.actionplans.dto.response.ActionPlanResponse do NimbusFlowServer -
 * metodologia 5W2H (what/why/where/how/howMuch, + targetDate/responsibleId como "when"/"who").
 * `workName` já vem resolvido pelo backend em lote (nunca resolvido aqui).
 */
export interface ActionPlanModel {
  id: string;
  title: string;
  what: string;
  why: string;
  where: string | null;
  how: string;
  howMuch: number | null;
  targetDate: string | null;
  responsibleId: string;
  responsibleName: string | null;
  status: ActionPlanStatusEnum;
  workId: string | null;
  workName: string | null;
  ticketId: string | null;
  createdById: string;
  createdByName: string | null;
  closedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export type ActionPlanApiModel = ActionPlanModel;

export interface ActionPlanUpsertInput {
  title: string;
  what: string;
  why: string;
  where: string | null;
  how: string;
  howMuch: number | null;
  targetDate: string | null;
  responsibleId: string;
  workId: string | null;
  /** Só considerado na criação (imutável depois) - ver ActionPlanRequest.ticketId no backend. */
  ticketId: string | null;
}

export type ActionPlansFiltersState = {
  title: string;
  status: string[] | null;
  workIds: string[] | null;
  createdAt: string | string[] | null;
  periodCreatedAt: PeriodEnum | null;
};

export function mapActionPlanApiModel(input: ActionPlanApiModel): ActionPlanModel {
  return { ...input };
}

export function mapActionPlanApiModels(
  items: ActionPlanApiModel[] | null | undefined,
): ActionPlanModel[] {
  return (items ?? []).map(mapActionPlanApiModel);
}

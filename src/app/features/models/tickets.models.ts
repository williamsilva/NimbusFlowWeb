import { TicketStatusEnum } from '@models/enums/ticket-status.enum';
import { TicketTypeEnum } from '@models/enums/ticket-type.enum';
import { TicketPriorityEnum } from '@models/enums/ticket-priority.enum';
import { PeriodEnum } from '@models/enums/period.enum';

/**
 * Espelha com.nimbusflow.tickets.dto.response.TicketResponse do NimbusFlowServer. `workId` é o
 * vínculo opcional com uma Frente de Serviço (Work) - nunca definido na criação, só depois via
 * "Abrir Frente de Serviço" (`TicketsApiService.linkWork`) - `workName` já vem resolvido pelo
 * backend em lote (nunca resolvido aqui). `attachmentUrl` é uma URL pré-assinada (expira) - não
 * deve ser cacheada/persistida, só usada pra abrir o anexo na hora.
 */
export interface TicketModel {
  id: string;
  title: string;
  description: string;
  type: TicketTypeEnum;
  priority: TicketPriorityEnum;
  status: TicketStatusEnum;
  workId: string | null;
  workName: string | null;
  reportedById: string;
  reportedByName: string | null;
  attachmentUrl: string | null;
  actionPlanId: string | null;
  resolutionNote: string | null;
  closedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export type TicketApiModel = TicketModel;

/** Sem workId de propósito - nunca definido na criação/edição, só via linkWork depois de criado. */
export interface TicketUpsertInput {
  title: string;
  description: string;
  type: TicketTypeEnum;
  priority: TicketPriorityEnum;
}

export interface TicketCreateInput extends TicketUpsertInput {
  attachment: File | null;
}

export interface TicketCloseInput {
  resolutionNote: string;
}

export interface TicketWorkLinkInput {
  workId: string;
}

export type TicketsFiltersState = {
  title: string;
  status: string[] | null;
  types: string[] | null;
  priorities: string[] | null;
  workIds: string[] | null;
  createdAt: string | string[] | null;
  periodCreatedAt: PeriodEnum | null;
};

export function mapTicketApiModel(input: TicketApiModel): TicketModel {
  return { ...input };
}

export function mapTicketApiModels(items: TicketApiModel[] | null | undefined): TicketModel[] {
  return (items ?? []).map(mapTicketApiModel);
}

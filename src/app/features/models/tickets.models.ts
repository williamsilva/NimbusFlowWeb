import { TicketStatusEnum } from '@models/enums/ticket-status.enum';
import { PeriodEnum } from '@models/enums/period.enum';

/**
 * Espelha com.nimbusflow.tickets.dto.response.TicketResponse do NimbusFlowServer. `workId` é o
 * vínculo opcional com uma Frente de Serviço (Work) - `workName` já vem resolvido pelo backend em
 * lote (nunca resolvido aqui). `attachmentUrl` é uma URL pré-assinada (expira) - não deve ser
 * cacheada/persistida, só usada pra abrir o anexo na hora.
 */
export interface TicketModel {
  id: string;
  title: string;
  description: string;
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

export interface TicketUpsertInput {
  title: string;
  description: string;
  workId: string | null;
}

export interface TicketCreateInput extends TicketUpsertInput {
  attachment: File | null;
}

export interface TicketCloseInput {
  resolutionNote: string;
}

export type TicketsFiltersState = {
  title: string;
  status: string[] | null;
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

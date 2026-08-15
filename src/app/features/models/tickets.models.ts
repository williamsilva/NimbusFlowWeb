import { TicketStatusEnum } from '@models/enums/ticket-status.enum';
import { TicketTypeEnum } from '@models/enums/ticket-type.enum';
import { TicketPriorityEnum } from '@models/enums/ticket-priority.enum';
import { TicketTargetTypeEnum } from '@models/enums/ticket-target-type.enum';
import { PeriodEnum } from '@models/enums/period.enum';

/** Uma evidência fotográfica anexada ao fechar o chamado - `url` é pré-assinada (expira), mesmo
 *  cuidado de `attachmentUrl` abaixo. */
export interface TicketClosePhotoModel {
  id: string;
  url: string;
}

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
  targetType: TicketTargetTypeEnum;
  targetUserId: string | null;
  /** Resolvido pelo backend (não em lote, mas cacheado por usuário - ver TicketService no
   *  NimbusFlowServer) - nunca resolvido de novo aqui. */
  targetUserName: string | null;
  targetDepartmentId: string | null;
  /** Resolvido pelo backend em lote - nunca resolvido de novo aqui. */
  targetDepartmentName: string | null;
  reportedById: string;
  reportedByName: string | null;
  attachmentUrl: string | null;
  actionPlanId: string | null;
  resolutionNote: string | null;
  closePhotos: TicketClosePhotoModel[];
  closedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export type TicketApiModel = TicketModel;

/** Sem workId de propósito - nunca definido na criação/edição, só via linkWork depois de criado.
 *  targetUserId/targetDepartmentId são mutuamente exclusivos, de acordo com targetType (validado
 *  no backend, ver TicketService#resolveTarget) - o diálogo sempre envia null pro que não se
 *  aplica. */
export interface TicketUpsertInput {
  title: string;
  description: string;
  type: TicketTypeEnum;
  priority: TicketPriorityEnum;
  targetType: TicketTargetTypeEnum;
  targetUserId: string | null;
  targetDepartmentId: string | null;
}

export interface TicketCreateInput extends TicketUpsertInput {
  attachment: File | null;
}

export interface TicketCloseInput {
  resolutionNote: string;
  photos: File[];
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

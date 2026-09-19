import { I18nService } from '@core/i18n/i18n.service';
import { StatusTone } from '@shared/features/status-badge/status-badge.component';

/** Espelha com.nimbusflow.tickets.model.TicketStatus do NimbusFlowServer. */
export enum TicketStatusEnum {
  OPEN = 'OPEN',
  /** Alguém já começou a trabalhar no chamado (ver TicketsListComponent#goStart) - tratado como
   *  "ainda ativo" nos mesmos lugares que hoje só aceitam OPEN. Pedido do usuário 2026-09-19. */
  IN_PROGRESS = 'IN_PROGRESS',
  CONVERTED_TO_ACTION_PLAN = 'CONVERTED_TO_ACTION_PLAN',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

export const TICKET_STATUS_VALUES: TicketStatusEnum[] = [
  TicketStatusEnum.OPEN,
  TicketStatusEnum.IN_PROGRESS,
  TicketStatusEnum.CONVERTED_TO_ACTION_PLAN,
  TicketStatusEnum.CLOSED,
  TicketStatusEnum.CANCELLED,
];

const TONE_MAP: Record<TicketStatusEnum, StatusTone> = {
  [TicketStatusEnum.OPEN]: 'info',
  [TicketStatusEnum.IN_PROGRESS]: 'warn',
  [TicketStatusEnum.CONVERTED_TO_ACTION_PLAN]: 'warn',
  [TicketStatusEnum.CLOSED]: 'success',
  [TicketStatusEnum.CANCELLED]: 'danger',
};

export function ticketStatusTone(status: TicketStatusEnum | string | null | undefined): StatusTone {
  return status ? TONE_MAP[status as TicketStatusEnum] ?? 'neutral' : 'neutral';
}

export function ticketStatusLabel(
  status: TicketStatusEnum | string | null | undefined,
  i18n: I18nService,
): string {
  if (!status) return '-';
  return i18n.tUi(`tickets.status.${status}` as never);
}

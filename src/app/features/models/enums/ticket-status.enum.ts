import { I18nService } from '@core/i18n/i18n.service';
import { StatusTone } from '@shared/features/status-badge/status-badge.component';

/** Espelha com.nimbusflow.tickets.model.TicketStatus do NimbusFlowServer. */
export enum TicketStatusEnum {
  OPEN = 'OPEN',
  CONVERTED_TO_ACTION_PLAN = 'CONVERTED_TO_ACTION_PLAN',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

export const TICKET_STATUS_VALUES: TicketStatusEnum[] = [
  TicketStatusEnum.OPEN,
  TicketStatusEnum.CONVERTED_TO_ACTION_PLAN,
  TicketStatusEnum.CLOSED,
  TicketStatusEnum.CANCELLED,
];

const TONE_MAP: Record<TicketStatusEnum, StatusTone> = {
  [TicketStatusEnum.OPEN]: 'info',
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

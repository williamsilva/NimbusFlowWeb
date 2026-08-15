import { I18nService } from '@core/i18n/i18n.service';
import { StatusTone } from '@shared/features/status-badge/status-badge.component';

/** Espelha com.nimbusflow.tickets.model.TicketPriority do NimbusFlowServer. */
export enum TicketPriorityEnum {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export const TICKET_PRIORITY_VALUES: TicketPriorityEnum[] = [
  TicketPriorityEnum.HIGH,
  TicketPriorityEnum.MEDIUM,
  TicketPriorityEnum.LOW,
];

const TONE_MAP: Record<TicketPriorityEnum, StatusTone> = {
  [TicketPriorityEnum.HIGH]: 'danger',
  [TicketPriorityEnum.MEDIUM]: 'warn',
  [TicketPriorityEnum.LOW]: 'info',
};

export function ticketPriorityTone(
  priority: TicketPriorityEnum | string | null | undefined,
): StatusTone {
  return priority ? TONE_MAP[priority as TicketPriorityEnum] ?? 'neutral' : 'neutral';
}

export function ticketPriorityLabel(
  priority: TicketPriorityEnum | string | null | undefined,
  i18n: I18nService,
): string {
  if (!priority) return '-';
  return i18n.tUi(`tickets.priority.${priority}` as never);
}

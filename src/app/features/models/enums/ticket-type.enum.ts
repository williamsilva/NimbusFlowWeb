import { I18nService } from '@core/i18n/i18n.service';

/** Espelha com.nimbusflow.tickets.model.TicketType do NimbusFlowServer. */
export enum TicketTypeEnum {
  TICKET = 'TICKET',
  ALERT = 'ALERT',
}

export const TICKET_TYPE_VALUES: TicketTypeEnum[] = [TicketTypeEnum.TICKET, TicketTypeEnum.ALERT];

export function ticketTypeLabel(
  type: TicketTypeEnum | string | null | undefined,
  i18n: I18nService,
): string {
  if (!type) return '-';
  return i18n.tUi(`tickets.type.${type}` as never);
}

import { I18nService } from '@core/i18n/i18n.service';

/** Espelha com.nimbusflow.tickets.model.TicketTargetType do NimbusFlowServer. */
export enum TicketTargetTypeEnum {
  USER = 'USER',
  DEPARTMENT = 'DEPARTMENT',
}

export const TICKET_TARGET_TYPE_VALUES: TicketTargetTypeEnum[] = [
  TicketTargetTypeEnum.USER,
  TicketTargetTypeEnum.DEPARTMENT,
];

export function ticketTargetTypeLabel(
  type: TicketTargetTypeEnum | string | null | undefined,
  i18n: I18nService,
): string {
  if (!type) return '-';
  return i18n.tUi(`tickets.targetType.${type}` as never);
}

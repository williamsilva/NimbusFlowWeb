/**
 * Rótulos livres (String, sem enum fixo no backend - ver EmailSenderService.Message.eventType) -
 * lista dos eventos conhecidos HOJE (AddendumNotificationService/PaymentNotificationService/
 * TicketNotificationService), só para popular o filtro multiSelect da tela de auditoria. Um evento
 * novo no backend precisa ser adicionado aqui manualmente (mesmo espírito do gotcha já documentado
 * pra ui-keys.ts) - sem isso, o valor ainda aparece na listagem (eventType é texto puro), só não
 * entra como opção do filtro.
 *
 * password_reset/first_password vêm do NimbusAuth (convite/reset de senha, ver
 * NimbusAuthAdminClient.searchEmailLogs/EmailLogService.search no NimbusFlowServer) - mesclados
 * na mesma listagem, não são eventos de negócio do NimbusFlowServer.
 */
export const EMAIL_LOG_EVENT_TYPE_VALUES: string[] = [
  'addendum_approved',
  'payment_released',
  'ticket_target',
  'ticket_closed',
  'password_reset',
  'first_password',
];

export function emailLogEventTypeI18nKey(eventType: string): string {
  return `emailLog.eventType.${eventType}`;
}

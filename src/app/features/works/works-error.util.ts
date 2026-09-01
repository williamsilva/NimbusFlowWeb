import { I18nService } from '@core/i18n/i18n.service';
import { UiKey } from '@core/i18n/ui-keys';

/**
 * com.nimbusflow.works lança ResponseStatusException puro (sem envelope customizado de erro do
 * CardSync) - o corpo é o ProblemDetail padrão do Spring (`{type, title, status, detail,
 * instance}`), então ErrorMapperService.message() (feito pro formato userMessage/code do
 * CardSync) não encontra nada útil aqui. Mapeamos as mensagens técnicas conhecidas (ver
 * AddendumApprovalService/PaymentOrderService/InstallmentService) pra algo que o usuário final
 * entenda. Os textos de `match` precisam continuar batendo com o texto exato lançado no backend
 * (ver PaymentOrderService/InstallmentService/MeasurementService, 2026-08-23) - não é uma
 * checagem estrutural, é substring puro.
 */
const KNOWN_DETAILS: Array<{ match: string; key: UiKey }> = [
  { match: 'Work status does not accept new addendums', key: 'addendums.action.requiresSubmittableWork' },
  { match: 'Addendum is not pending', key: 'addendums.action.alreadyDecided' },
  { match: 'Payment order is not measurement-approved', key: 'installments.action.statusChanged' },
  { match: 'Payment is not pending', key: 'installments.action.statusChanged' },
  { match: 'Payment order was not released yet', key: 'installments.action.requiresReleasedOrCancelled' },
  { match: 'paidAt cannot be in the future', key: 'payments.markPaidConfirm.futureDateError' },
  { match: 'Addendum is not approved', key: 'addendums.action.requiresApproved' },
  { match: 'Work status does not accept new measurements', key: 'measurements.action.requiresSubmittableWork' },
  { match: 'Measurement is not pending', key: 'measurements.action.alreadyDecided' },
  { match: 'Payment order exceeds work total amount', key: 'measurements.action.exceedsWorkTotal' },
  { match: 'the generated payment order was already sent for payment', key: 'measurements.action.paymentAlreadyPaid' },
  { match: 'an older measurement of this work is still pending decision', key: 'measurements.action.olderPending' },
  { match: 'All payment orders must belong to the same supplier', key: 'paymentOrders.action.differentSuppliers' },
  { match: 'must be RELEASED and not already sent', key: 'paymentOrders.action.notAllReleased' },
  { match: 'No PAYMENT_NOTIFICATION recipients configured', key: 'paymentOrders.action.noRecipients' },
  { match: 'One or more payment orders not found', key: 'paymentOrders.action.notFound' },
  { match: 'already included in another payment', key: 'paymentOrders.action.concurrentSend' },
];

function rawDetail(err: unknown): string | null {
  const detail = (err as { error?: { detail?: unknown } })?.error?.detail;
  return typeof detail === 'string' && detail.trim() ? detail : null;
}

export function translateWorksErrorDetail(err: unknown, i18n: I18nService): string | null {
  const detail = rawDetail(err);
  if (!detail) return null;

  const known = KNOWN_DETAILS.find((entry) => detail.includes(entry.match));
  return known ? i18n.tUi(known.key) : detail;
}

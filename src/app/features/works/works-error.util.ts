import { I18nService } from '@core/i18n/i18n.service';
import { UiKey } from '@core/i18n/ui-keys';

/**
 * com.nimbusflow.works lança ResponseStatusException puro (sem envelope customizado de erro do
 * CardSync) - o corpo é o ProblemDetail padrão do Spring (`{type, title, status, detail,
 * instance}`), então ErrorMapperService.message() (feito pro formato userMessage/code do
 * CardSync) não encontra nada útil aqui. Mapeamos as mensagens técnicas conhecidas (ver
 * AddendumApprovalService/InstallmentService) pra algo que o usuário final entenda.
 */
const KNOWN_DETAILS: Array<{ match: string; key: UiKey }> = [
  { match: 'Work status does not accept new addendums', key: 'addendums.action.requiresSubmittableWork' },
  { match: 'Addendum is not pending', key: 'addendums.action.alreadyDecided' },
  { match: 'Installment is not measurement-approved', key: 'installments.action.statusChanged' },
  { match: 'Installment is not released', key: 'installments.action.statusChanged' },
  { match: 'Work status does not accept new measurements', key: 'measurements.action.requiresSubmittableWork' },
  { match: 'Measurement is not pending', key: 'measurements.action.alreadyDecided' },
  { match: 'Payment order exceeds work total amount', key: 'measurements.action.exceedsWorkTotal' },
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

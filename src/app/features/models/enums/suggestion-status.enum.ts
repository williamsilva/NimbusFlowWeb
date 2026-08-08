import { I18nService } from '@core/i18n/i18n.service';
import { StatusTone } from '@shared/features/status-badge/status-badge.component';

/** Espelha com.nimbusflow.works.model.SuggestionStatus do NimbusFlowServer. */
export enum SuggestionStatusEnum {
  RECEIVED = 'RECEIVED',
  IN_ANALYSIS = 'IN_ANALYSIS',
  IMPLEMENTED = 'IMPLEMENTED',
  REJECTED = 'REJECTED',
}

export const SUGGESTION_STATUS_VALUES: SuggestionStatusEnum[] = [
  SuggestionStatusEnum.RECEIVED,
  SuggestionStatusEnum.IN_ANALYSIS,
  SuggestionStatusEnum.IMPLEMENTED,
  SuggestionStatusEnum.REJECTED,
];

const TONE_MAP: Record<SuggestionStatusEnum, StatusTone> = {
  [SuggestionStatusEnum.RECEIVED]: 'info',
  [SuggestionStatusEnum.IN_ANALYSIS]: 'warn',
  [SuggestionStatusEnum.IMPLEMENTED]: 'success',
  [SuggestionStatusEnum.REJECTED]: 'danger',
};

export function suggestionStatusTone(status: SuggestionStatusEnum | string | null | undefined): StatusTone {
  return status ? TONE_MAP[status as SuggestionStatusEnum] ?? 'neutral' : 'neutral';
}

export function suggestionStatusLabel(
  status: SuggestionStatusEnum | string | null | undefined,
  i18n: I18nService,
): string {
  if (!status) return '-';
  return i18n.tUi(`suggestions.status.${status}` as never);
}

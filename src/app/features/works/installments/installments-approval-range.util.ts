import { I18nService } from '@core/i18n/i18n.service';
import { ApprovalRangeModel } from '@models/addendums.models';
import { currencyRangeLabel } from '@features/list-base/cs-currency-range-filter.component';

/**
 * Formata as faixas de Configurações > Alçada que cobrem o valor de uma parcela (calculadas pelo
 * backend em InstallmentService.toResponse/toWithWorkResponse) - mesmo papel de
 * addendums-approval-range.util.ts, exibido na coluna "Alçada" da tela Pagamentos.
 */
export function formatApprovalRanges(
  i18n: I18nService,
  ranges: ApprovalRangeModel[] | null | undefined,
): string {
  if (!ranges?.length) {
    return i18n.tUi('installments.approvalRange.none');
  }

  return ranges
    .map((r) => currencyRangeLabel(i18n, r.minAmount, r.maxAmount))
    .filter((label): label is string => !!label)
    .join('; ');
}

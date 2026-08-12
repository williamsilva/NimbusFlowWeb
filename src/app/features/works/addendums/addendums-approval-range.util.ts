import { I18nService } from '@core/i18n/i18n.service';
import { ApprovalRangeModel } from '@models/addendums.models';
import { currencyRangeLabel } from '@features/list-base/cs-currency-range-filter.component';

/**
 * Formata as faixas de Configurações > Alçada que cobrem o valor de um aditivo (calculadas pelo
 * backend em AddendumApprovalService.toResponse/toWithWorkResponse). Substitui a antiga coluna
 * "Alçada 1/2" (ApprovalTier/requiredTier), que ficava congelada no momento da solicitação e
 * desalinhada da configuração real assim que ela passou a existir (tela Configurações > Alçada).
 */
export function formatApprovalRanges(
  i18n: I18nService,
  ranges: ApprovalRangeModel[] | null | undefined,
): string {
  if (!ranges?.length) {
    return i18n.tUi('addendums.approvalRange.none');
  }

  return ranges
    .map((r) => currencyRangeLabel(i18n, r.minAmount, r.maxAmount))
    .filter((label): label is string => !!label)
    .join('; ');
}

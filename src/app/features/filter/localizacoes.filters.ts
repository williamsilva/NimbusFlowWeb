import { PeriodEnum } from '@models/enums/period.enum';

/** Espelha os campos aceitos por LocalizacaoService#filterLocalizacoes (NimbusFlowServer). */
export interface LocalizacoesAdvancedFilters {
  descricao?: string;

  status?: string[] | null;

  createdAt?: string | string[];
  periodCreatedAt?: PeriodEnum;
}

import { PeriodEnum } from '@models/enums/period.enum';

/** Espelha os campos aceitos por HistoricoLocalizacaoService#filterHistoricos (NimbusFlowServer). */
export interface HistoricoLocalizacaoAdvancedFilters {
  equipamento?: string;
  localizacao?: string;

  status?: string[] | null;

  dataInicial?: string | string[];
  periodDataInicial?: PeriodEnum;
}

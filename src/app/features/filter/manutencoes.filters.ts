import { PeriodEnum } from '@models/enums/period.enum';

/** Espelha os campos aceitos por ManutencaoService#filterManutencoes (NimbusFlowServer). */
export interface ManutencoesAdvancedFilters {
  equipamento?: string;
  autorizadaNome?: string;

  status?: string[] | null;
  tipoManutencao?: string[] | null;

  precoDe?: number;
  precoAte?: number;

  dataEnvio?: string | string[];
  periodDataEnvio?: PeriodEnum;
}

import { PeriodEnum } from '@models/enums/period.enum';

/** Espelha os campos aceitos por AgendaManutencaoService#filterAgendas (NimbusFlowServer). */
export interface AgendaManutencaoAdvancedFilters {
  equipamento?: string;

  status?: string[] | null;
  frequencia?: string[] | null;
  tipoManutencao?: string[] | null;
  perfilNotificacao?: string[] | null;

  proximaManutencao?: string | string[];
  periodProximaManutencao?: PeriodEnum;
}

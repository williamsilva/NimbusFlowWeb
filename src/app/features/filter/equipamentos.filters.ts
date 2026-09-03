import { PeriodEnum } from '@models/enums/period.enum';

/** Espelha os campos aceitos por EquipamentoService#filterEquipamentos (NimbusFlowServer). */
export interface EquipamentosAdvancedFilters {
  descricao?: string;
  fornecedorNome?: string;

  status?: string[] | null;

  precoDe?: number;
  precoAte?: number;

  dataCompra?: string | string[];
  periodDataCompra?: PeriodEnum;
}

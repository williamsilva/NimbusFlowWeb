import { PeriodEnum } from '@models/enums/period.enum';

export interface GroupsAdvancedFilters {
  name?: string;
  description?: string;

  createdAt?: string | string[];
  periodCreatedAt?: PeriodEnum;

  createdBy?: string[] | null;

  /** Sempre fixado em APP_KEY pelo GroupsApiService — não é um filtro escolhido pelo usuário. */
  appKey?: string;
}

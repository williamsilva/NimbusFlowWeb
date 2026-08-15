import { PeriodEnum } from '@models/enums/period.enum';

export interface ActionPlansAdvancedFilters {
  title?: string;

  status?: string[] | null;
  workIds?: string[] | null;

  createdAt?: string | string[];
  periodCreatedAt?: PeriodEnum;
}

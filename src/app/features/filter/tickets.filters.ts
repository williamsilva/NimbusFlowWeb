import { PeriodEnum } from '@models/enums/period.enum';

export interface TicketsAdvancedFilters {
  title?: string;

  status?: string[] | null;
  types?: string[] | null;
  priorities?: string[] | null;
  workIds?: string[] | null;

  createdAt?: string | string[];
  periodCreatedAt?: PeriodEnum;
}

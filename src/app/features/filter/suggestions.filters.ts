import { PeriodEnum } from '@models/enums/period.enum';

export interface SuggestionsAdvancedFilters {
  description?: string;

  status?: string[] | null;

  createdAt?: string | string[];
  periodCreatedAt?: PeriodEnum;
}

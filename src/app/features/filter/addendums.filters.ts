import { PeriodEnum } from '@models/enums/period.enum';

export interface AddendumsAdvancedFilters {
  workName?: string;
  justification?: string;

  status?: string[] | null;
  requiredTier?: string[] | null;

  amountFrom?: number;
  amountTo?: number;

  createdAt?: string | string[];
  periodCreatedAt?: PeriodEnum;
}

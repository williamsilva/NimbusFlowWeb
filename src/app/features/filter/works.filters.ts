import { PeriodEnum } from '@models/enums/period.enum';

export interface WorksAdvancedFilters {
  name?: string;

  supplierId?: string[] | null;
  projectId?: string[] | null;
  status?: string[] | null;

  startDate?: string | string[];
  periodStartDate?: PeriodEnum;

  expectedEndDate?: string | string[];
  periodExpectedEndDate?: PeriodEnum;

  totalAmountFrom?: number;
  totalAmountTo?: number;
}

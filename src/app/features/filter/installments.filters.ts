import { PeriodEnum } from '@models/enums/period.enum';

export interface InstallmentsAdvancedFilters {
  workName?: string;

  status?: string[] | null;

  amountFrom?: number;
  amountTo?: number;

  dueDate?: string | string[];
  periodDueDate?: PeriodEnum;
}

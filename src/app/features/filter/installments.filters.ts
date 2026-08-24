import { PeriodEnum } from '@models/enums/period.enum';

export interface InstallmentsAdvancedFilters {
  supplierId?: string[] | null;

  workName?: string;

  status?: string[] | null;

  amountFrom?: number;
  amountTo?: number;

  dueDate?: string | string[];
  periodDueDate?: PeriodEnum;
}

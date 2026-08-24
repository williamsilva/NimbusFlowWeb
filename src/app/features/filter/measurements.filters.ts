import { PeriodEnum } from '@models/enums/period.enum';

export interface MeasurementsAdvancedFilters {
  supplierId?: string[] | null;

  workName?: string;
  description?: string;

  status?: string[] | null;

  amountToPayFrom?: number;
  amountToPayTo?: number;

  dueDate?: string | string[];
  periodDueDate?: PeriodEnum;
}

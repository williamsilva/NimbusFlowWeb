import { PeriodEnum } from '@models/enums/period.enum';

export interface MeasurementsAdvancedFilters {
  workName?: string;
  description?: string;

  status?: string[] | null;

  amountToPayFrom?: number;
  amountToPayTo?: number;

  dueDate?: string | string[];
  periodDueDate?: PeriodEnum;
}

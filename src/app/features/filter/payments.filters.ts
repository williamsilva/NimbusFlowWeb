import { PeriodEnum } from '@models/enums/period.enum';

export interface PaymentsAdvancedFilters {
  supplierName?: string;

  status?: string[] | null;

  amountFrom?: number;
  amountTo?: number;

  sentAt?: string | string[];
  periodSentAt?: PeriodEnum;
}

import { PeriodEnum } from '@models/enums/period.enum';

export interface EmailLogAdvancedFilters {
  recipients?: string;
  subject?: string;

  status?: string[] | null;
  eventType?: string[] | null;

  sentAt?: string | string[];
  periodSentAt?: PeriodEnum;
}

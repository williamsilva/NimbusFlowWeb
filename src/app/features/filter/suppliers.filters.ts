import { PeriodEnum } from '@models/enums/period.enum';

export interface SuppliersAdvancedFilters {
  companyName?: string;
  tradeName?: string;
  taxId?: string;
  email?: string;
  phone?: string;

  active?: string[] | null;

  createdAt?: string | string[];
  periodCreatedAt?: PeriodEnum;
}

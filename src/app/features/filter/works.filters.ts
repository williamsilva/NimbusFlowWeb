export interface WorksAdvancedFilters {
  name?: string;

  supplierId?: string[] | null;
  status?: string[] | null;

  startDateFrom?: string;
  startDateTo?: string;

  expectedEndDateFrom?: string;
  expectedEndDateTo?: string;

  totalAmountFrom?: number;
  totalAmountTo?: number;
}

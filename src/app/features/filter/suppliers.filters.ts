export interface SuppliersAdvancedFilters {
  companyName?: string;
  tradeName?: string;
  taxId?: string;
  email?: string;
  phone?: string;

  active?: string[] | null;

  createdAtFrom?: string;
  createdAtTo?: string;
}

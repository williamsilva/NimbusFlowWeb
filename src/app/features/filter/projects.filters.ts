export interface ProjectsAdvancedFilters {
  name?: string;
  status?: string[] | null;

  serviceFrontsCountFrom?: number;
  serviceFrontsCountTo?: number;

  totalContractedAmountFrom?: number;
  totalContractedAmountTo?: number;

  totalPaidAmountFrom?: number;
  totalPaidAmountTo?: number;

  remainingAmountFrom?: number;
  remainingAmountTo?: number;

  progressPercentageFrom?: number;
  progressPercentageTo?: number;
}

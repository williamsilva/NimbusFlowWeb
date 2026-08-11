import { WorkStatusEnum } from '@models/enums/work-status.enum';

/**
 * Espelha com.nimbusflow.works.dto.response.DashboardSummaryResponse do NimbusFlowServer.
 * worksByStatus vem do backend como Map<WorkStatus, Long> (serializado como objeto JSON) -
 * por isso o tipo `Partial<Record<...>>` em vez de garantir todas as chaves presentes.
 */
export interface DashboardSummaryModel {
  totalContracted: number;
  totalPaid: number;
  totalBalance: number;
  totalInitialAmount: number;
  addendumIncreasePercentage: number;
  worksByStatus: Partial<Record<WorkStatusEnum, number>>;
  overdueWorksCount: number;
  pendingAddendumsCount: number;
  pendingMeasurementsCount: number;
}

export interface StatusAmountModel {
  status: WorkStatusEnum;
  amount: number;
}

export interface WeeklyDisbursementModel {
  weekStart: string;
  amount: number;
}

export interface WorkAmountModel {
  workId: string;
  workName: string;
  amount: number;
}

/** Espelha com.nimbusflow.works.dto.response.DashboardAnalyticsResponse. */
export interface DashboardAnalyticsModel {
  valueByStatus: StatusAmountModel[];
  weeklyDisbursement: WeeklyDisbursementModel[];
  topWorks: WorkAmountModel[];
  othersAmount: number;
  othersCount: number;
}

/** Filtro opcional da página inicial - espelha com.nimbusflow.works.dto.request.DashboardFilterRequest. */
export interface DashboardFilterInput {
  projectIds?: string[] | null;
  supplierIds?: string[] | null;
  workIds?: string[] | null;
  totalAmountFrom?: number | null;
  totalAmountTo?: number | null;
}

export function mapDashboardSummaryApiModel(input: DashboardSummaryModel): DashboardSummaryModel {
  return { ...input, worksByStatus: input.worksByStatus ?? {} };
}

export function mapDashboardAnalyticsApiModel(
  input: DashboardAnalyticsModel,
): DashboardAnalyticsModel {
  return {
    ...input,
    valueByStatus: input.valueByStatus ?? [],
    weeklyDisbursement: input.weeklyDisbursement ?? [],
    topWorks: input.topWorks ?? [],
  };
}

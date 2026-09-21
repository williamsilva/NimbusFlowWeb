import { WorkStatusEnum } from '@models/enums/work-status.enum';
import { TicketPriorityEnum } from '@models/enums/ticket-priority.enum';
import { ActionPlanStatusEnum } from '@models/enums/action-plan-status.enum';

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

/** Espelha com.nimbusflow.works.dto.response.EmployeeTaskRankingResponse - ranking de
 *  funcionários por tarefas concluídas (com.nimbusflow.tasks). employeeName já vem resolvido
 *  pelo backend via UserDirectoryService (nunca resolvido aqui). Backend devolve a lista
 *  completa, sem cortar top-N - o corte "top N + Demais" é feito no componente, igual ao
 *  topWorks/othersAmount acima. */
export interface EmployeeTaskRankingModel {
  employeeId: string;
  employeeName: string;
  completedTasksCount: number;
}

/** Espelha com.nimbusflow.works.dto.response.TeamTaskProgressResponse - métricas agregadas de
 *  tarefas concluídas, sem quebrar por funcionário nominalmente. Disponível pra qualquer um com
 *  TAREFA_CONSULT ou TAREFA_EXECUTE, diferente do ranking nominal acima (DASHBOARD_RANKING_CONSULT,
 *  só ADMINISTRADOR - pedido do usuário 2026-09-20, preocupação legal/trabalhista). */
export interface TeamTaskProgressModel {
  teamCompletedTasksCount: number;
  myCompletedTasksCount: number;
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

export function mapEmployeeTaskRankingApiModels(
  items: EmployeeTaskRankingModel[] | null | undefined,
): EmployeeTaskRankingModel[] {
  return items ?? [];
}

export function mapTeamTaskProgressApiModel(
  input: TeamTaskProgressModel | null | undefined,
): TeamTaskProgressModel | null {
  return input ?? null;
}

/** Espelha com.nimbusflow.works.dto.response.WorkDurationAnalysisResponse - "Duração média de
 *  execução"/"Atraso médio" (dashboard de Obras). avgDelayDays pode ser negativo (concluída antes
 *  do previsto). */
export interface WorkDurationAnalysisModel {
  avgExecutionDays: number;
  avgDelayDays: number;
  completedWorksCount: number;
}

/** Espelha com.nimbusflow.works.dto.response.TaskDurationAnalysisResponse - "Tempo médio de
 *  conclusão" (dashboard de Tarefas), agregado, sem quebrar por assigneeId (mesma preocupação
 *  legal/trabalhista já aplicada ao ranking nominal - ver EmployeeTaskRankingModel). */
export interface TaskDurationAnalysisModel {
  avgCompletionDays: number;
  completedTasksCount: number;
}

/** Espelha com.nimbusflow.tickets.dto.response.TicketPriorityDurationResponse. */
export interface TicketPriorityDurationModel {
  priority: TicketPriorityEnum;
  avgResolutionDays: number;
  count: number;
}

/** Espelha com.nimbusflow.tickets.dto.response.TicketDashboardSummaryResponse - "Tempo médio de
 *  resolução" (dashboard de Chamados), só chamados terminais (CLOSED/CANCELLED). */
export interface TicketDashboardSummaryModel {
  avgResolutionDays: number;
  resolvedTicketsCount: number;
  byPriority: TicketPriorityDurationModel[];
}

/** Espelha com.nimbusflow.actionplans.dto.response.ActionPlanDashboardSummaryResponse - contagem
 *  por status + "Tempo médio de execução" (dashboard de Planos de Ação, só COMPLETED). byStatus
 *  vem do backend como Map<ActionPlanStatus, Long> (serializado como objeto JSON). */
export interface ActionPlanDashboardSummaryModel {
  byStatus: Partial<Record<ActionPlanStatusEnum, number>>;
  avgExecutionDays: number;
  completedCount: number;
}

export function mapWorkDurationAnalysisApiModel(
  input: WorkDurationAnalysisModel | null | undefined,
): WorkDurationAnalysisModel | null {
  return input ?? null;
}

export function mapTaskDurationAnalysisApiModel(
  input: TaskDurationAnalysisModel | null | undefined,
): TaskDurationAnalysisModel | null {
  return input ?? null;
}

export function mapTicketDashboardSummaryApiModel(
  input: TicketDashboardSummaryModel | null | undefined,
): TicketDashboardSummaryModel | null {
  return input ? { ...input, byPriority: input.byPriority ?? [] } : null;
}

export function mapActionPlanDashboardSummaryApiModel(
  input: ActionPlanDashboardSummaryModel | null | undefined,
): ActionPlanDashboardSummaryModel | null {
  return input ? { ...input, byStatus: input.byStatus ?? {} } : null;
}

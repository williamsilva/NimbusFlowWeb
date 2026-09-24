/**
 * Espelha com.nimbusflow.tasks.dto.response.{TaskActivityHistoryPointResponse,
 * TaskActivityHistoryResponse} do NimbusFlowServer - histórico de Atividades do tipo NÚMERO
 * (ex.: Cloro/Alcalinidade/pH) respondidas em execuções de Tarefa, pedido do usuário 2026-09-24
 * (dashboard de Tarefas > Parâmetros). locationId vem cru (não o nome) - resolvido localmente
 * pelo TaskLocationsFacade já carregado pro próprio seletor de filtro.
 */
export interface TaskActivityHistoryPointModel {
  executedAt: string;
  value: number;
  taskNumero: number | null;
  locationId: string | null;
}

export interface TaskActivityHistoryModel {
  points: TaskActivityHistoryPointModel[];
  answeredCount: number;
  pendingCount: number;
}

export function mapTaskActivityHistoryApiModel(
  input: TaskActivityHistoryModel | null | undefined,
): TaskActivityHistoryModel {
  return { points: input?.points ?? [], answeredCount: input?.answeredCount ?? 0, pendingCount: input?.pendingCount ?? 0 };
}

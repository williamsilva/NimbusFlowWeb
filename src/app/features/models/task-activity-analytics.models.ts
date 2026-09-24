/**
 * Espelha com.nimbusflow.tasks.dto.response.{TaskActivityHistoryPointResponse,
 * TaskParameterHistoryResponse} do NimbusFlowServer - histórico de Atividades do tipo NÚMERO
 * (ex.: Cloro/Alcalinidade/pH) respondidas em execuções de Tarefa, pedido do usuário 2026-09-24
 * (dashboard de Tarefas > Parâmetros). Todos os parâmetros vêm juntos, um item por nome (pedido do
 * usuário 2026-09-24: "visualização completa ... todos juntos"). locationId vem cru (não o nome) -
 * resolvido localmente pelo TaskLocationsFacade já carregado pro próprio seletor de filtro.
 * inConformity reaproveita a mesma fórmula de "crítico" já usada na tela de execução.
 */
export interface TaskActivityHistoryPointModel {
  executedAt: string;
  value: number;
  taskNumero: number | null;
  locationId: string | null;
  inConformity: boolean;
}

export interface TaskParameterHistoryModel {
  name: string;
  points: TaskActivityHistoryPointModel[];
  answeredCount: number;
  pendingCount: number;
}

export function mapTaskParameterHistoryApiModels(
  items: TaskParameterHistoryModel[] | null | undefined,
): TaskParameterHistoryModel[] {
  return (items ?? []).map((item) => ({ ...item, points: item.points ?? [] }));
}

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { map } from 'rxjs/operators';

import { API } from '@core/api/api.config';
import {
  EmployeeTaskRankingModel,
  TaskDurationAnalysisModel,
  TaskStatusCountsModel,
  TeamTaskProgressModel,
  mapEmployeeTaskRankingApiModels,
  mapTaskDurationAnalysisApiModel,
  mapTaskStatusCountsApiModel,
  mapTeamTaskProgressApiModel,
} from '@models/dashboard.models';

/** Dashboard de Tarefas - endpoints ainda hospedados no DashboardController existente
 *  (com.nimbusflow.works, mesmo baseUrl de WorksDashboardApiService) - decisão explícita de não
 *  mover/extrair esses 2 métodos pra um controller novo só por causa da separação de telas no
 *  frontend (ver javadoc de DashboardService no backend). */
@Injectable({ providedIn: 'root' })
export class TasksDashboardApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API.bff}/v1/dashboard`;

  /** Ranking NOMINAL de funcionários por tarefas concluídas - requer DASHBOARD_RANKING_CONSULT
   *  (só ADMINISTRADOR). */
  employeeTaskRanking() {
    return this.http
      .get<EmployeeTaskRankingModel[]>(`${this.baseUrl}/employee-task-ranking`)
      .pipe(map(mapEmployeeTaskRankingApiModels));
  }

  /** Métricas agregadas (sem nome) de tarefas concluídas - aberto a TAREFA_CONSULT/EXECUTE. */
  teamTaskProgress() {
    return this.http
      .get<TeamTaskProgressModel>(`${this.baseUrl}/team-task-progress`)
      .pipe(map(mapTeamTaskProgressApiModel));
  }

  /** "Tempo médio de conclusão" - agregado, sem quebrar por assigneeId. */
  taskDurationAnalysis() {
    return this.http
      .get<TaskDurationAnalysisModel>(`${this.baseUrl}/task-duration-analysis`)
      .pipe(map(mapTaskDurationAnalysisApiModel));
  }

  /** Contagem de Tarefas por status - aberto a TAREFA_CONSULT/EXECUTE (pedido do usuário
   *  2026-09-24). */
  taskStatusCounts() {
    return this.http
      .get<TaskStatusCountsModel>(`${this.baseUrl}/task-status-counts`)
      .pipe(map(mapTaskStatusCountsApiModel));
  }
}

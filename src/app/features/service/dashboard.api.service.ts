import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { map } from 'rxjs/operators';

import { API } from '@core/api/api.config';
import {
  DashboardAnalyticsModel,
  DashboardFilterInput,
  DashboardSummaryModel,
  EmployeeTaskRankingModel,
  TeamTaskProgressModel,
  mapDashboardAnalyticsApiModel,
  mapDashboardSummaryApiModel,
  mapEmployeeTaskRankingApiModels,
  mapTeamTaskProgressApiModel,
} from '@models/dashboard.models';

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API.bff}/v1/dashboard`;

  summary(filter?: DashboardFilterInput) {
    return this.http
      .get<DashboardSummaryModel>(`${this.baseUrl}/summary`, { params: this.buildParams(filter) })
      .pipe(map(mapDashboardSummaryApiModel));
  }

  analytics(filter?: DashboardFilterInput) {
    return this.http
      .get<DashboardAnalyticsModel>(`${this.baseUrl}/analytics`, { params: this.buildParams(filter) })
      .pipe(map(mapDashboardAnalyticsApiModel));
  }

  /** Ranking NOMINAL de funcionários por tarefas concluídas - requer DASHBOARD_RANKING_CONSULT
   *  (só ADMINISTRADOR). Sem filtro (não tem correspondência com DashboardFilterRequest hoje, já
   *  que Task não tem workId/projectId próprio). */
  employeeTaskRanking() {
    return this.http
      .get<EmployeeTaskRankingModel[]>(`${this.baseUrl}/employee-task-ranking`)
      .pipe(map(mapEmployeeTaskRankingApiModels));
  }

  /** Métricas agregadas (sem nome) de tarefas concluídas - aberto a TAREFA_CONSULT/EXECUTE, pra
   *  colaboradores comuns que não têm DASHBOARD_RANKING_CONSULT. */
  teamTaskProgress() {
    return this.http
      .get<TeamTaskProgressModel>(`${this.baseUrl}/team-task-progress`)
      .pipe(map(mapTeamTaskProgressApiModel));
  }

  private buildParams(filter?: DashboardFilterInput): HttpParams {
    let params = new HttpParams();
    if (!filter) return params;

    for (const id of filter.projectIds ?? []) {
      params = params.append('projectId', id);
    }
    for (const id of filter.supplierIds ?? []) {
      params = params.append('supplierId', id);
    }
    for (const id of filter.workIds ?? []) {
      params = params.append('workId', id);
    }
    if (filter.totalAmountFrom != null) {
      params = params.set('totalAmountFrom', String(filter.totalAmountFrom));
    }
    if (filter.totalAmountTo != null) {
      params = params.set('totalAmountTo', String(filter.totalAmountTo));
    }

    return params;
  }
}

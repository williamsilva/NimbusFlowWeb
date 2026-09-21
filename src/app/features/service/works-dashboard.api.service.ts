import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { map } from 'rxjs/operators';

import { API } from '@core/api/api.config';
import {
  DashboardAnalyticsModel,
  DashboardFilterInput,
  DashboardSummaryModel,
  WorkDurationAnalysisModel,
  mapDashboardAnalyticsApiModel,
  mapDashboardSummaryApiModel,
  mapWorkDurationAnalysisApiModel,
} from '@models/dashboard.models';

/** Dashboard de Obras - renomeado de DashboardApiService (pedido do usuário 2026-09-21, separação
 *  dos dashboards) - employeeTaskRanking()/teamTaskProgress() mudaram de dono, ver
 *  TasksDashboardApiService. */
@Injectable({ providedIn: 'root' })
export class WorksDashboardApiService {
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

  /** "Duração média de execução"/"Atraso médio" - só obras COMPLETED com actualEndDate
   *  preenchido, sem filtro (mesmo motivo de employeeTaskRanking no dashboard de Tarefas: não tem
   *  correspondência direta com DashboardFilterRequest). */
  workDurationAnalysis() {
    return this.http
      .get<WorkDurationAnalysisModel>(`${this.baseUrl}/work-duration-analysis`)
      .pipe(map(mapWorkDurationAnalysisApiModel));
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

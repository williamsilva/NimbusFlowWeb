import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { map } from 'rxjs/operators';

import { API } from '@core/api/api.config';
import {
  DashboardAnalyticsModel,
  DashboardFilterInput,
  DashboardSummaryModel,
  mapDashboardAnalyticsApiModel,
  mapDashboardSummaryApiModel,
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

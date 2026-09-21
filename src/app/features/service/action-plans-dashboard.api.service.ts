import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { map } from 'rxjs/operators';

import { API } from '@core/api/api.config';
import { ActionPlanDashboardSummaryModel, mapActionPlanDashboardSummaryApiModel } from '@models/dashboard.models';

/** Dashboard de Planos de Ação (pedido do usuário 2026-09-21) - ver
 *  com.nimbusflow.actionplans.core.ActionPlansDashboardService no backend. */
@Injectable({ providedIn: 'root' })
export class ActionPlansDashboardApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API.bff}/v1/action-plans/dashboard`;

  summary() {
    return this.http
      .get<ActionPlanDashboardSummaryModel>(`${this.baseUrl}/summary`)
      .pipe(map(mapActionPlanDashboardSummaryApiModel));
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { map } from 'rxjs/operators';

import { API } from '@core/api/api.config';
import { TicketDashboardSummaryModel, mapTicketDashboardSummaryApiModel } from '@models/dashboard.models';

/** Dashboard de Chamados (pedido do usuário 2026-09-21) - ver
 *  com.nimbusflow.tickets.core.TicketsDashboardService no backend. */
@Injectable({ providedIn: 'root' })
export class TicketsDashboardApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API.bff}/v1/tickets/dashboard`;

  summary() {
    return this.http
      .get<TicketDashboardSummaryModel>(`${this.baseUrl}/summary`)
      .pipe(map(mapTicketDashboardSummaryApiModel));
  }
}

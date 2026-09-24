import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { map } from 'rxjs/operators';

import { API } from '@core/api/api.config';
import { TaskParameterHistoryModel, mapTaskParameterHistoryApiModels } from '@models/task-activity-analytics.models';

/** Dashboard de Tarefas > Parâmetros (pedido do usuário 2026-09-24) - histórico de TODAS as
 *  Atividades do tipo NÚMERO respondidas em execuções de Tarefa, juntas. */
@Injectable({ providedIn: 'root' })
export class TaskActivityAnalyticsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API.bff}/v1/tasks/activity-analytics`;

  /** locationId nulo/omitido = todos os Locais (sem filtro). */
  historyAll(locationId: string | null) {
    let params = new HttpParams();
    if (locationId) {
      params = params.set('locationId', locationId);
    }

    return this.http
      .get<TaskParameterHistoryModel[]>(`${this.baseUrl}/history-all`, { params })
      .pipe(map(mapTaskParameterHistoryApiModels));
  }
}

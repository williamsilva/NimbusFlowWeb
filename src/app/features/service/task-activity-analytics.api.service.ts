import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { map } from 'rxjs/operators';

import { API } from '@core/api/api.config';
import { TaskActivityHistoryModel, mapTaskActivityHistoryApiModel } from '@models/task-activity-analytics.models';

/** Dashboard de Tarefas > Parâmetros (pedido do usuário 2026-09-24) - histórico de Atividades do
 *  tipo NÚMERO respondidas em execuções de Tarefa. */
@Injectable({ providedIn: 'root' })
export class TaskActivityAnalyticsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API.bff}/v1/tasks/activity-analytics`;

  /** Nome (description) de toda Atividade do tipo NÚMERO já usada em algum Modelo/Tarefa -
   *  alimenta o seletor de "Parâmetro", sem lista fixa hardcoded. */
  numericActivityNames() {
    return this.http.get<string[]>(`${this.baseUrl}/numeric-names`);
  }

  /** locationId nulo/omitido = todos os Locais (sem filtro). */
  history(name: string, locationId: string | null) {
    let params = new HttpParams().set('name', name);
    if (locationId) {
      params = params.set('locationId', locationId);
    }

    return this.http
      .get<TaskActivityHistoryModel>(`${this.baseUrl}/history`, { params })
      .pipe(map(mapTaskActivityHistoryApiModel));
  }
}

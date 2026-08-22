import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { map } from 'rxjs/operators';

import { API } from '@core/api/api.config';
import {
  AgendaManutencaoApiModel,
  AgendaManutencaoUpsertInput,
  mapAgendaManutencaoApiModel,
  mapAgendaManutencaoApiModels,
} from '@models/agenda-manutencao.models';

@Injectable({ providedIn: 'root' })
export class AgendaManutencaoApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API.bff}/v1/agendas-manutencao`;

  list() {
    return this.http
      .get<AgendaManutencaoApiModel[]>(this.baseUrl)
      .pipe(map(mapAgendaManutencaoApiModels));
  }

  create(input: AgendaManutencaoUpsertInput) {
    return this.http
      .post<AgendaManutencaoApiModel>(this.baseUrl, input)
      .pipe(map(mapAgendaManutencaoApiModel));
  }

  update(id: string, input: AgendaManutencaoUpsertInput) {
    return this.http
      .put<AgendaManutencaoApiModel>(`${this.baseUrl}/${id}`, input)
      .pipe(map(mapAgendaManutencaoApiModel));
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}

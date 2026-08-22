import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { map } from 'rxjs/operators';

import { API } from '@core/api/api.config';
import {
  ManutencaoApiModel,
  ManutencaoUpsertInput,
  mapManutencaoApiModel,
  mapManutencaoApiModels,
} from '@models/manutencoes.models';

@Injectable({ providedIn: 'root' })
export class ManutencoesApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API.bff}/v1/manutencoes`;

  list() {
    return this.http.get<ManutencaoApiModel[]>(this.baseUrl).pipe(map(mapManutencaoApiModels));
  }

  create(input: ManutencaoUpsertInput) {
    return this.http
      .post<ManutencaoApiModel>(this.baseUrl, input)
      .pipe(map(mapManutencaoApiModel));
  }

  update(id: string, input: ManutencaoUpsertInput) {
    return this.http
      .put<ManutencaoApiModel>(`${this.baseUrl}/${id}`, input)
      .pipe(map(mapManutencaoApiModel));
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}

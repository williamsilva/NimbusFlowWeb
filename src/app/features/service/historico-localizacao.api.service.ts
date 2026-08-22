import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { map } from 'rxjs/operators';

import { API } from '@core/api/api.config';
import {
  HistoricoLocalizacaoApiModel,
  HistoricoLocalizacaoUpsertInput,
  mapHistoricoLocalizacaoApiModel,
  mapHistoricoLocalizacaoApiModels,
} from '@models/historico-localizacao.models';

@Injectable({ providedIn: 'root' })
export class HistoricoLocalizacaoApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API.bff}/v1/historicos-localizacao`;

  list() {
    return this.http
      .get<HistoricoLocalizacaoApiModel[]>(this.baseUrl)
      .pipe(map(mapHistoricoLocalizacaoApiModels));
  }

  create(input: HistoricoLocalizacaoUpsertInput) {
    return this.http
      .post<HistoricoLocalizacaoApiModel>(this.baseUrl, input)
      .pipe(map(mapHistoricoLocalizacaoApiModel));
  }

  update(id: string, input: HistoricoLocalizacaoUpsertInput) {
    return this.http
      .put<HistoricoLocalizacaoApiModel>(`${this.baseUrl}/${id}`, input)
      .pipe(map(mapHistoricoLocalizacaoApiModel));
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}

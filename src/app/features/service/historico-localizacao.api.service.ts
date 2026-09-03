import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { map } from 'rxjs/operators';

import { API } from '@core/api/api.config';
import { HalPagedResponse } from '@core/api/page.model';
import { ListQueryDto } from '@shared/features/list-query/list-query.types';
import { HistoricoLocalizacaoAdvancedFilters } from '@features/filter/historico-localizacao.filters';
import {
  HistoricoLocalizacaoApiModel,
  HistoricoLocalizacaoModel,
  HistoricoLocalizacaoUpsertInput,
  mapHistoricoLocalizacaoApiModel,
  mapHistoricoLocalizacaoApiModels,
} from '@models/historico-localizacao.models';

@Injectable({ providedIn: 'root' })
export class HistoricoLocalizacaoApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API.bff}/v1/historicos-localizacao`;

  searchPaged(body: ListQueryDto<HistoricoLocalizacaoAdvancedFilters>) {
    return this.http
      .post<HalPagedResponse<HistoricoLocalizacaoApiModel>>(`${this.baseUrl}/search`, body)
      .pipe(
        map((res) => {
          const content = mapHistoricoLocalizacaoApiModels(res?._embedded?.content);
          return {
            ...res,
            _embedded: { ...(res?._embedded ?? {}), content },
          } as HalPagedResponse<HistoricoLocalizacaoModel>;
        }),
      );
  }

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

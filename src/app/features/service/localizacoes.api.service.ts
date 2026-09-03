import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { map } from 'rxjs/operators';

import { API } from '@core/api/api.config';
import { HalPagedResponse } from '@core/api/page.model';
import { ListQueryDto } from '@williamsilva/nimbus-web-commons';
import { LocalizacoesAdvancedFilters } from '@features/filter/localizacoes.filters';
import {
  LocalizacaoApiModel,
  LocalizacaoModel,
  LocalizacaoOptionModel,
  LocalizacaoUpsertInput,
  mapLocalizacaoApiModel,
  mapLocalizacaoApiModels,
} from '@models/localizacoes.models';

@Injectable({ providedIn: 'root' })
export class LocalizacoesApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API.bff}/v1/localizacoes`;

  searchPaged(body: ListQueryDto<LocalizacoesAdvancedFilters>) {
    return this.http.post<HalPagedResponse<LocalizacaoApiModel>>(`${this.baseUrl}/search`, body).pipe(
      map((res) => {
        const content = mapLocalizacaoApiModels(res?._embedded?.content);
        return {
          ...res,
          _embedded: { ...(res?._embedded ?? {}), content },
        } as HalPagedResponse<LocalizacaoModel>;
      }),
    );
  }

  list() {
    return this.http.get<LocalizacaoApiModel[]>(this.baseUrl).pipe(map(mapLocalizacaoApiModels));
  }

  /** Pro seletor de Localização no formulário de Histórico. */
  options() {
    return this.http
      .get<LocalizacaoOptionModel[]>(`${this.baseUrl}/options`)
      .pipe(map((res) => (Array.isArray(res) ? res : [])));
  }

  create(input: LocalizacaoUpsertInput) {
    return this.http
      .post<LocalizacaoApiModel>(this.baseUrl, input)
      .pipe(map(mapLocalizacaoApiModel));
  }

  update(id: string, input: LocalizacaoUpsertInput) {
    return this.http
      .put<LocalizacaoApiModel>(`${this.baseUrl}/${id}`, input)
      .pipe(map(mapLocalizacaoApiModel));
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}

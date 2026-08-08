import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { map } from 'rxjs/operators';

import { API } from '@core/api/api.config';
import { HalPagedResponse } from '@core/api/page.model';
import { ListQueryDto } from '@shared/features/list-query/list-query.types';
import { SuggestionsAdvancedFilters } from '@features/filter/suggestions.filters';
import { SuggestionStatusEnum } from '@models/enums/suggestion-status.enum';
import {
  SuggestionModel,
  SuggestionApiModel,
  SuggestionCreateInput,
  mapSuggestionApiModel,
  mapSuggestionApiModels,
} from '@models/suggestions.models';

@Injectable({ providedIn: 'root' })
export class SuggestionsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API.bff}/v1/suggestions`;

  searchPaged(body: ListQueryDto<SuggestionsAdvancedFilters>) {
    return this.http
      .post<HalPagedResponse<SuggestionApiModel>>(`${this.baseUrl}/search`, body)
      .pipe(
        map((res) => {
          const content = mapSuggestionApiModels(res?._embedded?.content);
          return {
            ...res,
            _embedded: {
              ...(res?._embedded ?? {}),
              content,
            },
          } as HalPagedResponse<SuggestionModel>;
        }),
      );
  }

  /**
   * multipart/form-data com 2 parts: "data" (JSON de {description}) e "attachment" (arquivo,
   * opcional) - o backend (SuggestionController) exige a part "data" mesmo sem anexo.
   */
  create(input: SuggestionCreateInput) {
    const formData = new FormData();
    formData.append(
      'data',
      new Blob([JSON.stringify({ description: input.description })], {
        type: 'application/json',
      }),
    );
    if (input.attachment) {
      formData.append('attachment', input.attachment);
    }

    return this.http
      .post<SuggestionApiModel>(this.baseUrl, formData)
      .pipe(map(mapSuggestionApiModel));
  }

  updateStatus(id: string, status: SuggestionStatusEnum) {
    return this.http
      .put<SuggestionApiModel>(`${this.baseUrl}/${id}/status`, { status })
      .pipe(map(mapSuggestionApiModel));
  }
}

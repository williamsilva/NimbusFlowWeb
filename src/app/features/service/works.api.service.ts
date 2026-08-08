import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { map } from 'rxjs/operators';

import { API } from '@core/api/api.config';
import { HalPagedResponse } from '@core/api/page.model';
import { ListQueryDto } from '@shared/features/list-query/list-query.types';
import { WorksAdvancedFilters } from '@features/filter/works.filters';
import {
  WorkModel,
  WorkApiModel,
  WorkUpsertInput,
  mapWorkApiModel,
  mapWorkApiModels,
} from '@models/works.models';

@Injectable({ providedIn: 'root' })
export class WorksApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API.bff}/v1/works`;

  searchPaged(body: ListQueryDto<WorksAdvancedFilters>) {
    return this.http.post<HalPagedResponse<WorkApiModel>>(`${this.baseUrl}/search`, body).pipe(
      map((res) => {
        const content = mapWorkApiModels(res?._embedded?.content);
        return {
          ...res,
          _embedded: {
            ...(res?._embedded ?? {}),
            content,
          },
        } as HalPagedResponse<WorkModel>;
      }),
    );
  }

  getById(id: string) {
    return this.http.get<WorkApiModel>(`${this.baseUrl}/${id}`).pipe(map(mapWorkApiModel));
  }

  create(input: WorkUpsertInput) {
    return this.http.post<WorkApiModel>(`${this.baseUrl}`, input).pipe(map(mapWorkApiModel));
  }

  update(id: string, input: WorkUpsertInput) {
    return this.http.put<WorkApiModel>(`${this.baseUrl}/${id}`, input).pipe(map(mapWorkApiModel));
  }
}

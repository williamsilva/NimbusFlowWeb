import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { map } from 'rxjs/operators';

import { API } from '@core/api/api.config';
import { HalPagedResponse } from '@core/api/page.model';
import { ListQueryDto } from '@shared/features/list-query/list-query.types';
import { ManutencoesAdvancedFilters } from '@features/filter/manutencoes.filters';
import {
  ManutencaoApiModel,
  ManutencaoModel,
  ManutencaoUpsertInput,
  mapManutencaoApiModel,
  mapManutencaoApiModels,
} from '@models/manutencoes.models';

@Injectable({ providedIn: 'root' })
export class ManutencoesApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API.bff}/v1/manutencoes`;

  searchPaged(body: ListQueryDto<ManutencoesAdvancedFilters>) {
    return this.http.post<HalPagedResponse<ManutencaoApiModel>>(`${this.baseUrl}/search`, body).pipe(
      map((res) => {
        const content = mapManutencaoApiModels(res?._embedded?.content);
        return {
          ...res,
          _embedded: { ...(res?._embedded ?? {}), content },
        } as HalPagedResponse<ManutencaoModel>;
      }),
    );
  }

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

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { map } from 'rxjs/operators';

import { API } from '@core/api/api.config';
import { HalPagedResponse } from '@core/api/page.model';
import { ListQueryDto } from '@shared/features/list-query/list-query.types';
import { AgendaManutencaoAdvancedFilters } from '@features/filter/agenda-manutencao.filters';
import {
  AgendaManutencaoApiModel,
  AgendaManutencaoModel,
  AgendaManutencaoUpsertInput,
  mapAgendaManutencaoApiModel,
  mapAgendaManutencaoApiModels,
} from '@models/agenda-manutencao.models';

@Injectable({ providedIn: 'root' })
export class AgendaManutencaoApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API.bff}/v1/agendas-manutencao`;

  searchPaged(body: ListQueryDto<AgendaManutencaoAdvancedFilters>) {
    return this.http
      .post<HalPagedResponse<AgendaManutencaoApiModel>>(`${this.baseUrl}/search`, body)
      .pipe(
        map((res) => {
          const content = mapAgendaManutencaoApiModels(res?._embedded?.content);
          return {
            ...res,
            _embedded: { ...(res?._embedded ?? {}), content },
          } as HalPagedResponse<AgendaManutencaoModel>;
        }),
      );
  }

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

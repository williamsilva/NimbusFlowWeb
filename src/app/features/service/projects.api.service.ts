import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { map } from 'rxjs/operators';

import { API } from '@core/api/api.config';
import { HalPagedResponse } from '@core/api/page.model';
import { ListQueryDto } from '@shared/features/list-query/list-query.types';
import { ProjectsAdvancedFilters } from '@features/filter/projects.filters';
import {
  ProjectApiModel,
  ProjectUpsertInput,
  mapProjectApiModel,
  mapProjectApiModels,
} from '@models/projects.models';

@Injectable({ providedIn: 'root' })
export class ProjectsApiService {
  private readonly http = inject(HttpClient);
  private readonly projectsUrl = `${API.bff}/v1/projects`;

  searchPaged(body: ListQueryDto<ProjectsAdvancedFilters>) {
    return this.http
      .post<HalPagedResponse<ProjectApiModel>>(`${this.projectsUrl}/search`, body)
      .pipe(
        map((res) => {
          const content = mapProjectApiModels(res?._embedded?.content);
          return {
            ...res,
            _embedded: {
              ...(res?._embedded ?? {}),
              content,
            },
          } as HalPagedResponse<ProjectApiModel>;
        }),
      );
  }

  /** Pro seletor de Projeto no filtro/formulário de Frente de Serviço - reaproveita o findAll sem paginação já exposto pelo backend. */
  findAll() {
    return this.http.get<ProjectApiModel[]>(this.projectsUrl).pipe(map(mapProjectApiModels));
  }

  getById(id: string) {
    return this.http.get<ProjectApiModel>(`${this.projectsUrl}/${id}`).pipe(map(mapProjectApiModel));
  }

  create(input: ProjectUpsertInput) {
    return this.http.post<ProjectApiModel>(this.projectsUrl, input).pipe(map(mapProjectApiModel));
  }

  update(id: string, input: ProjectUpsertInput) {
    return this.http.put<ProjectApiModel>(`${this.projectsUrl}/${id}`, input).pipe(map(mapProjectApiModel));
  }
}

import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { map } from 'rxjs/operators';

import { API } from '@core/api/api.config';
import { SKIP_GLOBAL_ERROR_TOAST } from '@core/interceptors/error.interceptor';
import { HalPagedResponse } from '@core/api/page.model';
import { ListQueryDto } from '@williamsilva/nimbus-web-commons';
import { ProjectsAdvancedFilters } from '@features/filter/projects.filters';
import { ProjectStatusEnum } from '@models/enums/project-status.enum';
import {
  ProjectApiModel,
  ProjectOptionModel,
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

  /** Listagem completa sem paginação - usada só pela própria tela de Projetos (exige
   *  PROJETO_CONSULT no backend). Pro seletor de Projeto em outras telas, ver `options()` abaixo. */
  findAll() {
    return this.http.get<ProjectApiModel[]>(this.projectsUrl).pipe(map(mapProjectApiModels));
  }

  /** Pro seletor de Projeto em Obras/Dashboard/Medições e no diálogo de criação de Obra - sem
   *  gate de permissão no backend (ver ProjectService#options), diferente de `findAll()` acima. */
  options() {
    return this.http.get<ProjectOptionModel[]>(`${this.projectsUrl}/options`);
  }

  getById(id: string) {
    return this.http.get<ProjectApiModel>(`${this.projectsUrl}/${id}`).pipe(map(mapProjectApiModel));
  }

  /** Chamador (projects-upsert-dialog) já mostra a mensagem específica do backend (ver
   *  translateWorksErrorDetail) - SKIP_GLOBAL_ERROR_TOAST evita o toast genérico duplicado do
   *  error.interceptor. Mesmo motivo em update() abaixo. */
  create(input: ProjectUpsertInput) {
    return this.http
      .post<ProjectApiModel>(this.projectsUrl, input, {
        context: new HttpContext().set(SKIP_GLOBAL_ERROR_TOAST, true),
      })
      .pipe(map(mapProjectApiModel));
  }

  update(id: string, input: ProjectUpsertInput) {
    return this.http
      .put<ProjectApiModel>(`${this.projectsUrl}/${id}`, input, {
        context: new HttpContext().set(SKIP_GLOBAL_ERROR_TOAST, true),
      })
      .pipe(map(mapProjectApiModel));
  }

  /** Atalho de mudança de status a partir da listagem - não exige reenviar name/description como
   *  update() (edição completa) exige. */
  changeStatus(id: string, status: ProjectStatusEnum) {
    return this.http
      .post<ProjectApiModel>(`${this.projectsUrl}/${id}/status/${status}`, {})
      .pipe(map(mapProjectApiModel));
  }

  /** multipart/form-data, uma única parte de arquivo - espelha ProjectController.uploadSitePlan. */
  uploadSitePlan(id: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post<ProjectApiModel>(`${this.projectsUrl}/${id}/site-plan`, formData)
      .pipe(map(mapProjectApiModel));
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { map } from 'rxjs/operators';

import { API } from '@core/api/api.config';
import { HalPagedResponse } from '@core/api/page.model';
import { ListQueryDto } from '@williamsilva/nimbus-web-commons';
import { ActionPlansAdvancedFilters } from '@features/filter/action-plans.filters';
import {
  ActionPlanModel,
  ActionPlanApiModel,
  ActionPlanUpsertInput,
  ActionPlanProjectLinkInput,
  ActionPlanWorkLinkInput,
  mapActionPlanApiModel,
  mapActionPlanApiModels,
} from '@models/action-plans.models';

@Injectable({ providedIn: 'root' })
export class ActionPlansApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API.bff}/v1/action-plans`;

  searchPaged(body: ListQueryDto<ActionPlansAdvancedFilters>) {
    return this.http
      .post<HalPagedResponse<ActionPlanApiModel>>(`${this.baseUrl}/search`, body)
      .pipe(
        map((res) => {
          const content = mapActionPlanApiModels(res?._embedded?.content);
          return {
            ...res,
            _embedded: {
              ...(res?._embedded ?? {}),
              content,
            },
          } as HalPagedResponse<ActionPlanModel>;
        }),
      );
  }

  getById(id: string) {
    return this.http
      .get<ActionPlanApiModel>(`${this.baseUrl}/${id}`)
      .pipe(map(mapActionPlanApiModel));
  }

  create(input: ActionPlanUpsertInput) {
    return this.http
      .post<ActionPlanApiModel>(this.baseUrl, input)
      .pipe(map(mapActionPlanApiModel));
  }

  update(id: string, input: ActionPlanUpsertInput) {
    return this.http
      .put<ActionPlanApiModel>(`${this.baseUrl}/${id}`, input)
      .pipe(map(mapActionPlanApiModel));
  }

  start(id: string) {
    return this.http
      .put<ActionPlanApiModel>(`${this.baseUrl}/${id}/start`, {})
      .pipe(map(mapActionPlanApiModel));
  }

  complete(id: string) {
    return this.http
      .put<ActionPlanApiModel>(`${this.baseUrl}/${id}/complete`, {})
      .pipe(map(mapActionPlanApiModel));
  }

  cancel(id: string) {
    return this.http
      .put<ActionPlanApiModel>(`${this.baseUrl}/${id}/cancel`, {})
      .pipe(map(mapActionPlanApiModel));
  }

  /** "Cadastrar novo Projeto" a partir de um plano já criado - sempre um Projeto recém-criado
   *  (ActionPlansListComponent#onProjectCreated chama logo depois de
   *  ProjectsUpsertDialogComponent salvar). */
  linkProject(id: string, input: ActionPlanProjectLinkInput) {
    return this.http
      .put<ActionPlanApiModel>(`${this.baseUrl}/${id}/link-project`, input)
      .pipe(map(mapActionPlanApiModel));
  }

  /** "Criar nova Frente de Serviço" a partir de um plano já criado - sempre uma Frente
   *  recém-criada (ActionPlansListComponent#onWorkCreated chama logo depois de
   *  WorksCreateDialogComponent salvar). */
  linkWork(id: string, input: ActionPlanWorkLinkInput) {
    return this.http
      .put<ActionPlanApiModel>(`${this.baseUrl}/${id}/link-work`, input)
      .pipe(map(mapActionPlanApiModel));
  }
}

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { map } from 'rxjs/operators';

import { API, APP_KEY } from '@core/api/api.config';
import { HalPagedResponse } from '@core/api/page.model';
import { GroupsAdvancedFilters } from '@features/filter/groups.filters';
import { ListQueryDto } from '@williamsilva/nimbus-web-commons';
import {
  GroupModel,
  GroupApiModel,
  GroupCreateInput,
  GroupUpdateInput,
  GroupUsersInput,
  GroupPermissionsInput,
  mapGroupApiModel,
  mapGroupApiModels,
} from '@models/groups.models';

@Injectable({ providedIn: 'root' })
export class GroupsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API.bff}/v1/groups`;

  searchPaged(body: ListQueryDto<GroupsAdvancedFilters>) {
    // appKey é sempre fixado aqui (nunca escolhido pelo usuário) — a tela de grupos do NimbusFlow
    // não deve listar grupos de outros apps Nimbus (ex.: NimbusFlow), mesmo que o catálogo de
    // grupos seja compartilhado no NimbusAuth.
    const scopedBody: ListQueryDto<GroupsAdvancedFilters> = {
      ...body,
      advanced: { ...body.advanced, appKey: APP_KEY },
    };
    return this.http.post<HalPagedResponse<GroupApiModel>>(`${this.baseUrl}/search`, scopedBody).pipe(
      map((res) => {
        const content = mapGroupApiModels(res?._embedded?.content);
        return {
          ...res,
          _embedded: {
            ...(res?._embedded ?? {}),
            content,
          },
        } as HalPagedResponse<GroupModel>;
      }),
    );
  }

  getAll() {
    return this.http
      .get<GroupApiModel[]>(`${this.baseUrl}/options`, {
        withCredentials: true,
        params: new HttpParams().set('appKey', APP_KEY),
      })
      .pipe(map((res) => mapGroupApiModels(Array.isArray(res) ? res : [])));
  }

  getById(id: string) {
    return this.http.get<GroupApiModel>(`${this.baseUrl}/${id}`).pipe(map(mapGroupApiModel));
  }

  create(input: GroupCreateInput) {
    return this.http.post<GroupApiModel>(`${this.baseUrl}`, input).pipe(map(mapGroupApiModel));
  }

  update(id: string, input: GroupUpdateInput) {
    return this.http.put<GroupApiModel>(`${this.baseUrl}/${id}`, input).pipe(map(mapGroupApiModel));
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  updatePermissions(id: string, input: GroupPermissionsInput) {
    return this.http.put<GroupApiModel>(`${this.baseUrl}/${id}/permissions`, input).pipe(map(mapGroupApiModel));
  }

  updateUsers(id: string, input: GroupUsersInput) {
    return this.http.put<GroupApiModel>(`${this.baseUrl}/${id}/users`, input).pipe(map(mapGroupApiModel));
  }
}

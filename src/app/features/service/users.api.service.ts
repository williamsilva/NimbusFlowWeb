import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { map } from 'rxjs/operators';

import { API } from '@core/api/api.config';
import { HalPagedResponse } from '@core/api/page.model';
import { UsersAdvancedFilters } from '@features/filter/users.filters';
import { ListQueryDto } from '@shared/features/list-query/list-query.types';
import { UserOptionApiModel, UserOptionModel, mapUserOptionApiModel } from '@models/groups.models';
import {
  UserModel,
  UserApiModel,
  mapUserApiModel,
  UserCreateInput,
  UserUpdateInput,
  mapUserApiModels,
  UserBulkStatusInput,
} from '@models/users.models';

@Injectable({ providedIn: 'root' })
export class UsersApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API.bff}/v1/users`;

  getOptions() {
    return this.http
      .get<UserOptionApiModel[]>(`${this.baseUrl}/options`)
      .pipe(map((items) => (items ?? []).map(mapUserOptionApiModel) as UserOptionModel[]));
  }

  getOptionsFilter() {
    return this.http
      .get<UserOptionApiModel[]>(`${this.baseUrl}/options-filter`)
      .pipe(map((items) => (items ?? []).map(mapUserOptionApiModel) as UserOptionModel[]));
  }

  searchPaged(body: ListQueryDto<UsersAdvancedFilters>) {
    return this.http.post<HalPagedResponse<UserApiModel>>(`${this.baseUrl}/search`, body).pipe(
      map(
        (res) =>
          ({
            ...res,
            content: mapUserApiModels(res?._embedded?.content),
          }) as HalPagedResponse<UserModel>,
      ),
    );
  }

  getById(id: string) {
    return this.http.get<UserApiModel>(`${this.baseUrl}/${id}`).pipe(map(mapUserApiModel));
  }

  create(input: UserCreateInput) {
    return this.http.post<UserApiModel>(`${this.baseUrl}`, input).pipe(map(mapUserApiModel));
  }

  update(id: string, input: UserUpdateInput) {
    return this.http.put<UserApiModel>(`${this.baseUrl}/${id}`, input).pipe(map(mapUserApiModel));
  }

  activate(id: string) {
    return this.http.post<void>(`${this.baseUrl}/${id}/activate`, null);
  }

  deactivate(id: string) {
    return this.http.post<void>(`${this.baseUrl}/${id}/deactivate`, null);
  }

  activateBulk(input: UserBulkStatusInput) {
    return this.http.post<void>(`${this.baseUrl}/activate`, input);
  }

  deactivateBulk(input: UserBulkStatusInput) {
    return this.http.post<void>(`${this.baseUrl}/deactivate`, input);
  }

  resendInvite(id: string) {
    return this.http.post<void>(`${API.bff}/v1/users/${id}/resend-invite`, null, {
      withCredentials: true,
    });
  }
}

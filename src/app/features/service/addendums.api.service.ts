import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { map } from 'rxjs/operators';

import { API } from '@core/api/api.config';
import { HalPagedResponse } from '@core/api/page.model';
import { ListQueryDto } from '@shared/features/list-query/list-query.types';
import { AddendumsAdvancedFilters } from '@features/filter/addendums.filters';
import {
  AddendumApiModel,
  AddendumDecisionInput,
  AddendumRequestInput,
  AddendumWithWorkApiModel,
  AddendumWithWorkModel,
  mapAddendumApiModel,
  mapAddendumApiModels,
  mapAddendumWithWorkApiModels,
} from '@models/addendums.models';

@Injectable({ providedIn: 'root' })
export class AddendumsApiService {
  private readonly http = inject(HttpClient);
  private readonly worksUrl = `${API.bff}/v1/works`;
  private readonly addendumsUrl = `${API.bff}/v1/addendums`;

  findByWork(workId: string) {
    return this.http
      .get<AddendumApiModel[]>(`${this.worksUrl}/${workId}/addendums`)
      .pipe(map(mapAddendumApiModels));
  }

  searchPaged(body: ListQueryDto<AddendumsAdvancedFilters>) {
    return this.http
      .post<HalPagedResponse<AddendumWithWorkApiModel>>(`${this.addendumsUrl}/search`, body)
      .pipe(
        map((res) => {
          const content = mapAddendumWithWorkApiModels(res?._embedded?.content);
          return {
            ...res,
            _embedded: { ...(res?._embedded ?? {}), content },
          } as HalPagedResponse<AddendumWithWorkModel>;
        }),
      );
  }

  submit(workId: string, input: AddendumRequestInput) {
    return this.http
      .post<AddendumApiModel>(`${this.worksUrl}/${workId}/addendums`, input)
      .pipe(map(mapAddendumApiModel));
  }

  approve(id: string, input: AddendumDecisionInput) {
    return this.http
      .post<AddendumApiModel>(`${this.addendumsUrl}/${id}/approve`, input)
      .pipe(map(mapAddendumApiModel));
  }

  reject(id: string, input: AddendumDecisionInput) {
    return this.http
      .post<AddendumApiModel>(`${this.addendumsUrl}/${id}/reject`, input)
      .pipe(map(mapAddendumApiModel));
  }

  resendNotification(id: string) {
    return this.http
      .post<AddendumApiModel>(`${this.addendumsUrl}/${id}/resend-notification`, {})
      .pipe(map(mapAddendumApiModel));
  }
}

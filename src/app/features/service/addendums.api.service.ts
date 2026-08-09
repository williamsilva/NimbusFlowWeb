import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { map } from 'rxjs/operators';

import { API } from '@core/api/api.config';
import {
  AddendumApiModel,
  AddendumDecisionInput,
  AddendumRequestInput,
  mapAddendumApiModel,
  mapAddendumApiModels,
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
}

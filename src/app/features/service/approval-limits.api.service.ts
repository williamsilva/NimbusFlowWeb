import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { map } from 'rxjs/operators';

import { API } from '@core/api/api.config';
import {
  ApprovalLimitApiModel,
  ApprovalLimitInput,
  mapApprovalLimitApiModel,
  mapApprovalLimitApiModels,
} from '@models/approval-limits.models';

@Injectable({ providedIn: 'root' })
export class ApprovalLimitsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API.bff}/v1/approval-limits`;

  list() {
    return this.http.get<ApprovalLimitApiModel[]>(this.baseUrl).pipe(map(mapApprovalLimitApiModels));
  }

  create(input: ApprovalLimitInput) {
    return this.http.post<ApprovalLimitApiModel>(this.baseUrl, input).pipe(map(mapApprovalLimitApiModel));
  }

  update(id: string, input: ApprovalLimitInput) {
    return this.http.put<ApprovalLimitApiModel>(`${this.baseUrl}/${id}`, input).pipe(map(mapApprovalLimitApiModel));
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}

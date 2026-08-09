import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { map } from 'rxjs/operators';

import { API } from '@core/api/api.config';
import {
  InstallmentApiModel,
  InstallmentScheduleInput,
  mapInstallmentApiModel,
  mapInstallmentApiModels,
} from '@models/installments.models';

@Injectable({ providedIn: 'root' })
export class InstallmentsApiService {
  private readonly http = inject(HttpClient);
  private readonly worksUrl = `${API.bff}/v1/works`;
  private readonly installmentsUrl = `${API.bff}/v1/installments`;

  findByWork(workId: string) {
    return this.http
      .get<InstallmentApiModel[]>(`${this.worksUrl}/${workId}/installments`)
      .pipe(map(mapInstallmentApiModels));
  }

  schedule(workId: string, input: InstallmentScheduleInput) {
    return this.http
      .post<InstallmentApiModel[]>(`${this.worksUrl}/${workId}/installments`, input)
      .pipe(map(mapInstallmentApiModels));
  }

  release(id: string) {
    return this.http
      .post<InstallmentApiModel>(`${this.installmentsUrl}/${id}/release`, {})
      .pipe(map(mapInstallmentApiModel));
  }

  markPaid(id: string) {
    return this.http
      .post<InstallmentApiModel>(`${this.installmentsUrl}/${id}/mark-paid`, {})
      .pipe(map(mapInstallmentApiModel));
  }
}

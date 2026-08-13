import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { map } from 'rxjs/operators';

import { API } from '@core/api/api.config';
import { HalPagedResponse } from '@core/api/page.model';
import { ListQueryDto } from '@shared/features/list-query/list-query.types';
import { InstallmentsAdvancedFilters } from '@features/filter/installments.filters';
import {
  InstallmentApiModel,
  InstallmentWithWorkApiModel,
  InstallmentWithWorkModel,
  mapInstallmentApiModel,
  mapInstallmentApiModels,
  mapInstallmentWithWorkApiModels,
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

  searchPaged(body: ListQueryDto<InstallmentsAdvancedFilters>) {
    return this.http
      .post<HalPagedResponse<InstallmentWithWorkApiModel>>(`${this.installmentsUrl}/search`, body)
      .pipe(
        map((res) => {
          const content = mapInstallmentWithWorkApiModels(res?._embedded?.content);
          return {
            ...res,
            _embedded: { ...(res?._embedded ?? {}), content },
          } as HalPagedResponse<InstallmentWithWorkModel>;
        }),
      );
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

  resendNotification(id: string) {
    return this.http
      .post<InstallmentApiModel>(`${this.installmentsUrl}/${id}/resend-notification`, {})
      .pipe(map(mapInstallmentApiModel));
  }
}

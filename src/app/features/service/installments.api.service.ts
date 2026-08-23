import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { map } from 'rxjs/operators';

import { API } from '@core/api/api.config';
import { SKIP_GLOBAL_ERROR_TOAST } from '@core/interceptors/error.interceptor';
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

  /** Chamadores (installments-list/all-installments-list) já mostram a mensagem específica do
   *  backend (ver translateWorksErrorDetail) - SKIP_GLOBAL_ERROR_TOAST evita o toast genérico
   *  duplicado do error.interceptor pra qualquer erro de negócio (ex.: "parcela não está mais
   *  liberada"). Mesmo motivo nos outros métodos deste service. */
  release(id: string) {
    return this.http
      .post<InstallmentApiModel>(
        `${this.installmentsUrl}/${id}/release`,
        {},
        { context: new HttpContext().set(SKIP_GLOBAL_ERROR_TOAST, true) },
      )
      .pipe(map(mapInstallmentApiModel));
  }

  /** @param paidAt data em que o pagamento ocorreu (formato yyyy-MM-dd) - informada por quem
   *  confirma o pagamento, não é mais "agora" (ver WorkAutoCompleteService no backend, que usa
   *  essa data pra contar a carência de conclusão automática da Frente). */
  markPaid(id: string, paidAt: string) {
    return this.http
      .post<InstallmentApiModel>(
        `${this.installmentsUrl}/${id}/mark-paid`,
        { paidAt },
        { context: new HttpContext().set(SKIP_GLOBAL_ERROR_TOAST, true) },
      )
      .pipe(map(mapInstallmentApiModel));
  }

  resendNotification(id: string) {
    return this.http
      .post<InstallmentApiModel>(
        `${this.installmentsUrl}/${id}/resend-notification`,
        {},
        { context: new HttpContext().set(SKIP_GLOBAL_ERROR_TOAST, true) },
      )
      .pipe(map(mapInstallmentApiModel));
  }
}

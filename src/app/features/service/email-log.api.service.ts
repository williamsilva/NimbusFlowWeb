import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { map } from 'rxjs/operators';

import { API } from '@core/api/api.config';
import { HalPagedResponse } from '@core/api/page.model';
import { ListQueryDto } from '@williamsilva/nimbus-web-commons';
import { EmailLogAdvancedFilters } from '@features/filter/email-log.filters';
import { EmailLogApiModel, EmailLogModel, mapEmailLogApiModels } from '@models/email-log.models';

@Injectable({ providedIn: 'root' })
export class EmailLogApiService {
  private readonly http = inject(HttpClient);
  private readonly emailLogUrl = `${API.bff}/v1/email/logs`;

  searchPaged(body: ListQueryDto<EmailLogAdvancedFilters>) {
    return this.http
      .post<HalPagedResponse<EmailLogApiModel>>(`${this.emailLogUrl}/search`, body)
      .pipe(
        map((res) => {
          const content = mapEmailLogApiModels(res?._embedded?.content);
          return {
            ...res,
            _embedded: { ...(res?._embedded ?? {}), content },
          } as HalPagedResponse<EmailLogModel>;
        }),
      );
  }
}

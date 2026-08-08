import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from 'environments/environment';

export type BackupTarget = 'NIMBUSFLOW_DB' | 'NIMBUSAUTH_DB' | 'FILES';

@Injectable({ providedIn: 'root' })
export class BackupApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.bffBaseUrl}/bff/v1/settings/backup`;

  execute(targets: BackupTarget[]): Observable<HttpResponse<Blob>> {
    return this.http.post(`${this.baseUrl}/execute`, { targets }, {
      responseType: 'blob',
      observe: 'response',
    });
  }
}

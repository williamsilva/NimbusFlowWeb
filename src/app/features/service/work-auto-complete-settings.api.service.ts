import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from 'environments/environment';

export interface WorkAutoCompleteSettingsModel {
  daysSinceLastPayment: number;
  runHour: number;
  runMinute: number;
}

export type WorkAutoCompleteSettingsRequest = WorkAutoCompleteSettingsModel;

@Injectable({ providedIn: 'root' })
export class WorkAutoCompleteSettingsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.bffBaseUrl}/bff/v1/work-auto-complete/settings`;

  getSettings(): Observable<WorkAutoCompleteSettingsModel> {
    return this.http.get<WorkAutoCompleteSettingsModel>(this.baseUrl);
  }

  updateSettings(request: WorkAutoCompleteSettingsRequest): Observable<WorkAutoCompleteSettingsModel> {
    return this.http.put<WorkAutoCompleteSettingsModel>(this.baseUrl, request);
  }
}

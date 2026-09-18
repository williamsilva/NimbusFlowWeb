import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from 'environments/environment';

export interface ProjectAutoCompleteSettingsModel {
  daysSinceLastPayment: number;
  runHour: number;
  runMinute: number;
}

export type ProjectAutoCompleteSettingsRequest = ProjectAutoCompleteSettingsModel;

@Injectable({ providedIn: 'root' })
export class ProjectAutoCompleteSettingsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.bffBaseUrl}/bff/v1/project-auto-complete/settings`;

  getSettings(): Observable<ProjectAutoCompleteSettingsModel> {
    return this.http.get<ProjectAutoCompleteSettingsModel>(this.baseUrl);
  }

  updateSettings(request: ProjectAutoCompleteSettingsRequest): Observable<ProjectAutoCompleteSettingsModel> {
    return this.http.put<ProjectAutoCompleteSettingsModel>(this.baseUrl, request);
  }
}

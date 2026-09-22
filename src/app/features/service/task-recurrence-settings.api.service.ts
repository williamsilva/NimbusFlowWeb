import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from 'environments/environment';

export interface TaskRecurrenceSettingsModel {
  runHour: number;
  runMinute: number;
}

export type TaskRecurrenceSettingsRequest = TaskRecurrenceSettingsModel;

@Injectable({ providedIn: 'root' })
export class TaskRecurrenceSettingsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.bffBaseUrl}/bff/v1/tasks/recurrence-settings`;

  getSettings(): Observable<TaskRecurrenceSettingsModel> {
    return this.http.get<TaskRecurrenceSettingsModel>(this.baseUrl);
  }

  updateSettings(request: TaskRecurrenceSettingsRequest): Observable<TaskRecurrenceSettingsModel> {
    return this.http.put<TaskRecurrenceSettingsModel>(this.baseUrl, request);
  }
}

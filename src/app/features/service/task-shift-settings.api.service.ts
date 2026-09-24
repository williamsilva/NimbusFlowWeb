import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { API } from '@core/api/api.config';
import { TaskShiftSettingsInput, TaskShiftSettingsModel } from '@models/task-shift-settings.models';

@Injectable({ providedIn: 'root' })
export class TaskShiftSettingsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API.bff}/v1/tasks/shift-settings`;

  getSettings() {
    return this.http.get<TaskShiftSettingsModel>(this.baseUrl);
  }

  updateSettings(input: TaskShiftSettingsInput) {
    return this.http.put<TaskShiftSettingsModel>(this.baseUrl, input);
  }
}

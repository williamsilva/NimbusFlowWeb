import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from 'environments/environment';

export interface SupplierAutoDeactivateSettingsModel {
  daysWithoutActiveProject: number;
  runHour: number;
  runMinute: number;
}

export type SupplierAutoDeactivateSettingsRequest = SupplierAutoDeactivateSettingsModel;

@Injectable({ providedIn: 'root' })
export class SupplierAutoDeactivateSettingsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.bffBaseUrl}/bff/v1/supplier-auto-deactivate/settings`;

  getSettings(): Observable<SupplierAutoDeactivateSettingsModel> {
    return this.http.get<SupplierAutoDeactivateSettingsModel>(this.baseUrl);
  }

  updateSettings(request: SupplierAutoDeactivateSettingsRequest): Observable<SupplierAutoDeactivateSettingsModel> {
    return this.http.put<SupplierAutoDeactivateSettingsModel>(this.baseUrl, request);
  }
}

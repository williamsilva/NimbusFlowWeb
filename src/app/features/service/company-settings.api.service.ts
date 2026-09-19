import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from 'environments/environment';
import { CompanySettingsModel, CompanySettingsRequest } from '@models/company-settings.models';

@Injectable({ providedIn: 'root' })
export class CompanySettingsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.bffBaseUrl}/bff/v1/company-settings`;

  getSettings(): Observable<CompanySettingsModel> {
    return this.http.get<CompanySettingsModel>(this.baseUrl);
  }

  /** Sem exigir COMPANY_SETTINGS_CONSULT - usado pelo cabeçalho do Chamado (ver
   *  TicketDetailComponent), não só pela tela de Configurações. */
  getDisplaySettings(): Observable<CompanySettingsModel> {
    return this.http.get<CompanySettingsModel>(`${this.baseUrl}/display`);
  }

  updateSettings(request: CompanySettingsRequest): Observable<CompanySettingsModel> {
    return this.http.put<CompanySettingsModel>(this.baseUrl, request);
  }
}

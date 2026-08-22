import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { API } from '@core/api/api.config';
import {
  ManutencoesPorStatusModel,
  TopEquipamentoModel,
  TotalEquipamentosModel,
  TotalManutencoesModel,
} from '@models/patrimonio-dashboard.models';

@Injectable({ providedIn: 'root' })
export class PatrimonioDashboardApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API.bff}/v1/patrimonio/dashboard`;

  private buildParams(firstPeriod: string | null, finalPeriod: string | null): HttpParams {
    let params = new HttpParams();
    if (firstPeriod) params = params.set('firstPeriod', firstPeriod);
    if (finalPeriod) params = params.set('finalPeriod', finalPeriod);
    return params;
  }

  totalEquipamentos(firstPeriod: string | null, finalPeriod: string | null) {
    return this.http.get<TotalEquipamentosModel>(`${this.baseUrl}/total-equipamentos`, {
      params: this.buildParams(firstPeriod, finalPeriod),
    });
  }

  totalManutencoes(firstPeriod: string | null, finalPeriod: string | null) {
    return this.http.get<TotalManutencoesModel>(`${this.baseUrl}/total-manutencoes`, {
      params: this.buildParams(firstPeriod, finalPeriod),
    });
  }

  topEquipamentos(firstPeriod: string | null, finalPeriod: string | null) {
    return this.http.get<TopEquipamentoModel[]>(`${this.baseUrl}/top-equipamentos`, {
      params: this.buildParams(firstPeriod, finalPeriod),
    });
  }

  manutencoesPorStatus(firstPeriod: string | null, finalPeriod: string | null) {
    return this.http.get<ManutencoesPorStatusModel[]>(`${this.baseUrl}/manutencoes-por-status`, {
      params: this.buildParams(firstPeriod, finalPeriod),
    });
  }
}

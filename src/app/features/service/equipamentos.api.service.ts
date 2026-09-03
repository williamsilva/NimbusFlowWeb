import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { map } from 'rxjs/operators';

import { API } from '@core/api/api.config';
import { HalPagedResponse } from '@core/api/page.model';
import { ListQueryDto } from '@shared/features/list-query/list-query.types';
import { EquipamentosAdvancedFilters } from '@features/filter/equipamentos.filters';
import {
  EquipamentoApiModel,
  EquipamentoModel,
  EquipamentoOptionModel,
  EquipamentoUpsertInput,
  mapEquipamentoApiModel,
  mapEquipamentoApiModels,
} from '@models/equipamentos.models';

@Injectable({ providedIn: 'root' })
export class EquipamentosApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API.bff}/v1/equipamentos`;

  searchPaged(body: ListQueryDto<EquipamentosAdvancedFilters>) {
    return this.http.post<HalPagedResponse<EquipamentoApiModel>>(`${this.baseUrl}/search`, body).pipe(
      map((res) => {
        const content = mapEquipamentoApiModels(res?._embedded?.content);
        return {
          ...res,
          _embedded: { ...(res?._embedded ?? {}), content },
        } as HalPagedResponse<EquipamentoModel>;
      }),
    );
  }

  /** Listagem completa sem paginação - usada só pelos seletores/dashboard. Pro seletor de
   *  Equipamento nos formulários de Manutenção/Agenda/Histórico, ver `options()` abaixo. */
  list() {
    return this.http.get<EquipamentoApiModel[]>(this.baseUrl).pipe(map(mapEquipamentoApiModels));
  }

  /** Pros seletores de Equipamento nos formulários de Manutenção/Agenda/Histórico. */
  options() {
    return this.http
      .get<EquipamentoOptionModel[]>(`${this.baseUrl}/options`)
      .pipe(map((res) => (Array.isArray(res) ? res : [])));
  }

  getById(id: string) {
    return this.http.get<EquipamentoApiModel>(`${this.baseUrl}/${id}`).pipe(map(mapEquipamentoApiModel));
  }

  create(input: EquipamentoUpsertInput) {
    return this.http
      .post<EquipamentoApiModel>(this.baseUrl, input)
      .pipe(map(mapEquipamentoApiModel));
  }

  update(id: string, input: EquipamentoUpsertInput) {
    return this.http
      .put<EquipamentoApiModel>(`${this.baseUrl}/${id}`, input)
      .pipe(map(mapEquipamentoApiModel));
  }
}

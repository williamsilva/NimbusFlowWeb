import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { map } from 'rxjs/operators';

import { API } from '@core/api/api.config';
import { SKIP_GLOBAL_ERROR_TOAST } from '@core/interceptors/error.interceptor';
import { HalPagedResponse } from '@core/api/page.model';
import { ListQueryDto } from '@shared/features/list-query/list-query.types';
import { WorksAdvancedFilters } from '@features/filter/works.filters';
import { WorkStatusEnum } from '@models/enums/work-status.enum';
import {
  WorkModel,
  WorkApiModel,
  WorkUpsertInput,
  mapWorkApiModel,
  mapWorkApiModels,
} from '@models/works.models';

interface WorkOptionApiModel {
  id: string;
  name: string;
  status: WorkStatusEnum;
}

@Injectable({ providedIn: 'root' })
export class WorksApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API.bff}/v1/works`;

  searchPaged(body: ListQueryDto<WorksAdvancedFilters>) {
    return this.http.post<HalPagedResponse<WorkApiModel>>(`${this.baseUrl}/search`, body).pipe(
      map((res) => {
        const content = mapWorkApiModels(res?._embedded?.content);
        return {
          ...res,
          _embedded: {
            ...(res?._embedded ?? {}),
            content,
          },
        } as HalPagedResponse<WorkModel>;
      }),
    );
  }

  getById(id: string) {
    return this.http.get<WorkApiModel>(`${this.baseUrl}/${id}`).pipe(map(mapWorkApiModel));
  }

  /** Listagem completa sem paginação - usada só pela própria tela de Obras (exige OBRA_CONSULT no
   *  backend). Pro seletor de Frente de Serviço em outras telas, ver `options()` abaixo. */
  findAll() {
    return this.http.get<WorkApiModel[]>(`${this.baseUrl}`).pipe(map(mapWorkApiModels));
  }

  /** Pro seletor de Frente de Serviço em Chamados/Planos de Ação/Dashboard/Medições/Parcelas/
   *  Aditivos e no diálogo de criação de Obra - sem gate de permissão no backend (ver
   *  WorkService#options), diferente de `findAll()`/`searchPaged()`/`getById()` acima. */
  options() {
    return this.http.get<WorkOptionApiModel[]>(`${this.baseUrl}/options`).pipe(
      map((items) => (items ?? []).map((w) => ({ label: w.name, value: w.id, status: w.status }))),
    );
  }

  create(input: WorkUpsertInput) {
    return this.http.post<WorkApiModel>(`${this.baseUrl}`, input).pipe(map(mapWorkApiModel));
  }

  update(id: string, input: WorkUpsertInput) {
    return this.http.put<WorkApiModel>(`${this.baseUrl}/${id}`, input).pipe(map(mapWorkApiModel));
  }

  /** Exclui uma Frente de Serviço vazia (sem Aditivo/Medição/Ordem de Pagamento, mesmo cancelada -
   *  ver WorkService.delete). SKIP_GLOBAL_ERROR_TOAST: o componente já mostra a mensagem
   *  específica do backend (o que está bloqueando a exclusão). */
  delete(id: string) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, {
      context: new HttpContext().set(SKIP_GLOBAL_ERROR_TOAST, true),
    });
  }
}

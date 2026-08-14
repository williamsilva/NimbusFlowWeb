import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { map } from 'rxjs/operators';

import { API } from '@core/api/api.config';
import { HalPagedResponse } from '@core/api/page.model';
import { ListQueryDto } from '@shared/features/list-query/list-query.types';
import { SuppliersAdvancedFilters } from '@features/filter/suppliers.filters';
import {
  SupplierModel,
  SupplierApiModel,
  SupplierOptionModel,
  SupplierUpsertInput,
  mapSupplierApiModel,
  mapSupplierApiModels,
  mapSupplierOptionApiModels,
} from '@models/suppliers.models';

@Injectable({ providedIn: 'root' })
export class SuppliersApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API.bff}/v1/suppliers`;

  searchPaged(body: ListQueryDto<SuppliersAdvancedFilters>) {
    return this.http
      .post<HalPagedResponse<SupplierApiModel>>(`${this.baseUrl}/search`, body)
      .pipe(
        map((res) => {
          const content = mapSupplierApiModels(res?._embedded?.content);
          return {
            ...res,
            _embedded: {
              ...(res?._embedded ?? {}),
              content,
            },
          } as HalPagedResponse<SupplierModel>;
        }),
      );
  }

  /** Pro seletor de Fornecedor no formulário de Obra. */
  options() {
    return this.http
      .get<SupplierOptionModel[]>(`${this.baseUrl}/options`)
      .pipe(map((res) => mapSupplierOptionApiModels(Array.isArray(res) ? res : [])));
  }

  getById(id: string) {
    return this.http.get<SupplierApiModel>(`${this.baseUrl}/${id}`).pipe(map(mapSupplierApiModel));
  }

  create(input: SupplierUpsertInput) {
    return this.http.post<SupplierApiModel>(`${this.baseUrl}`, input).pipe(map(mapSupplierApiModel));
  }

  update(id: string, input: SupplierUpsertInput) {
    return this.http
      .put<SupplierApiModel>(`${this.baseUrl}/${id}`, input)
      .pipe(map(mapSupplierApiModel));
  }

  /** Soft-delete (backend só marca active=false, preserva FK com Obra). */
  deactivate(id: string) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /** Reverte o soft-delete (backend só marca active=true). */
  activate(id: string) {
    return this.http.post<void>(`${this.baseUrl}/${id}/activate`, {});
  }
}

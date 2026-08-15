import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { map } from 'rxjs/operators';

import { API } from '@core/api/api.config';
import { SelectOption } from '@models/select-option.model';
import {
  DepartmentApiModel,
  DepartmentInput,
  mapDepartmentApiModel,
  mapDepartmentApiModels,
} from '@models/departments.models';

interface DepartmentOptionApiModel {
  id: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class DepartmentsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API.bff}/v1/departments`;

  list() {
    return this.http.get<DepartmentApiModel[]>(this.baseUrl).pipe(map(mapDepartmentApiModels));
  }

  /** Pro seletor de Departamento no formulário de Chamado - sem gate de permissão no backend. */
  options() {
    return this.http.get<DepartmentOptionApiModel[]>(`${this.baseUrl}/options`).pipe(
      map((items): SelectOption<string>[] => (items ?? []).map((d) => ({ label: d.name, value: d.id }))),
    );
  }

  create(input: DepartmentInput) {
    return this.http.post<DepartmentApiModel>(this.baseUrl, input).pipe(map(mapDepartmentApiModel));
  }

  update(id: string, input: DepartmentInput) {
    return this.http.put<DepartmentApiModel>(`${this.baseUrl}/${id}`, input).pipe(map(mapDepartmentApiModel));
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}

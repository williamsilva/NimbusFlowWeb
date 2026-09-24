import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { map } from 'rxjs/operators';

import { API } from '@core/api/api.config';
import { SelectOption } from '@models/select-option.model';
import { CargoApiModel, CargoInput, mapCargoApiModel, mapCargoApiModels } from '@models/cargos.models';

interface CargoOptionApiModel {
  id: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class CargosApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API.bff}/v1/cargos`;

  list() {
    return this.http.get<CargoApiModel[]>(this.baseUrl).pipe(map(mapCargoApiModels));
  }

  /** Pro seletor de Cargo no diálogo "Gerenciar permissões" de Categoria - sem gate de permissão
   *  no backend. */
  options() {
    return this.http
      .get<CargoOptionApiModel[]>(`${this.baseUrl}/options`)
      .pipe(map((items): SelectOption<string>[] => (items ?? []).map((c) => ({ label: c.name, value: c.id }))));
  }

  create(input: CargoInput) {
    return this.http.post<CargoApiModel>(this.baseUrl, input).pipe(map(mapCargoApiModel));
  }

  update(id: string, input: CargoInput) {
    return this.http.put<CargoApiModel>(`${this.baseUrl}/${id}`, input).pipe(map(mapCargoApiModel));
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}

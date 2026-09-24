import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { map } from 'rxjs/operators';

import { API } from '@core/api/api.config';
import { SelectOption } from '@models/select-option.model';
import {
  TaskLocationApiModel,
  TaskLocationInput,
  mapTaskLocationApiModel,
  mapTaskLocationApiModels,
} from '@models/task-locations.models';

interface TaskLocationOptionApiModel {
  id: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class TaskLocationsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API.bff}/v1/task-locations`;

  list() {
    return this.http.get<TaskLocationApiModel[]>(this.baseUrl).pipe(map(mapTaskLocationApiModels));
  }

  /** Pro seletor de Local na criação de Tarefa/Modelo - sem gate de permissão no backend. */
  options() {
    return this.http
      .get<TaskLocationOptionApiModel[]>(`${this.baseUrl}/options`)
      .pipe(map((items): SelectOption<string>[] => (items ?? []).map((l) => ({ label: l.name, value: l.id }))));
  }

  create(input: TaskLocationInput) {
    return this.http.post<TaskLocationApiModel>(this.baseUrl, input).pipe(map(mapTaskLocationApiModel));
  }

  update(id: string, input: TaskLocationInput) {
    return this.http.put<TaskLocationApiModel>(`${this.baseUrl}/${id}`, input).pipe(map(mapTaskLocationApiModel));
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}

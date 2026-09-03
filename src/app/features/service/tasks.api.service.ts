import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { map } from 'rxjs/operators';

import { API } from '@core/api/api.config';
import { HalPagedResponse } from '@core/api/page.model';
import { ListQueryDto } from '@williamsilva/nimbus-web-commons';
import { TasksAdvancedFilters } from '@features/filter/tasks.filters';
import {
  TaskModel,
  TaskApiModel,
  TaskUpsertInput,
  TaskStatusInput,
  TaskWithActionPlanModel,
  TaskWithActionPlanApiModel,
  mapTaskApiModel,
  mapTaskApiModels,
  mapTaskWithActionPlanApiModels,
} from '@models/tasks.models';

@Injectable({ providedIn: 'root' })
export class TasksApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API.bff}/v1/tasks`;

  findByActionPlan(actionPlanId: string) {
    return this.http
      .get<TaskApiModel[]>(`${API.bff}/v1/action-plans/${actionPlanId}/tasks`)
      .pipe(map(mapTaskApiModels));
  }

  create(actionPlanId: string, input: TaskUpsertInput) {
    return this.http
      .post<TaskApiModel>(`${API.bff}/v1/action-plans/${actionPlanId}/tasks`, input)
      .pipe(map(mapTaskApiModel));
  }

  searchPaged(body: ListQueryDto<TasksAdvancedFilters>) {
    return this.http
      .post<HalPagedResponse<TaskWithActionPlanApiModel>>(`${this.baseUrl}/search`, body)
      .pipe(
        map((res) => {
          const content = mapTaskWithActionPlanApiModels(res?._embedded?.content);
          return {
            ...res,
            _embedded: {
              ...(res?._embedded ?? {}),
              content,
            },
          } as HalPagedResponse<TaskWithActionPlanModel>;
        }),
      );
  }

  findMine() {
    return this.http
      .get<TaskWithActionPlanApiModel[]>(`${this.baseUrl}/mine`)
      .pipe(map(mapTaskWithActionPlanApiModels));
  }

  getById(id: string) {
    return this.http.get<TaskApiModel>(`${this.baseUrl}/${id}`).pipe(map(mapTaskApiModel));
  }

  update(id: string, input: TaskUpsertInput) {
    return this.http.put<TaskApiModel>(`${this.baseUrl}/${id}`, input).pipe(map(mapTaskApiModel));
  }

  updateStatus(id: string, input: TaskStatusInput) {
    return this.http
      .put<TaskApiModel>(`${this.baseUrl}/${id}/status`, input)
      .pipe(map(mapTaskApiModel));
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { map } from 'rxjs/operators';

import { API } from '@core/api/api.config';
import {
  ProjectApiModel,
  ProjectUpsertInput,
  mapProjectApiModel,
  mapProjectApiModels,
} from '@models/projects.models';

@Injectable({ providedIn: 'root' })
export class ProjectsApiService {
  private readonly http = inject(HttpClient);
  private readonly projectsUrl = `${API.bff}/v1/projects`;

  findAll() {
    return this.http.get<ProjectApiModel[]>(this.projectsUrl).pipe(map(mapProjectApiModels));
  }

  getById(id: string) {
    return this.http.get<ProjectApiModel>(`${this.projectsUrl}/${id}`).pipe(map(mapProjectApiModel));
  }

  create(input: ProjectUpsertInput) {
    return this.http.post<ProjectApiModel>(this.projectsUrl, input).pipe(map(mapProjectApiModel));
  }

  update(id: string, input: ProjectUpsertInput) {
    return this.http.put<ProjectApiModel>(`${this.projectsUrl}/${id}`, input).pipe(map(mapProjectApiModel));
  }
}

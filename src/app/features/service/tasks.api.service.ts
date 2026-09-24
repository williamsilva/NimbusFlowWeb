import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { map } from 'rxjs/operators';

import { API } from '@core/api/api.config';
import { SKIP_GLOBAL_ERROR_TOAST } from '@core/interceptors/error.interceptor';
import { HalPagedResponse } from '@core/api/page.model';
import { ListQueryDto } from '@williamsilva/nimbus-web-commons';
import { TasksAdvancedFilters } from '@features/filter/tasks.filters';
import {
  TaskApiModel,
  TaskUpsertInput,
  TaskStatusInput,
  TaskAssigneeInput,
  TaskWithActionPlanModel,
  TaskWithActionPlanApiModel,
  mapTaskApiModel,
  mapTaskApiModels,
  mapTaskWithActionPlanApiModels,
} from '@models/tasks.models';
import { TaskActivityAnswerInput, TaskActivityApiModel, mapTaskActivityApiModel } from '@models/task-activities.models';

@Injectable({ providedIn: 'root' })
export class TasksApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API.bff}/v1/tasks`;

  findByActionPlan(actionPlanId: string) {
    return this.http
      .get<TaskApiModel[]>(`${API.bff}/v1/action-plans/${actionPlanId}/tasks`)
      .pipe(map(mapTaskApiModels));
  }

  /** SKIP_GLOBAL_ERROR_TOAST em todo método de escrita deste service (achado real 2026-09-24,
   *  ver error.interceptor.ts) - TasksCreateDialogComponent/AllTasksListComponent/TasksListComponent/
   *  TaskExecutionDialogComponent já mostram sua própria mensagem específica em cada `error:` de
   *  subscribe; sem este token, o interceptor global TAMBÉM mostrava um toast genérico
   *  ("Ocorreu um erro inesperado") pra qualquer erro não tratado (400/404/409/500), duplicando a
   *  notificação - reproduzido soltando uma tarefa no Kanban com atividade pendente. */
  create(actionPlanId: string, input: TaskUpsertInput) {
    return this.http
      .post<TaskApiModel>(`${API.bff}/v1/action-plans/${actionPlanId}/tasks`, input, {
        context: new HttpContext().set(SKIP_GLOBAL_ERROR_TOAST, true),
      })
      .pipe(map(mapTaskApiModel));
  }

  /** Tarefa avulsa (pedido do usuário 2026-09-21) - sem Plano de Ação; actionPlanId vai opcional
   *  dentro do próprio `input`, não como segmento de rota (ver TaskController#create no backend). */
  createStandalone(input: TaskUpsertInput) {
    return this.http
      .post<TaskApiModel>(this.baseUrl, input, { context: new HttpContext().set(SKIP_GLOBAL_ERROR_TOAST, true) })
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
    return this.http
      .put<TaskApiModel>(`${this.baseUrl}/${id}`, input, {
        context: new HttpContext().set(SKIP_GLOBAL_ERROR_TOAST, true),
      })
      .pipe(map(mapTaskApiModel));
  }

  updateStatus(id: string, input: TaskStatusInput) {
    return this.http
      .put<TaskApiModel>(`${this.baseUrl}/${id}/status`, input, {
        context: new HttpContext().set(SKIP_GLOBAL_ERROR_TOAST, true),
      })
      .pipe(map(mapTaskApiModel));
  }

  /** "Transferir" (pedido do usuário 2026-09-23) - ver TaskController#updateAssignee no backend. */
  updateAssignee(id: string, input: TaskAssigneeInput) {
    return this.http
      .put<TaskApiModel>(`${this.baseUrl}/${id}/assignee`, input, {
        context: new HttpContext().set(SKIP_GLOBAL_ERROR_TOAST, true),
      })
      .pipe(map(mapTaskApiModel));
  }

  /** Tela de execução (pedido do usuário 2026-09-23) - grava a resposta de UMA atividade, nunca a
   *  Tarefa inteira. Mesmo padrão multipart de TicketsApiService#close: uma part "data" (JSON) +
   *  uma part "file" opcional (só SIGNATURE/DOCUMENT/IMAGE mandam arquivo, ver
   *  TaskController#answerActivity no backend). */
  answerActivity(taskId: string, activityId: string, input: TaskActivityAnswerInput, file: File | null) {
    const formData = new FormData();
    formData.append('data', new Blob([JSON.stringify(input)], { type: 'application/json' }));
    if (file) {
      formData.append('file', file);
    }

    return this.http
      .put<TaskActivityApiModel>(`${this.baseUrl}/${taskId}/activities/${activityId}/answer`, formData, {
        context: new HttpContext().set(SKIP_GLOBAL_ERROR_TOAST, true),
      })
      .pipe(map(mapTaskActivityApiModel));
  }
}

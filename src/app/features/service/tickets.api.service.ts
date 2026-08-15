import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { map } from 'rxjs/operators';

import { API } from '@core/api/api.config';
import { HalPagedResponse } from '@core/api/page.model';
import { ListQueryDto } from '@shared/features/list-query/list-query.types';
import { TicketsAdvancedFilters } from '@features/filter/tickets.filters';
import {
  TicketModel,
  TicketApiModel,
  TicketCreateInput,
  TicketUpsertInput,
  TicketCloseInput,
  TicketWorkLinkInput,
  mapTicketApiModel,
  mapTicketApiModels,
} from '@models/tickets.models';

@Injectable({ providedIn: 'root' })
export class TicketsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API.bff}/v1/tickets`;

  searchPaged(body: ListQueryDto<TicketsAdvancedFilters>) {
    return this.http
      .post<HalPagedResponse<TicketApiModel>>(`${this.baseUrl}/search`, body)
      .pipe(
        map((res) => {
          const content = mapTicketApiModels(res?._embedded?.content);
          return {
            ...res,
            _embedded: {
              ...(res?._embedded ?? {}),
              content,
            },
          } as HalPagedResponse<TicketModel>;
        }),
      );
  }

  getById(id: string) {
    return this.http.get<TicketApiModel>(`${this.baseUrl}/${id}`).pipe(map(mapTicketApiModel));
  }

  /**
   * multipart/form-data com 2 parts: "data" (JSON de {title, description, type, priority,
   * targetType, targetUserId, targetDepartmentId}) e "attachment" (arquivo, opcional) - o backend
   * (TicketController) exige a part "data" mesmo sem anexo. Sem workId de propósito - nunca
   * definido na criação.
   */
  create(input: TicketCreateInput) {
    const formData = new FormData();
    formData.append(
      'data',
      new Blob(
        [
          JSON.stringify({
            title: input.title,
            description: input.description,
            type: input.type,
            priority: input.priority,
            targetType: input.targetType,
            targetUserId: input.targetUserId,
            targetDepartmentId: input.targetDepartmentId,
          }),
        ],
        { type: 'application/json' },
      ),
    );
    if (input.attachment) {
      formData.append('attachment', input.attachment);
    }

    return this.http.post<TicketApiModel>(this.baseUrl, formData).pipe(map(mapTicketApiModel));
  }

  update(id: string, input: TicketUpsertInput) {
    return this.http
      .put<TicketApiModel>(`${this.baseUrl}/${id}`, input)
      .pipe(map(mapTicketApiModel));
  }

  /** multipart/form-data com 2 parts: "data" (JSON de {resolutionNote}) e "photos" (0..n arquivos,
   *  galeria ou câmera - o backend não distingue a origem) - mesmo formato de MeasurementsApiService.submit. */
  close(id: string, input: TicketCloseInput) {
    const formData = new FormData();
    formData.append(
      'data',
      new Blob([JSON.stringify({ resolutionNote: input.resolutionNote })], { type: 'application/json' }),
    );
    input.photos.forEach((photo) => formData.append('photos', photo));

    return this.http
      .put<TicketApiModel>(`${this.baseUrl}/${id}/close`, formData)
      .pipe(map(mapTicketApiModel));
  }

  cancel(id: string) {
    return this.http
      .put<TicketApiModel>(`${this.baseUrl}/${id}/cancel`, {})
      .pipe(map(mapTicketApiModel));
  }

  /** "Abrir Frente de Serviço" a partir de um chamado já criado - sempre uma Frente recém-criada
   *  (TicketsListComponent#onWorkCreated chama logo depois de WorksCreateDialogComponent salvar). */
  linkWork(id: string, input: TicketWorkLinkInput) {
    return this.http
      .put<TicketApiModel>(`${this.baseUrl}/${id}/link-work`, input)
      .pipe(map(mapTicketApiModel));
  }
}

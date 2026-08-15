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
   * multipart/form-data com 2 parts: "data" (JSON de {title, description, type, priority}) e
   * "attachment" (arquivo, opcional) - o backend (TicketController) exige a part "data" mesmo sem
   * anexo. Sem workId de propósito - nunca definido na criação.
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

  close(id: string, input: TicketCloseInput) {
    return this.http
      .put<TicketApiModel>(`${this.baseUrl}/${id}/close`, input)
      .pipe(map(mapTicketApiModel));
  }

  cancel(id: string) {
    return this.http
      .put<TicketApiModel>(`${this.baseUrl}/${id}/cancel`, {})
      .pipe(map(mapTicketApiModel));
  }

  /** "Abrir Frente de Serviço" a partir de um chamado já criado - existente ou recém-criada
   *  (o frontend decide antes de chamar isto, ver TicketsLinkWorkDialogComponent). */
  linkWork(id: string, input: TicketWorkLinkInput) {
    return this.http
      .put<TicketApiModel>(`${this.baseUrl}/${id}/link-work`, input)
      .pipe(map(mapTicketApiModel));
  }
}

import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { map } from 'rxjs/operators';

import { API } from '@core/api/api.config';
import { SKIP_GLOBAL_ERROR_TOAST } from '@core/interceptors/error.interceptor';
import { HalPagedResponse } from '@core/api/page.model';
import { ListQueryDto } from '@williamsilva/nimbus-web-commons';
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
   * definido na criação. Chamador (tickets-create-dialog) já mostra a mensagem específica
   * (tickets.form.saveError) - SKIP_GLOBAL_ERROR_TOAST evita o toast genérico duplicado do
   * error.interceptor (achado real 2026-09-11, mesmo padrão já usado em works.api.service.ts).
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

    return this.http
      .post<TicketApiModel>(this.baseUrl, formData, {
        context: new HttpContext().set(SKIP_GLOBAL_ERROR_TOAST, true),
      })
      .pipe(map(mapTicketApiModel));
  }

  /** Chamador (tickets-edit-dialog) já mostra tickets.form.saveError - ver comentário de create(). */
  update(id: string, input: TicketUpsertInput) {
    return this.http
      .put<TicketApiModel>(`${this.baseUrl}/${id}`, input, {
        context: new HttpContext().set(SKIP_GLOBAL_ERROR_TOAST, true),
      })
      .pipe(map(mapTicketApiModel));
  }

  /** multipart/form-data com 2 parts: "data" (JSON de {resolutionNote}) e "photos" (0..n arquivos,
   *  galeria ou câmera - o backend não distingue a origem) - mesmo formato de
   *  MeasurementsApiService.submit. Chamador (tickets-close-dialog) já mostra
   *  tickets.status.closeError - ver comentário de create(). */
  close(id: string, input: TicketCloseInput) {
    const formData = new FormData();
    formData.append(
      'data',
      new Blob([JSON.stringify({ resolutionNote: input.resolutionNote })], { type: 'application/json' }),
    );
    input.photos.forEach((photo) => formData.append('photos', photo));

    return this.http
      .put<TicketApiModel>(`${this.baseUrl}/${id}/close`, formData, {
        context: new HttpContext().set(SKIP_GLOBAL_ERROR_TOAST, true),
      })
      .pipe(map(mapTicketApiModel));
  }

  /** Chamador (TicketsListComponent#confirmCancel) já mostra tickets.status.cancelError - ver
   *  comentário de create(). */
  cancel(id: string) {
    return this.http
      .put<TicketApiModel>(`${this.baseUrl}/${id}/cancel`, {}, {
        context: new HttpContext().set(SKIP_GLOBAL_ERROR_TOAST, true),
      })
      .pipe(map(mapTicketApiModel));
  }

  /** "Abrir Frente de Serviço" a partir de um chamado já criado - sempre uma Frente recém-criada
   *  (TicketsListComponent#onWorkCreated chama logo depois de WorksCreateDialogComponent salvar).
   *  Chamador já mostra tickets.action.workLinkError - ver comentário de create(). */
  linkWork(id: string, input: TicketWorkLinkInput) {
    return this.http
      .put<TicketApiModel>(`${this.baseUrl}/${id}/link-work`, input, {
        context: new HttpContext().set(SKIP_GLOBAL_ERROR_TOAST, true),
      })
      .pipe(map(mapTicketApiModel));
  }

  /** "Desfazer Frente de Serviço" - solta o vínculo (workId volta a null) e exclui a Work criada
   *  junto, se ela ainda estiver vazia (ver TicketService.unlinkWork no backend). Chamador
   *  (TicketsListComponent#confirmUnlinkWork) já mostra tickets.unlinkWorkConfirm.error com o
   *  motivo exato (Frente já tem aditivo/medição/pagamento) - ver comentário de create(); achado
   *  real 2026-09-11 (toast duplicado: o genérico E o específico apareciam juntos). */
  unlinkWork(id: string) {
    return this.http
      .put<TicketApiModel>(`${this.baseUrl}/${id}/unlink-work`, {}, {
        context: new HttpContext().set(SKIP_GLOBAL_ERROR_TOAST, true),
      })
      .pipe(map(mapTicketApiModel));
  }
}

import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { map } from 'rxjs/operators';

import { API } from '@core/api/api.config';
import { SKIP_GLOBAL_ERROR_TOAST } from '@core/interceptors/error.interceptor';
import { HalPagedResponse } from '@core/api/page.model';
import { ListQueryDto } from '@shared/features/list-query/list-query.types';
import { PaymentsAdvancedFilters } from '@features/filter/payments.filters';
import { PaymentApiModel, PaymentModel, mapPaymentApiModel, mapPaymentApiModels } from '@models/payments.models';

/** Pagamento (envio consolidado de N Ordens de Pagamento) - tela "Pagamentos". */
@Injectable({ providedIn: 'root' })
export class PaymentsApiService {
  private readonly http = inject(HttpClient);
  private readonly installmentsUrl = `${API.bff}/v1/installments`;

  searchPaged(body: ListQueryDto<PaymentsAdvancedFilters>) {
    return this.http
      .post<HalPagedResponse<PaymentApiModel>>(`${this.installmentsUrl}/search`, body)
      .pipe(
        map((res) => {
          const content = mapPaymentApiModels(res?._embedded?.content);
          return {
            ...res,
            _embedded: { ...(res?._embedded ?? {}), content },
          } as HalPagedResponse<PaymentModel>;
        }),
      );
  }

  /** @param paidAt data em que o pagamento efetivamente ocorreu (formato yyyy-MM-dd) - informada
   *  por quem confirma o pagamento, não é "agora" (ver WorkAutoCompleteService no backend, que
   *  usa essa data pra contar a carência de conclusão automática da Frente). */
  markPaid(id: string, paidAt: string) {
    return this.http
      .post<PaymentApiModel>(
        `${this.installmentsUrl}/${id}/mark-paid`,
        { paidAt },
        { context: new HttpContext().set(SKIP_GLOBAL_ERROR_TOAST, true) },
      )
      .pipe(map(mapPaymentApiModel));
  }

  /** Reenvia o e-mail com o PDF consolidado (mesmo conteúdo enviado no ato de "Enviar Ordem de
   *  Pagamento") - SKIP_GLOBAL_ERROR_TOAST pelo mesmo motivo de markPaid (o componente já mostra
   *  a mensagem específica do backend, ex.: "nenhum destinatário configurado"). */
  resendNotification(id: string) {
    return this.http
      .post<PaymentApiModel>(
        `${this.installmentsUrl}/${id}/resend-notification`,
        {},
        { context: new HttpContext().set(SKIP_GLOBAL_ERROR_TOAST, true) },
      )
      .pipe(map(mapPaymentApiModel));
  }

  /** Desfaz markAsPaid - volta o Pagamento de PAID pra SENT. */
  undoMarkPaid(id: string) {
    return this.http
      .post<PaymentApiModel>(
        `${this.installmentsUrl}/${id}/undo-mark-paid`,
        {},
        { context: new HttpContext().set(SKIP_GLOBAL_ERROR_TOAST, true) },
      )
      .pipe(map(mapPaymentApiModel));
  }

  /** Desfaz o envio - dissolve o Pagamento (cada Ordem incluída volta pra MEASUREMENT_APPROVED,
   *  ver InstallmentService.undoSend). Sem corpo de resposta - o Pagamento deixa de existir. */
  undoSend(id: string) {
    return this.http.post<void>(
      `${this.installmentsUrl}/${id}/undo-send`,
      {},
      { context: new HttpContext().set(SKIP_GLOBAL_ERROR_TOAST, true) },
    );
  }
}

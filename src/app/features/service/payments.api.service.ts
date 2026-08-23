import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { map } from 'rxjs/operators';

import { API } from '@core/api/api.config';
import { SKIP_GLOBAL_ERROR_TOAST } from '@core/interceptors/error.interceptor';
import { PaymentModel, mapPaymentApiModel, mapPaymentApiModels } from '@models/payments.models';

/** Pagamento (envio consolidado de N Ordens de Pagamento) - tela "Pagamentos". Sem paginação de
 *  propósito (mesmo espírito de PaymentOrdersApiService.findReleasedBySupplier: volume esperado
 *  pequeno). */
@Injectable({ providedIn: 'root' })
export class PaymentsApiService {
  private readonly http = inject(HttpClient);
  private readonly installmentsUrl = `${API.bff}/v1/installments`;

  findAll() {
    return this.http.get<PaymentModel[]>(this.installmentsUrl).pipe(map(mapPaymentApiModels));
  }

  /** @param paidAt data em que o pagamento efetivamente ocorreu (formato yyyy-MM-dd) - informada
   *  por quem confirma o pagamento, não é "agora" (ver WorkAutoCompleteService no backend, que
   *  usa essa data pra contar a carência de conclusão automática da Frente). */
  markPaid(id: string, paidAt: string) {
    return this.http
      .post<PaymentModel>(
        `${this.installmentsUrl}/${id}/mark-paid`,
        { paidAt },
        { context: new HttpContext().set(SKIP_GLOBAL_ERROR_TOAST, true) },
      )
      .pipe(map(mapPaymentApiModel));
  }
}

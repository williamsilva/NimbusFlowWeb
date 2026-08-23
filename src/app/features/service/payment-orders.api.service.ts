import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { API } from '@core/api/api.config';
import { SKIP_GLOBAL_ERROR_TOAST } from '@core/interceptors/error.interceptor';
import { PaymentOrderCandidateModel, SendPaymentOrderResultModel } from '@models/payment-orders.models';

@Injectable({ providedIn: 'root' })
export class PaymentOrdersApiService {
  private readonly http = inject(HttpClient);
  private readonly paymentOrdersUrl = `${API.bff}/v1/payment-orders`;
  private readonly installmentsUrl = `${API.bff}/v1/installments`;

  /** Ordens RELEASED do fornecedor, através de TODAS as obras/projetos dele, ainda não incluídas
   *  em nenhum envio - candidatas a entrar no Pagamento que o usuário está montando. */
  findReleasedBySupplier(supplierId: string) {
    return this.http.get<PaymentOrderCandidateModel[]>(`${this.paymentOrdersUrl}/by-supplier/${supplierId}`);
  }

  /** SKIP_GLOBAL_ERROR_TOAST: o componente já mostra a mensagem específica do backend (ver
   *  translateWorksErrorDetail) pros casos esperados (sem destinatário configurado, ordem não
   *  está mais liberada etc.) - sem isso, o error.interceptor mostraria um segundo toast genérico
   *  por cima (com.nimbusflow.* nunca usa o envelope que ErrorMapperService entende). */
  sendPaymentOrder(paymentOrderIds: string[]) {
    return this.http.post<SendPaymentOrderResultModel>(
      `${this.installmentsUrl}/send`,
      { paymentOrderIds },
      { context: new HttpContext().set(SKIP_GLOBAL_ERROR_TOAST, true) },
    );
  }
}

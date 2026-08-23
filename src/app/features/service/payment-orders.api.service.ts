import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { API } from '@core/api/api.config';
import { SKIP_GLOBAL_ERROR_TOAST } from '@core/interceptors/error.interceptor';
import { PaymentOrderCandidateModel, SendPaymentOrderResultModel } from '@models/payment-orders.models';

@Injectable({ providedIn: 'root' })
export class PaymentOrdersApiService {
  private readonly http = inject(HttpClient);
  private readonly installmentsUrl = `${API.bff}/v1/installments`;

  /** Parcelas RELEASED do fornecedor, através de TODAS as obras/projetos dele - candidatas a
   *  entrar na Ordem de Pagamento que o usuário está montando. */
  findReleasedBySupplier(supplierId: string) {
    return this.http.get<PaymentOrderCandidateModel[]>(`${this.installmentsUrl}/by-supplier/${supplierId}`);
  }

  /** SKIP_GLOBAL_ERROR_TOAST: o componente já mostra a mensagem específica do backend (ver
   *  translateWorksErrorDetail) pros casos esperados (sem destinatário configurado, parcela não
   *  está mais liberada etc.) - sem isso, o error.interceptor mostraria um segundo toast genérico
   *  por cima (com.nimbusflow.* nunca usa o envelope que ErrorMapperService entende). */
  sendPaymentOrder(installmentIds: string[]) {
    return this.http.post<SendPaymentOrderResultModel>(
      `${this.installmentsUrl}/payment-orders`,
      { installmentIds },
      { context: new HttpContext().set(SKIP_GLOBAL_ERROR_TOAST, true) },
    );
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { Observable, catchError, map, of } from 'rxjs';

import { onlyDigits } from '@shared/utils/br-format';

export interface CepAddress {
  street: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
}

interface ViaCepResponse {
  erro?: boolean;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
}

/**
 * Busca de endereço por CEP via ViaCEP (https://viacep.com.br) - API pública brasileira, sem
 * chave/autenticação. Chamada direto do navegador, fora do BFF: não é dado do NimbusFlow, não
 * precisa de sessão/cookie/CSRF, e os interceptors de credentials/csrf só atuam em URLs do
 * próprio bff/api (ver isCardsync() em credentials.interceptor.ts/csrf.interceptor.ts), então essa
 * chamada passa por eles sem nenhum header extra.
 *
 * CEP inexistente volta HTTP 200 com `{ erro: true }` (não é uma resposta de erro) - resolve pra
 * `null` como qualquer outro "não encontrado". Só uma falha de rede real (ViaCEP fora do ar, sem
 * conectividade) cai no catchError, também resolvendo pra `null` - quem chama trata os dois casos
 * da mesma forma (endereço não veio, preenche manualmente).
 */
@Injectable({ providedIn: 'root' })
export class CepLookupService {
  private readonly http = inject(HttpClient);

  lookup(zipCode: string): Observable<CepAddress | null> {
    const digits = onlyDigits(zipCode);
    if (digits.length !== 8) {
      return of(null);
    }

    return this.http.get<ViaCepResponse>(`https://viacep.com.br/ws/${digits}/json/`).pipe(
      map((res) => {
        if (!res || res.erro) {
          return null;
        }
        return {
          street: res.logradouro || null,
          neighborhood: res.bairro || null,
          city: res.localidade || null,
          state: res.uf || null,
        };
      }),
      catchError(() => of(null)),
    );
  }
}

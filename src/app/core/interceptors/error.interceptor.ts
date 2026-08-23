import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';

import { catchError, throwError } from 'rxjs';

import { ToastService } from '../toast/toast.service';
import { AuthService } from '../auth/auth.service';
import { ErrorMapperService } from '../errors/error-mapper.service';
import { isAutoReloginCandidate, isCardsync } from './auth-redirect.interceptor';

/**
 * Passe `{ context: new HttpContext().set(SKIP_GLOBAL_ERROR_TOAST, true) }` nas options de uma
 * chamada HTTP cujo chamador já mostra seu próprio toast traduzido (ver translateWorksErrorDetail
 * em works-error.util.ts) - sem isso, este interceptor TAMBÉM mostra um toast genérico pra
 * qualquer status não tratado abaixo (404/409/500/400 sem fieldErrors), duplicando a notificação.
 * com.nimbusflow.* nunca usa o envelope userMessage/code que ErrorMapperService entende (só
 * ResponseStatusException puro, ver ApiExceptionHandler no backend), então o toast genérico daqui
 * nunca tem nada de útil pra mostrar nesses casos - só use este token em chamadas cujo componente
 * já trata a mensagem específica; não use como atalho geral, senão erros de módulos sem
 * tratamento próprio (tickets/planos de ação/tarefas/patrimônio) ficariam silenciosos.
 */
export const SKIP_GLOBAL_ERROR_TOAST = new HttpContextToken<boolean>(() => false);

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);
  const mapper = inject(ErrorMapperService);

  // Chamada externa fora do BFF/API próprio (ex.: CepLookupService -> viacep.com.br) não passa
  // por nenhum tratamento genérico daqui - o toast de "Não foi possível conectar ao servidor"
  // duplicava a mensagem própria de quem chamou (ex.: "CEP não encontrado"), mesmo com o CSP já
  // liberando o domínio (CSP bloqueado ou host de terceiro fora do ar também caem aqui como
  // status 0 - o chamador já trata isso, não precisa de um segundo toast genérico).
  if (!isCardsync(req.url)) {
    return next(req);
  }

  return next(req).pipe(
    catchError((e) => {
      const err = e as HttpErrorResponse;

      if (err?.status === 0) {
        toast.error(mapper.titleForStatus(0), mapper.message({ code: 'NETWORK_ERROR' }), 5000, {
          context: 'system',
        });
        return throwError(() => err);
      }

      const apiError = mapper.normalize(err);

      if (err.status === 401) {
        // Se o auth-redirect.interceptor vai relogar automaticamente por causa deste erro, não
        // mostra o toast - evita um erro vermelho piscando na tela um instante antes do redirect
        // silencioso completar (ver isAutoReloginCandidate).
        const willAutoRelogin = isAutoReloginCandidate(err, req, router, auth);

        if (!willAutoRelogin && !req.url.includes('/bff/me') && !req.url.includes('/bff/login/prepare')) {
          toast.warn(
            mapper.titleForStatus(401),
            mapper.message({ code: 'SESSION_EXPIRED', ...apiError }),
            5000,
            {
              context: 'login',
              correlationId: apiError.correlationId,
            },
          );
        }

        return throwError(() => err);
      }

      if (err.status === 403) {
        toast.warn(
          mapper.titleForStatus(403),
          mapper.message({ code: 'ACCESS_DENIED', ...apiError }),
          5000,
          {
            context: 'security',
            correlationId: apiError.correlationId,
          },
        );

        router.navigateByUrl('/forbidden', {
          state: { correlationId: apiError.correlationId },
        });

        return throwError(() => err);
      }

      if (err.status === 400 && (apiError.fieldErrors?.length ?? 0) > 0) {
        return throwError(() => err);
      }

      if (!req.context.get(SKIP_GLOBAL_ERROR_TOAST)) {
        toast.error(mapper.titleForStatus(err.status), mapper.message(apiError), 6000, {
          context: 'system',
          correlationId: apiError.correlationId,
        });
      }

      return throwError(() => err);
    }),
  );
};

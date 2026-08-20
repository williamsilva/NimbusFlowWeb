import {
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError } from 'rxjs';

import { API } from '../api/api.config';
import { AuthService } from '../auth/auth.service';
import { SessionService } from '../auth/session.service';

/** Exportada pro errorInterceptor também usar (ver seu import) - chamada externa fora do BFF/API
 *  próprio (ex.: CepLookupService -> viacep.com.br) não deve passar pelo tratamento de erro
 *  genérico daqui, só pelo catchError próprio de quem chamou. */
export function isCardsync(url: string): boolean {
  if (url.startsWith(API.bffBaseUrl) || url.startsWith(API.apiBaseUrl)) return true;
  return url.startsWith('/bff/') || url === '/bff' || url.startsWith('/api/') || url === '/api';
}

function isPublicSpaRoute(path: string): boolean {
  return path.startsWith('/public') || path.startsWith('/error');
}

/**
 * Mesma decisão usada abaixo pra disparar o re-login automático, exposta pro errorInterceptor
 * poder suprimir o toast de 401/403 nesses casos (sem isso, o usuário vê um erro vermelho piscar
 * na tela um instante antes do redirect silencioso completar). Não inclui a checagem de
 * canTriggerLoginNow() (rate limit entre abas) de propósito - essa função só responde "esse
 * erro normalmente levaria a um relogin automático", não "o redirect vai disparar agora mesmo
 * nesta aba".
 */
export function isAutoReloginCandidate(
  err: HttpErrorResponse,
  req: HttpRequest<unknown>,
  router: Router,
  auth: AuthService,
): boolean {
  if (!isCardsync(req.url)) return false;
  if (err.status !== 401 && err.status !== 403) return false;

  const currentPath = router.url || '/';
  if (isPublicSpaRoute(currentPath)) return false;

  // 403 com sessão válida = sem permissão; não deve relogar
  if (err.status === 403 && auth.isAuthenticated()) return false;

  const ignored =
    req.url.includes('/bff/me') ||
    req.url.includes('/bff/csrf') ||
    req.url.includes('/bff/logout') ||
    req.url.includes('/bff/login/prepare');

  return !ignored;
}

/**
 * localStorage (não sessionStorage) - o lock precisa valer entre abas/janelas diferentes da
 * mesma origem, não só dentro da aba atual. Com múltiplas abas abertas, cada uma tem sua própria
 * sessionStorage isolada: a aba A detectava 401 e redirecionava (migrando o ID da sessão via
 * sessionFixation.migrateSession() no backend), enquanto a aba B - sem ver o lock da aba A -
 * disparava seu PRÓPRIO redirect concorrente, brigando pela mesma sessão/cookie e produzindo
 * "invalid session id" mesmo com a sessão HTTP ainda longe do timeout configurado (mesmo bug
 * encontrado e corrigido no CardSyncWeb). 15s (não 3s) para cobrir o round-trip completo do
 * redirect OAuth2 (BFF -> NimbusAuth -> BFF).
 */
function canTriggerLoginNow(): boolean {
  const key = 'nf_login_redirect_lock';
  const now = Date.now();
  const last = Number(localStorage.getItem(key) ?? '0');

  if (now - last < 15000) return false;

  localStorage.setItem(key, String(now));
  return true;
}

export const authRedirectInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const session = inject(SessionService);

  if (!isCardsync(req.url)) return next(req);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse)) {
        return throwError(() => err);
      }

      if (!isAutoReloginCandidate(err, req, router, auth)) {
        return throwError(() => err);
      }

      const currentPath = router.url || '/';
      session.stop();

      if (!canTriggerLoginNow()) {
        return throwError(() => err);
      }

      return from(auth.startLogin(currentPath)).pipe(switchMap(() => throwError(() => err)));
    }),
  );
};

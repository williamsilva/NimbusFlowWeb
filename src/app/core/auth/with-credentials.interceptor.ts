import { HttpInterceptorFn } from '@angular/common/http';

import { environment } from '../../../environments/environment';

const XSRF_COOKIE_NAME = 'XSRF-TOKEN';
const XSRF_HEADER_NAME = 'X-XSRF-TOKEN';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS', 'TRACE']);

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Cookie de sessão do BFF é cross-port (frontend :4201, backend :9092) — precisa ir em toda
 * chamada, daí o withCredentials.
 *
 * O interceptor de XSRF nativo do Angular (withXsrfConfiguration em app.config.ts) por design
 * NUNCA anexa o header X-XSRF-TOKEN em URLs absolutas (só em relativas, assumindo mesma origem) —
 * e aqui environment.apiUrl é sempre absoluto (front e back em portas/origens diferentes). Sem
 * esse header em todo POST/PUT/DELETE, o backend rejeita com 403 (CsrfFilter) - por isso o
 * withXsrfConfiguration do app.config.ts é efetivamente um no-op e o token precisa ser lido do
 * cookie e anexado manualmente aqui.
 */
export const withCredentialsInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  let cloned = req.clone({ withCredentials: true });

  if (!SAFE_METHODS.has(cloned.method) && !cloned.headers.has(XSRF_HEADER_NAME)) {
    const token = readCookie(XSRF_COOKIE_NAME);
    if (token) {
      cloned = cloned.clone({ headers: cloned.headers.set(XSRF_HEADER_NAME, token) });
    }
  }

  return next(cloned);
};

import { HttpInterceptorFn } from '@angular/common/http';

import { API } from './api.config';

function isCardsync(url: string): boolean {
  // absolutas
  if (url.startsWith(API.bffBaseUrl) || url.startsWith(API.apiBaseUrl)) return true;

  // relativas
  return url.startsWith('/bff/') || url === '/bff' || url.startsWith('/api/') || url === '/api';
}

export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isCardsync(req.url)) return next(req);

  // Marca como chamada do SPA (ajuda o backend a responder 401/403 JSON sem redirect)
  return next(
    req.clone({
      withCredentials: true,
      setHeaders: {
        'X-Requested-With': 'fetch',
      },
    }),
  );
};

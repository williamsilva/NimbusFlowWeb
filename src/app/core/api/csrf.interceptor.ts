import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';

import { from, switchMap } from 'rxjs';

import { API } from './api.config';
import { CsrfService } from './csrf.service';

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function isCardsync(url: string): boolean {
  if (url.startsWith(API.bffBaseUrl) || url.startsWith(API.apiBaseUrl)) return true;
  return url.startsWith('/bff/') || url === '/bff' || url.startsWith('/api/') || url === '/api';
}

export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  const csrf = inject(CsrfService);

  const method = req.method.toUpperCase();
  if (!MUTATING.has(method) || !isCardsync(req.url)) {
    return next(req);
  }

  const attach = (token: string) => {
    const nextReq = req.clone({
      headers: req.headers.set('X-XSRF-TOKEN', token),
      withCredentials: true,
    });
    return nextReq;
  };

  const existing = csrf.getXsrfTokenFromCookie();
  if (existing) {
    return next(attach(existing));
  }

  return from(csrf.ensureCsrfCookie()).pipe(
    switchMap(() => {
      const token = csrf.getXsrfTokenFromCookie();

      if (!token) return next(req);
      return next(attach(token));
    }),
  );
};

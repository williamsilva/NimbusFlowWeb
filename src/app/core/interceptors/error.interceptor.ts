import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';

import { catchError, throwError } from 'rxjs';

import { ToastService } from '../toast/toast.service';
import { ErrorMapperService } from '../errors/error-mapper.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const toast = inject(ToastService);
  const mapper = inject(ErrorMapperService);

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
        if (!req.url.includes('/bff/me') && !req.url.includes('/bff/login/prepare')) {
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

      toast.error(mapper.titleForStatus(err.status), mapper.message(apiError), 6000, {
        context: 'system',
        correlationId: apiError.correlationId,
      });

      return throwError(() => err);
    }),
  );
};

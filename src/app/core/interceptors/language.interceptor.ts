import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';

import { I18nService } from '../i18n/i18n.service';

export const languageInterceptor: HttpInterceptorFn = (req, next) => {
  const i18n = inject(I18nService);

  return next(
    req.clone({
      setHeaders: {
        'Accept-Language': i18n.getLocale(),
      },
    }),
  );
};

import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';

import { I18nService } from './i18n.service';

/**
 * Mesmo padrão do CardSyncWeb - anexa Accept-Language em toda chamada, preparado pra quando/se o
 * backend passar a localizar mensagens de erro (hoje o NimbusFlowServer não tem esse catálogo).
 */
export const languageInterceptor: HttpInterceptorFn = (req, next) => {
  const i18n = inject(I18nService);

  return next(
    req.clone({
      setHeaders: { 'Accept-Language': i18n.getLocale() },
    }),
  );
};

import { APP_INITIALIZER, ApplicationConfig, provideZoneChangeDetection, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { provideTranslateService } from '@ngx-translate/core';

import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { withCredentialsInterceptor } from './core/auth/with-credentials.interceptor';
import { AssetsTranslateLoader } from './core/i18n/assets-translate.loader';
import { I18nService } from './core/i18n/i18n.service';
import { languageInterceptor } from './core/i18n/language.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    // withXsrfConfiguration (nativo do Angular) nao entra aqui: o Angular nunca anexa o header em
    // URLs absolutas (so relativas, assumindo mesma origem) - como environment.apiUrl e sempre
    // absoluto (front/back em origens diferentes), seria um no-op. O token e lido do cookie
    // XSRF-TOKEN e anexado manualmente em withCredentialsInterceptor.
    provideHttpClient(withInterceptors([withCredentialsInterceptor, languageInterceptor])),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    provideAnimationsAsync(),
    // Dashboard (Fase 6): gráficos via ng2-charts/Chart.js.
    provideCharts(withDefaultRegisterables()),
    // i18n (mesmo padrão do CardSyncWeb: ngx-translate + loader próprio via /assets/i18n/*.json).
    // @ngx-translate/core 18 não tem mais TranslateModule.forRoot() (API 100% standalone agora,
    // diferente da v17 usada no CardSyncWeb) - provideTranslateService() é o equivalente atual.
    provideTranslateService({ loader: AssetsTranslateLoader, fallbackLang: 'pt-BR' }),
    // Angular 18 ainda não tem provideAppInitializer() (chegou na v19) - usa o token clássico.
    {
      provide: APP_INITIALIZER,
      useFactory: (i18n: I18nService) => () => i18n.init(),
      deps: [I18nService],
      multi: true,
    },
  ],
};

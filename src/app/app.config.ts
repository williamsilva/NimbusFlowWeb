import { ApplicationConfig, provideAppInitializer, provideZoneChangeDetection, inject, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { provideTranslateService } from '@ngx-translate/core';
import { MESSAGE_FORMAT_CONFIG, TranslateMessageFormatCompiler } from 'ngx-translate-messageformat-compiler';
import { providePrimeNG } from 'primeng/config';
import { MessageService, ConfirmationService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import Lara from '@primeng/themes/lara';

import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';
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
    provideAnimations(),
    // Dashboard (Fase 6): gráficos via ng2-charts/Chart.js.
    provideCharts(withDefaultRegisterables()),
    // PrimeNG (migração Material -> PrimeNG): mesmo preset/tema do CardSyncWeb (Lara, dark mode via
    // classe .dark, já era assim no ThemeService antes até pro Material).
    providePrimeNG({
      theme: {
        preset: Lara,
        options: { darkModeSelector: '.dark' },
      },
    }),
    MessageService,
    ConfirmationService,
    DialogService,
    // i18n (mesmo padrão do CardSyncWeb: ngx-translate + loader próprio via /assets/i18n/*.json).
    // @ngx-translate/core 18 não tem mais TranslateModule.forRoot() (API 100% standalone agora,
    // diferente da v17 usada no CardSyncWeb) - provideTranslateService() é o equivalente atual.
    // compiler: TranslateMessageFormatCompiler troca a interpolação padrão ({{param}}) por ICU real
    // ({param}, plural/select) - mesmo compilador do CardSyncWeb, substitui o hack local
    // core/i18n/icu-plural.ts (removido nesta migração).
    provideTranslateService({
      loader: AssetsTranslateLoader,
      compiler: TranslateMessageFormatCompiler,
      fallbackLang: 'pt-BR',
    }),
    { provide: MESSAGE_FORMAT_CONFIG, useValue: { throwOnError: true, strictPluralKeys: true } },
    provideAppInitializer(() => inject(I18nService).init()),
  ],
};

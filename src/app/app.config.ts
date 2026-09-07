import { importProvidersFrom, inject, isDevMode } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideServiceWorker } from '@angular/service-worker';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, TitleStrategy, withInMemoryScrolling } from '@angular/router';
import {
  ApplicationConfig,
  provideAppInitializer,
  provideZoneChangeDetection,
} from '@angular/core';

import { NIMBUS_THEME_CONFIG } from '@williamsilva/nimbus-web-commons';

import Lara from '@primeng/themes/lara';
import { providePrimeNG } from 'primeng/config';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TranslateCompiler, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import {
  MESSAGE_FORMAT_CONFIG,
  TranslateMessageFormatCompiler,
} from 'ngx-translate-messageformat-compiler';

import { appRoutes } from './app.routes';
import { I18nService } from './core/i18n/i18n.service';
import { AppUpdateService } from './core/pwa/app-update.service';
import { csrfInterceptor } from './core/api/csrf.interceptor';
import { AppTitleStrategy } from './core/router/app-title.strategy';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { AssetsTranslateLoader } from './core/i18n/assets-translate.loader';
import { credentialsInterceptor } from './core/api/credentials.interceptor';
import { languageInterceptor } from './core/interceptors/language.interceptor';
import { authRedirectInterceptor } from './core/interceptors/auth-redirect.interceptor';
import { timezoneStrictInterceptor } from './core/interceptors/timezone-audit.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),

    // appId igual ao valor já hardcoded antes da extração pra @williamsilva/nimbus-web-commons -
    // preserva a mesma chave de localStorage ("nimbusflow.theme"), senão quem já tinha escolhido
    // dark mode nesse navegador voltaria a ver light na próxima visita.
    { provide: NIMBUS_THEME_CONFIG, useValue: { appId: 'nimbusflow' } },

    provideRouter(
      appRoutes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled',
      }),
    ),

    {
      provide: TitleStrategy,
      useClass: AppTitleStrategy,
    },

    provideHttpClient(
      withInterceptors([
        credentialsInterceptor,
        csrfInterceptor,
        languageInterceptor,
        errorInterceptor,
        timezoneStrictInterceptor,
        authRedirectInterceptor,
      ]),
    ),

    providePrimeNG({
      theme: {
        preset: Lara,
        options: {
          darkModeSelector: '.dark',
          cssLayer: { name: 'primeng', order: 'primeng' },
        },
      },
    }),

    importProvidersFrom(
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useClass: AssetsTranslateLoader,
        },
        compiler: {
          provide: TranslateCompiler,
          useClass: TranslateMessageFormatCompiler,
        },
        isolate: false,
      }),
    ),

    {
      provide: MESSAGE_FORMAT_CONFIG,
      useValue: {
        throwOnError: true,
        strictPluralKeys: true,
      },
    },

    provideAnimations(),

    provideAppInitializer(() => inject(I18nService).init()),
    provideAppInitializer(() => inject(AppUpdateService).init()),

    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),

    MessageService,
    ConfirmationService,
  ],
};

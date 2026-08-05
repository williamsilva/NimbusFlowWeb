import { ApplicationConfig, provideZoneChangeDetection, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { withCredentialsInterceptor } from './core/auth/with-credentials.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    // withXsrfConfiguration (nativo do Angular) nao entra aqui: o Angular nunca anexa o header em
    // URLs absolutas (so relativas, assumindo mesma origem) - como environment.apiUrl e sempre
    // absoluto (front/back em origens diferentes), seria um no-op. O token e lido do cookie
    // XSRF-TOKEN e anexado manualmente em withCredentialsInterceptor.
    provideHttpClient(withInterceptors([withCredentialsInterceptor])),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    provideAnimationsAsync(),
    // Dashboard (Fase 6): gráficos via ng2-charts/Chart.js.
    provideCharts(withDefaultRegisterables()),
  ],
};

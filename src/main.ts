import 'zone.js';

import { registerLocaleData } from '@angular/common';
import { bootstrapApplication } from '@angular/platform-browser';

import localePt from '@angular/common/locales/pt';
import localeEs from '@angular/common/locales/es';

import { App } from './app/app';
import { appConfig } from './app/app.config';
import { ThemeService } from './app/core/theme/theme.service';

// ✅ registra data/number formats
registerLocaleData(localePt, 'pt-BR');
registerLocaleData(localeEs, 'es-ES');

bootstrapApplication(App, appConfig)
  .then((appRef) => {
    appRef.injector.get(ThemeService).init();
  })
  .catch((err) => console.error(err));

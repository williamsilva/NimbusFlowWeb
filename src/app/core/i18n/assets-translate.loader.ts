import { HttpBackend, HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { Observable, of } from 'rxjs';
import { catchError, shareReplay } from 'rxjs/operators';
import type { TranslateLoader, TranslationObject } from '@ngx-translate/core';

import type { Lang } from './i18n.types';

/** Mesmo padrão do CardSyncWeb - HttpClient sem interceptors (evita recursão: o próprio
 * languageInterceptor depende do I18nService, que carrega via este loader). */
@Injectable()
export class AssetsTranslateLoader implements TranslateLoader {
  private readonly http = new HttpClient(inject(HttpBackend));
  private readonly cache = new Map<Lang, Observable<TranslationObject>>();

  getTranslation(lang: string): Observable<TranslationObject> {
    const safeLang = this.toSafeLang(lang);

    const cached = this.cache.get(safeLang);
    if (cached) return cached;

    // Arquivos ficam em public/i18n/ (não src/assets/) - convenção do Angular 17+ usada neste
    // projeto (ver angular.json "assets": [{ input: "public" }]) - public/* mapeia pra raiz do
    // site, sem prefixo /assets.
    const req$ = this.http.get<TranslationObject>(`/i18n/${safeLang}.json`).pipe(
      shareReplay({ bufferSize: 1, refCount: false }),
      catchError(() => (safeLang === 'pt-BR' ? of({}) : this.getTranslation('pt-BR'))),
    );

    this.cache.set(safeLang, req$);
    return req$;
  }

  private toSafeLang(lang: string): Lang {
    const v = (lang ?? '').trim();
    return v === 'en' || v === 'es' || v === 'pt-BR' ? (v as Lang) : 'pt-BR';
  }
}

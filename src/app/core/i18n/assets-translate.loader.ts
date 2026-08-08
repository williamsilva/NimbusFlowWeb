import { Injectable, inject } from '@angular/core';
import { HttpBackend, HttpClient } from '@angular/common/http';

import { Observable, of } from 'rxjs';
import { catchError, shareReplay } from 'rxjs/operators';
import type { TranslateLoader } from '@ngx-translate/core';

import type { Lang } from './i18n.types';

@Injectable()
export class AssetsTranslateLoader implements TranslateLoader {
  // ✅ HttpClient sem interceptors
  private readonly http = new HttpClient(inject(HttpBackend));

  private readonly cache = new Map<Lang, Observable<Record<string, any>>>();

  getTranslation(lang: string): Observable<Record<string, any>> {
    const safeLang: Lang = this.toSafeLang(lang);

    const cached = this.cache.get(safeLang);
    if (cached) return cached;

    const req$ = this.http.get<Record<string, any>>(`/assets/i18n/${safeLang}.json`).pipe(
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

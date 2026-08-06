import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpBackend, HttpClient } from '@angular/common/http';

import { filter } from 'rxjs/operators';
import { fromEvent, firstValueFrom } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { PrimeNG } from 'primeng/config';
import type { Translation } from 'primeng/api';

import { Lang } from './i18n.types';
import {
  LANGS,
  LANG_KEY,
  EVENT_KEY,
  LANG_CONFIG,
  CHANNEL_NAME,
  DEFAULT_LANG,
  LOCALE_COOKIE,
  normalizeLang,
} from './i18n.config';

type I18nSyncMessage = {
  type: 'lang-changed';
  lang: Lang;
  origin: string;
  at: number;
};

/**
 * Mesmo padrão do CardSyncWeb (core/i18n/i18n.service.ts), simplificado: sem os helpers de
 * tradução de código de erro de backend (tErrorCode/tFieldError) - o backend do NimbusFlow não
 * tem esse catálogo de erros ainda. tUi() usa string simples, não um UiKey tipado (evita manter
 * um registro de ~1800 linhas gerado só pra isso).
 */
@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly translate = inject(TranslateService);
  private readonly primeng = inject(PrimeNG);
  // HttpClient sem interceptors (mesmo motivo do AssetsTranslateLoader: evita recursão, já que o
  // languageInterceptor depende deste serviço).
  private readonly http = new HttpClient(inject(HttpBackend));
  private readonly primengTranslationCache = new Map<Lang, Translation>();

  private readonly tabId = this.createTabId();

  private readonly channel: BroadcastChannel | null =
    typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL_NAME) : null;

  readonly lang = signal<Lang>(this.readLang());
  readonly appliedLang = signal<Lang>(DEFAULT_LANG);

  constructor() {
    this.translate.addLangs([...LANGS]);
    // setDefaultLang() não existe mais no @ngx-translate/core 18 - fallbackLang é configurado via
    // provideTranslateService({ fallbackLang: DEFAULT_LANG }) em app.config.ts.

    this.bindStorageSync();
    this.bindBroadcastChannel();
    this.bindVisibilitySync();
    this.bindTranslateSync();
  }

  async init(): Promise<void> {
    await this.applyAll(this.lang(), false);
  }

  getLang(): Lang {
    return this.lang();
  }

  getAppliedLang(): Lang {
    return this.appliedLang();
  }

  getLocale(): 'pt-BR' | 'en-US' | 'es-ES' {
    return LANG_CONFIG[this.appliedLang()].locale;
  }

  getCurrency(): 'BRL' | 'USD' | 'EUR' {
    return LANG_CONFIG[this.appliedLang()].currency;
  }

  async setLang(lang: Lang): Promise<void> {
    const normalized = normalizeLang(lang);

    localStorage.setItem(LANG_KEY, normalized);
    this.setLocaleCookie(normalized);

    await this.applyAll(normalized, true);
  }

  /** tUi('dashboard.title') - instant() lê o dicionário já carregado; usável em template e TS. */
  tUi(key: string, params?: Record<string, unknown>, fallback?: string): string {
    return this.instantOrFallback(key, params, fallback);
  }

  formatCurrency(value: unknown, fallback = ''): string {
    if (value === null || value === undefined || value === '') {
      return fallback;
    }
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) {
      return String(value);
    }
    return new Intl.NumberFormat(this.getLocale(), {
      style: 'currency',
      currency: this.getCurrency(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericValue);
  }

  private async applyAll(lang: Lang, syncAcrossTabs: boolean): Promise<void> {
    const normalized = normalizeLang(lang);

    await Promise.all([firstValueFrom(this.translate.use(normalized)), this.applyPrimeNgTranslation(normalized)]);
    this.applyDocumentSideEffects(normalized);
    this.lang.set(normalized);
    this.appliedLang.set(normalized);

    if (syncAcrossTabs) {
      this.publishLangChange(normalized);
    }
  }

  /** Dicionário de textos do PrimeNG (p-table, p-datepicker, etc.) - arquivo próprio, separado das
   * chaves do app (public/i18n/primeng/{lang}.json), mesmo padrão do CardSyncWeb. */
  private async applyPrimeNgTranslation(lang: Lang): Promise<void> {
    const cached = this.primengTranslationCache.get(lang);
    if (cached) {
      this.primeng.setTranslation(cached);
      return;
    }

    try {
      const file = LANG_CONFIG[lang].primengFile;
      const translation = await firstValueFrom(this.http.get<Translation>(`/i18n/primeng/${file}.json`));
      this.primengTranslationCache.set(lang, translation);
      this.primeng.setTranslation(translation);
    } catch {
      // Sem tradução do PrimeNG: mantém o dicionário em inglês já embutido no componente.
    }
  }

  private applyDocumentSideEffects(lang: Lang): void {
    document.documentElement.lang = LANG_CONFIG[lang].documentLang;
    this.setLocaleCookie(lang);
  }

  private publishLangChange(lang: Lang): void {
    const msg: I18nSyncMessage = { type: 'lang-changed', lang, origin: this.tabId, at: Date.now() };
    localStorage.setItem(EVENT_KEY, JSON.stringify(msg));
    this.broadcast(msg);
  }

  private bindTranslateSync(): void {
    this.translate.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      const next = normalizeLang(event.lang);
      this.lang.set(next);
      this.appliedLang.set(next);
      this.applyDocumentSideEffects(next);
    });
  }

  private bindStorageSync(): void {
    fromEvent<StorageEvent>(window, 'storage')
      .pipe(
        filter((e) => e.key === LANG_KEY || e.key === EVENT_KEY),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        if (event.key === LANG_KEY) {
          this.syncIfNeeded(event.newValue);
          return;
        }
        if (event.key === EVENT_KEY && event.newValue) {
          try {
            const msg = JSON.parse(event.newValue) as I18nSyncMessage;
            if (msg.origin === this.tabId || msg.type !== 'lang-changed') return;
            this.syncIfNeeded(msg.lang);
          } catch {
            // ignora payload inválido
          }
        }
      });
  }

  private bindBroadcastChannel(): void {
    if (!this.channel) return;
    this.channel.onmessage = (event: MessageEvent<I18nSyncMessage>) => {
      const msg = event.data;
      if (!msg || msg.origin === this.tabId || msg.type !== 'lang-changed') return;
      this.syncIfNeeded(msg.lang);
    };
  }

  private bindVisibilitySync(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') return;
      this.syncIfNeeded(localStorage.getItem(LANG_KEY));
    });
  }

  private syncIfNeeded(next: string | null | undefined): void {
    const normalized = normalizeLang(next);
    if (normalized !== this.appliedLang()) {
      void this.applyAll(normalized, false);
    }
  }

  private instantOrFallback(key: string, params?: Record<string, unknown>, fallback?: string): string {
    const value = this.translate.instant(key, params);
    if (value && value !== key) {
      return value;
    }
    return fallback ?? key;
  }

  private readLang(): Lang {
    const fromStorage = localStorage.getItem(LANG_KEY);
    if (fromStorage?.trim()) {
      return normalizeLang(fromStorage);
    }
    const fromCookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${LOCALE_COOKIE}=`))
      ?.split('=')[1];
    return normalizeLang(fromCookie);
  }

  private setLocaleCookie(lang: Lang): void {
    document.cookie = `${LOCALE_COOKIE}=${lang}; path=/; max-age=31536000; SameSite=Lax`;
  }

  private broadcast(msg: I18nSyncMessage): void {
    try {
      this.channel?.postMessage(msg);
    } catch {
      // ignora falha do canal
    }
  }

  private createTabId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

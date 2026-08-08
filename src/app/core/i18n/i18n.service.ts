import { HttpBackend, HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Injectable, DestroyRef, inject, signal } from '@angular/core';

import { filter } from 'rxjs/operators';
import { PrimeNG } from 'primeng/config';
import { fromEvent, firstValueFrom } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import { Lang } from './i18n.types';
import type { UiKey } from './ui-keys';
import type { GlobalErrorCode, FieldErrorCode, UserFieldName } from './error-codes';
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
import { PeriodEnum } from '@models/enums/period.enum';

type I18nSyncMessage = {
  type: 'lang-changed';
  lang: Lang;
  origin: string;
  at: number;
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly primeng = inject(PrimeNG);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translate = inject(TranslateService);
  private readonly http = new HttpClient(inject(HttpBackend));

  private readonly tabId = this.createTabId();

  private readonly channel: BroadcastChannel | null =
    typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL_NAME) : null;

  private readonly primengCache = new Map<Lang, Record<string, unknown>>();

  readonly lang = signal<Lang>(this.readLang());
  readonly appliedLang = signal<Lang>(DEFAULT_LANG);

  constructor() {
    this.translate.addLangs([...LANGS]);
    this.translate.setDefaultLang(DEFAULT_LANG);

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

  getLocalePtBr(): 'pt-BR' {
    return 'pt-BR';
  }

  getCurrencyBrl(): 'BRL' {
    return 'BRL';
  }

  getCurrency(): 'BRL' | 'USD' | 'EUR' {
    return LANG_CONFIG[this.appliedLang()].currency;
  }

  getDateLocale(): 'pt-BR' | 'en-US' | 'es-ES' {
    return LANG_CONFIG[this.appliedLang()].locale;
  }

  getDateTimeZone(): string {
    return LANG_CONFIG[this.appliedLang()].timeZone;
  }

  async setLang(lang: Lang): Promise<void> {
    const normalized = normalizeLang(lang);

    localStorage.setItem(LANG_KEY, normalized);
    this.setLocaleCookie(normalized);

    await this.applyAll(normalized, true);
  }

  tUi(key: UiKey, params?: Record<string, unknown> | string, fallback?: string): string {
    const isFallbackOnly = typeof params === 'string';
    const realParams = isFallbackOnly ? undefined : (params as Record<string, unknown> | undefined);
    const realFallback = isFallbackOnly ? params : fallback;

    return this.instantOrFallback(key, realParams, realFallback);
  }

  tErrorCode(code: GlobalErrorCode, fallback?: string): string {
    return this.tErrorCodeLoose(code, fallback);
  }

  tErrorCodeLoose(code?: string | null, fallback?: string): string {
    if (!code) return this.genericError(fallback);

    return this.instantOrFallback(`errors.global.${code}`, undefined, this.genericError(fallback));
  }

  tFieldError(
    field: UserFieldName,
    fieldCode: FieldErrorCode,
    fallback?: string,
    params?: Record<string, unknown>,
  ): string {
    return this.tFieldErrorLoose(field, fieldCode, fallback, params);
  }

  tFieldErrorLoose(
    field?: string | null,
    fieldCode?: string | null,
    fallback?: string,
    params?: Record<string, unknown>,
  ): string {
    if (!fieldCode) return this.genericError(fallback);

    if (field) {
      const fieldKey = `errors.fields.${field}.${fieldCode}`;
      const fieldValue = this.translate.instant(fieldKey, params);
      if (fieldValue && fieldValue !== fieldKey) return fieldValue;
    }

    const wildcardKey = `errors.fields.*.${fieldCode}`;
    const wildcardValue = this.translate.instant(wildcardKey, params);
    if (wildcardValue && wildcardValue !== wildcardKey) return wildcardValue;

    const validationKey = `validation.${fieldCode}`;
    const validationValue = this.translate.instant(validationKey, params);
    if (validationValue && validationValue !== validationKey) return validationValue;

    return this.genericError(fallback);
  }

  tPrimeNg(key: string | null | undefined, fallback?: string): string {
    if (!key) return fallback ?? '';

    const current = this.primengCache.get(this.appliedLang())?.[key];
    if (typeof current === 'string' && current.trim()) return current;

    const defaultValue = this.primengCache.get(DEFAULT_LANG)?.[key];
    if (typeof defaultValue === 'string' && defaultValue.trim()) return defaultValue;

    return fallback ?? key;
  }

  formatBrlCurrency(
    value: unknown,
    options?: {
      fallbackKey?: UiKey;
      minimumFractionDigits?: number;
      maximumFractionDigits?: number;
    },
  ): string {
    return this.formatCurrency(value, {
      ...options,
      currency: 'BRL',
    });
  }

  getDateFormatByPeriod(period: PeriodEnum | null | undefined): string {
    switch (period) {
      case PeriodEnum.MONTH:
        return this.getMonthYearFormat();

      case PeriodEnum.YEAR:
        return this.getYearFormat();

      case PeriodEnum.DAY:
      case PeriodEnum.START:
      case PeriodEnum.END:
      case PeriodEnum.INTERVAL:
      default:
        return this.getDateFormat();
    }
  }

  getDateFormat(): string {
    const locale = this.getDateLocale();

    switch (locale) {
      case 'en-US':
        return 'mm/dd/yy';

      case 'es-ES':
        return 'dd/mm/yy';

      case 'pt-BR':
      default:
        return 'dd/mm/yy';
    }
  }

  getMonthYearFormat(): string {
    return 'mm/yy';
  }

  getYearFormat(): string {
    return 'yy';
  }

  formatDateValue(value: string | Date | null | undefined): string | null {
    if (!value) {
      return null;
    }

    const date = value instanceof Date ? value : this.parseDatePreservingDay(value);

    if (!date) {
      return null;
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear());

    const locale = this.getDateLocale();

    switch (locale) {
      case 'en-US':
        return `${month}/${day}/${year}`;

      case 'es-ES':
      case 'pt-BR':
      default:
        return `${day}/${month}/${year}`;
    }
  }

  private parseDatePreservingDay(value: string): Date | null {
    /**
     * Mantém o dia original quando vier ISO do backend:
     * 2026-05-11
     * 2026-05-11T00:00:00Z
     * 2026-05-11T03:00:00-03:00
     */
    const isoDateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (isoDateMatch) {
      const [, year, month, day] = isoDateMatch;

      return new Date(Number(year), Number(month) - 1, Number(day));
    }

    const parsed = new Date(value);

    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private formatCurrency(
    value: unknown,
    options?: {
      currency?: 'BRL' | 'USD' | 'EUR';
      locale?: 'pt-BR' | 'en-US' | 'es-ES';
      fallbackKey?: UiKey;
      minimumFractionDigits?: number;
      maximumFractionDigits?: number;
    },
  ): string {
    if (value === null || value === undefined || value === '') {
      return this.tUi(options?.fallbackKey ?? 'common.notInformed');
    }

    const numericValue = Number(value);

    if (Number.isNaN(numericValue)) {
      return String(value);
    }

    return new Intl.NumberFormat(options?.locale ?? this.getLocale(), {
      style: 'currency',
      currency: options?.currency ?? this.getCurrency(),
      minimumFractionDigits: options?.minimumFractionDigits ?? 2,
      maximumFractionDigits: options?.maximumFractionDigits ?? 2,
    }).format(numericValue);
  }

  private async applyAll(lang: Lang, syncAcrossTabs: boolean): Promise<void> {
    const normalized = normalizeLang(lang);

    if (normalized !== this.appliedLang()) {
      await this.applyRuntimeLanguage(normalized);
    } else {
      await firstValueFrom(this.translate.use(normalized));
      await this.ensurePrimeNgTranslation(normalized);
      this.applyDocumentSideEffects(normalized);
      this.lang.set(normalized);
      this.appliedLang.set(normalized);
    }

    if (syncAcrossTabs) {
      this.publishLangChange(normalized);
    }
  }

  private async applyRuntimeLanguage(lang: Lang): Promise<void> {
    this.lang.set(lang);

    await firstValueFrom(this.translate.use(lang));
    await this.ensurePrimeNgTranslation(lang);

    this.applyDocumentSideEffects(lang);
    this.appliedLang.set(lang);
  }

  private async ensurePrimeNgTranslation(lang: Lang): Promise<void> {
    const cached = this.primengCache.get(lang);
    if (cached) {
      this.primeng.setTranslation(structuredClone(cached));
      return;
    }

    const dict = await firstValueFrom(
      this.http.get<Record<string, unknown>>(LANG_CONFIG[lang].primengFile),
    );

    this.primengCache.set(lang, dict);
    this.primeng.setTranslation(structuredClone(dict));
  }

  private applyDocumentSideEffects(lang: Lang): void {
    document.documentElement.lang = LANG_CONFIG[lang].documentLang;
    this.setLocaleCookie(lang);
  }

  private publishLangChange(lang: Lang): void {
    const msg: I18nSyncMessage = {
      type: 'lang-changed',
      lang,
      origin: this.tabId,
      at: Date.now(),
    };

    localStorage.setItem(EVENT_KEY, JSON.stringify(msg));
    this.broadcast(msg);
  }

  private bindTranslateSync(): void {
    this.translate.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      const next = normalizeLang(event.lang);
      this.lang.set(next);
      this.appliedLang.set(next);
      void this.ensurePrimeNgTranslation(next);
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

  private instantOrFallback(
    key: string,
    params?: Record<string, unknown>,
    fallback?: string,
  ): string {
    const value = this.translate.instant(key, params);
    return value && value !== key ? value : (fallback ?? key);
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

  private genericError(fallback?: string): string {
    return this.instantOrFallback(
      'errors.global.GENERIC_ERROR',
      undefined,
      fallback ?? 'Ocorreu um erro inesperado.',
    );
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

import { Lang } from './i18n.types';

export const LANGS = ['pt-BR', 'en', 'es'] as const;
export const DEFAULT_LANG: Lang = 'pt-BR';

export const CHANNEL_NAME = 'nimbusflow-security-i18n';
export const LANG_KEY = 'nimbusflow-security.i18n.lang';
export const EVENT_KEY = 'nimbusflow-security.i18n.event';
export const LOCALE_COOKIE = 'NIMBUSFLOW_SECURITY_LOCALE';

type LangConfig = {
  locale: 'pt-BR' | 'en-US' | 'es-ES';
  currency: 'BRL' | 'USD' | 'EUR';
  documentLang: string;
  primengFile: string;
  timeZone: string;
};

export const LANG_CONFIG: Record<Lang, LangConfig> = {
  'pt-BR': {
    locale: 'pt-BR',
    currency: 'BRL',
    documentLang: 'pt-BR',
    primengFile: '/assets/i18n/primeng/pt-BR.json',
    timeZone: 'America/Sao_Paulo',
  },
  en: {
    locale: 'en-US',
    currency: 'USD',
    documentLang: 'en',
    primengFile: '/assets/i18n/primeng/en.json',
    timeZone: 'UTC',
  },
  es: {
    locale: 'es-ES',
    currency: 'EUR',
    documentLang: 'es',
    primengFile: '/assets/i18n/primeng/es.json',
    timeZone: 'America/Sao_Paulo',
  },
};

export function normalizeLang(value: string | null | undefined): Lang {
  const raw = (value ?? '').trim();

  if (raw === 'pt' || raw === 'pt-BR') return 'pt-BR';
  if (raw === 'en' || raw === 'en-US') return 'en';
  if (raw === 'es' || raw === 'es-ES') return 'es';

  return DEFAULT_LANG;
}

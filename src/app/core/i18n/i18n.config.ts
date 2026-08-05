import { Lang } from './i18n.types';

/**
 * Mesmo padrão do CardSyncWeb (core/i18n) - portado sem a parte específica de PrimeNG (NimbusFlow
 * usa Angular Material) e sem o registro de chaves tipado (ui-keys.ts do CardSync, ~1800 linhas
 * geradas) - aqui as chaves de tradução são strings simples, sem checagem de tipo em tempo de
 * compilação. Suficiente pro estágio atual, sem a infraestrutura extra.
 */
export const LANGS = ['pt-BR', 'en', 'es'] as const;
export const DEFAULT_LANG: Lang = 'pt-BR';

export const CHANNEL_NAME = 'nimbusflow-i18n';
export const LANG_KEY = 'nimbusflow.i18n.lang';
export const EVENT_KEY = 'nimbusflow.i18n.event';
export const LOCALE_COOKIE = 'NIMBUSFLOW_LOCALE';

interface LangConfig {
  locale: 'pt-BR' | 'en-US' | 'es-ES';
  currency: 'BRL' | 'USD' | 'EUR';
  documentLang: string;
}

export const LANG_CONFIG: Record<Lang, LangConfig> = {
  'pt-BR': { locale: 'pt-BR', currency: 'BRL', documentLang: 'pt-BR' },
  en: { locale: 'en-US', currency: 'USD', documentLang: 'en' },
  es: { locale: 'es-ES', currency: 'EUR', documentLang: 'es' },
};

export function normalizeLang(value: string | null | undefined): Lang {
  const raw = (value ?? '').trim();

  if (raw === 'pt' || raw === 'pt-BR') return 'pt-BR';
  if (raw === 'en' || raw === 'en-US') return 'en';
  if (raw === 'es' || raw === 'es-ES') return 'es';

  return DEFAULT_LANG;
}

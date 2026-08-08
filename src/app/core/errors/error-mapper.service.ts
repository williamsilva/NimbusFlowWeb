import { Injectable } from '@angular/core';

import { ApiError } from './api-error.model';
import { I18nService } from '../i18n/i18n.service';

@Injectable({ providedIn: 'root' })
export class ErrorMapperService {
  constructor(private i18n: I18nService) {}

  ui(key: string, fallback?: string, params?: Record<string, unknown>): string {
    return this.i18n.tUi(key as never, params, fallback);
  }

  titleForStatus(status?: number): string {
    const lang = this.i18n.getLang();

    if (lang === 'en') {
      if (status === 400) return 'Validation';
      if (status === 401) return 'Session expired';
      if (status === 403) return 'Access denied';
      if (status === 404) return 'Not found';
      return 'Error';
    }

    if (lang === 'es') {
      if (status === 400) return 'Validación';
      if (status === 401) return 'Sesión expirada';
      if (status === 403) return 'Acceso denegado';
      if (status === 404) return 'No encontrado';
      return 'Error';
    }

    if (status === 400) return 'Validação';
    if (status === 401) return 'Sessão expirada';
    if (status === 403) return 'Acesso negado';
    if (status === 404) return 'Não encontrado';
    return 'Erro';
  }

  normalize(err: unknown): ApiError {
    const e = (err as any)?.error;
    if (e && typeof e === 'object') return e as ApiError;

    return {
      status: (err as any)?.status,
      message: (err as any)?.message,
    };
  }

  message(e: ApiError | null | undefined): string {
    if (!e) return this.i18n.tErrorCodeLoose('GENERIC_ERROR');

    if (e.userMessage) return e.userMessage;
    if (e.code) return this.i18n.tErrorCodeLoose(e.code, e.message);
    if (e.message) return e.message;

    return this.i18n.tErrorCodeLoose('GENERIC_ERROR');
  }

  fieldMessage(
    field: string,
    fieldCode?: string | null,
    fallback?: string,
    userMessage?: string,
    params?: Record<string, unknown>,
  ): string {
    if (userMessage) return userMessage;

    if (fieldCode) {
      return this.i18n.tFieldErrorLoose(field, fieldCode, fallback, params);
    }

    return fallback ?? this.i18n.tErrorCodeLoose('GENERIC_ERROR');
  }

  fieldLabel(field?: string | null, namespaces: string[] = []): string {
    if (!field) return '';

    for (const ns of namespaces) {
      const key = `${ns}.${field}`;
      const translated = this.i18n.tUi(key as never, field);
      if (translated && translated !== key) return translated;
    }

    return field;
  }
}

import { formatDate } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Pipe, PipeTransform, DestroyRef, inject, signal } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { Lang } from '../../core/i18n/i18n.types';
import { I18nService } from '../../core/i18n/i18n.service';

type CsDatePreset = 'short' | 'medium' | 'date' | 'datetime' | 'time' | 'full' | 'dayMonth';

@Pipe({
  name: 'csDate',
  standalone: true,
  pure: false,
})
export class CsDatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly tick = signal(0);

  constructor() {
    this.translate.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.tick.update((v) => v + 1);
    });
  }

  transform(
    value: string | Date | number | null | undefined,
    preset: CsDatePreset | string = 'short',
    timezone?: string,
    locale?: string,
  ): string {
    this.tick();

    if (value == null || value === '') {
      return '-';
    }

    const parsed = this.normalizeDate(value);
    if (!parsed) {
      return '-';
    }

    const resolvedLocale = locale ?? this.i18n.getDateLocale();

    if (preset === 'full' || preset === 'dayMonth') {
      try {
        const options: Intl.DateTimeFormatOptions =
          preset === 'full'
            ? { dateStyle: 'full' }
            : { day: '2-digit', month: '2-digit' };
        return new Intl.DateTimeFormat(resolvedLocale, options).format(parsed);
      } catch {
        return '-';
      }
    }

    const lang = this.i18n.getAppliedLang();
    const resolvedTimezone = timezone ?? this.i18n.getDateTimeZone();
    const format = this.resolveFormat(preset, lang);

    try {
      return formatDate(parsed, format, resolvedLocale, resolvedTimezone);
    } catch {
      return '-';
    }
  }

  private normalizeDate(value: string | Date | number): Date | null {
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }

    if (typeof value === 'number') {
      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? null : d;
    }

    if (typeof value === 'string') {
      const raw = value.trim();
      if (!raw) {
        return null;
      }

      const parsedLocal = this.parseLocalDateString(raw);
      if (parsedLocal) {
        return parsedLocal;
      }

      const d = new Date(raw);
      return Number.isNaN(d.getTime()) ? null : d;
    }

    return null;
  }

  private parseLocalDateString(raw: string): Date | null {
    // yyyy-MM-dd
    const dateOnlyMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch;

      const d = new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0);

      return Number.isNaN(d.getTime()) ? null : d;
    }

    // yyyy-MM-dd HH:mm
    // yyyy-MM-ddTHH:mm
    // yyyy-MM-dd HH:mm:ss
    // yyyy-MM-ddTHH:mm:ss
    // yyyy-MM-dd HH:mm:ss.SSSSSS
    // yyyy-MM-ddTHH:mm:ss.SSSSSS
    const localDateTimeMatch = raw.match(
      /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?$/,
    );

    if (localDateTimeMatch) {
      const [, year, month, day, hour, minute, second = '0', fraction = '0'] = localDateTimeMatch;

      const milliseconds = Number((fraction + '000').slice(0, 3));

      const d = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second),
        milliseconds,
      );

      return Number.isNaN(d.getTime()) ? null : d;
    }

    return null;
  }

  private resolveFormat(preset: CsDatePreset | string, lang: Lang): string {
    switch (preset) {
      case 'date':
        return lang === 'en' ? 'MM/dd/yyyy' : 'dd/MM/yyyy';
      case 'time':
        return 'HH:mm:ss';
      case 'datetime':
        return lang === 'en' ? 'MM/dd/yyyy HH:mm:ss' : 'dd/MM/yyyy HH:mm:ss';
      case 'medium':
      case 'short':
        return lang === 'en' ? 'MM/dd/yyyy HH:mm' : 'dd/MM/yyyy HH:mm';
      default:
        return preset;
    }
  }
}

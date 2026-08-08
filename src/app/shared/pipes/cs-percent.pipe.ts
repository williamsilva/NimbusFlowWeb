import { ChangeDetectorRef, Pipe, PipeTransform, inject } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { I18nService } from '../../core/i18n/i18n.service';

type CsPercentMode = 'ratio' | 'percent';

@Pipe({
  name: 'csPercent',
  standalone: true,
  pure: false,
})
export class CsPercentPipe implements PipeTransform {
  private readonly i18n = inject(I18nService);
  private readonly translate = inject(TranslateService);
  private readonly cdr = inject(ChangeDetectorRef);

  private lastLang = this.translate.currentLang;

  transform(
    value: number | string | null | undefined,
    opts?: {
      /** 'ratio' => 0.12 vira 12% (default). 'percent' => 12 vira 12% */
      mode?: CsPercentMode;
      /** casas decimais (default 2) */
      digits?: number;
      /** mostra + em positivos (default false) */
      showPlus?: boolean;
      /** usa parênteses pra negativos: (3,21%) (default false) */
      accountingNegative?: boolean;
    },
  ): string {
    if (value === null || value === undefined) return '-';

    const current = this.translate.currentLang;
    if (current !== this.lastLang) {
      this.lastLang = current;
      queueMicrotask(() => this.cdr.markForCheck());
    }

    const locale = this.i18n.getLocale();
    const n = typeof value === 'string' ? Number(value) : value;
    if (!Number.isFinite(n)) return '-';

    const mode = opts?.mode ?? 'ratio';
    const digits = opts?.digits ?? 2;
    const showPlus = opts?.showPlus ?? false;
    const accountingNegative = opts?.accountingNegative ?? false;

    const ratio = mode === 'ratio' ? n : n / 100; // se vier "12", vira 0.12
    const abs = Math.abs(ratio);

    const formatted = new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(abs);

    if (ratio < 0) {
      return accountingNegative ? `(${formatted})` : `-${formatted}`;
    }

    if (ratio > 0 && showPlus) return `+${formatted}`;
    return formatted;
  }
}

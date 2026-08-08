import { ChangeDetectorRef, Pipe, PipeTransform, inject } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { I18nService } from '../../core/i18n/i18n.service';

@Pipe({
  name: 'csCurrency',
  standalone: true,
  pure: false,
})
export class CsCurrencyPipe implements PipeTransform {
  private readonly i18n = inject(I18nService);
  private readonly translate = inject(TranslateService);
  private readonly cdr = inject(ChangeDetectorRef);

  private lastLang = this.translate.currentLang;

  transform(value: number | string | null | undefined, currency?: string): string {
    if (value === null || value === undefined) return '-';

    const current = this.translate.currentLang;
    if (current !== this.lastLang) {
      this.lastLang = current;
      queueMicrotask(() => this.cdr.markForCheck());
    }

    const locale = this.i18n.getLocalePtBr();
    const curr = currency ?? this.i18n.getCurrencyBrl();
    const num = typeof value === 'string' ? Number(value) : value;

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: curr,
      currencyDisplay: 'symbol',
    }).format(num);
  }
}

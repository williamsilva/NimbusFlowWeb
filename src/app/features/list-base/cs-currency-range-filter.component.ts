import { FormsModule } from '@angular/forms';

import { Component, computed, EventEmitter, inject, Input, Output, signal } from '@angular/core';

import { FloatLabel } from 'primeng/floatlabel';
import { InputNumberModule } from 'primeng/inputnumber';

import { I18nService } from '@core/i18n/i18n.service';

export interface CsCurrencyRangeValue {
  start: number | null;
  end: number | null;
}

export type CsCurrencyRangeMask = 'currency' | 'decimal' | 'percent';

@Component({
  standalone: true,
  selector: 'cs-currency-range-filter',
  imports: [FormsModule, InputNumberModule, FloatLabel],
  host: {
    class: 'block',
  },
  template: `
    <div class="flex flex-column w-full gap-2">
      <div class="w-full text-center text-sm font-semibold text-color-secondary line-height-2">
        {{ label }}
      </div>

      <div class="grid formgrid align-items-end">
        <div class="col-12 sm:col-6 p-1">
          <p-floatlabel variant="on" class="w-full">
            <p-inputNumber
              size="small"
              class="w-full"
              [locale]="locale()"
              [suffix]="suffix()"
              [prefix]="prefix()"
              [ngModel]="startValue()"
              inputStyleClass="w-full"
              [mode]="inputNumberMode()"
              [currency]="currencyCode()"
              [useGrouping]="useGrouping"
              [placeholder]="placeholder()"
              [inputId]="inputId + '-start'"
              [minFractionDigits]="minFractionDigits"
              [maxFractionDigits]="maxFractionDigits"
              (ngModelChange)="onStartChange($event)"
            ></p-inputNumber>

            <label [for]="inputId + '-start'">
              {{ startLabel }}
            </label>
          </p-floatlabel>
        </div>

        <div class="col-12 sm:col-6 p-1">
          <p-floatlabel variant="on" class="w-full">
            <p-inputNumber
              size="small"
              class="w-full"
              [locale]="locale()"
              [suffix]="suffix()"
              [prefix]="prefix()"
              [ngModel]="endValue()"
              inputStyleClass="w-full"
              [mode]="inputNumberMode()"
              [currency]="currencyCode()"
              [useGrouping]="useGrouping"
              [inputId]="inputId + '-end'"
              [placeholder]="placeholder()"
              (ngModelChange)="onEndChange($event)"
              [minFractionDigits]="minFractionDigits"
              [maxFractionDigits]="maxFractionDigits"
            ></p-inputNumber>

            <label [for]="inputId + '-end'">
              {{ endLabel }}
            </label>
          </p-floatlabel>
        </div>
      </div>
    </div>
  `,
})
export class CsCurrencyRangeFilterComponent {
  private readonly i18n = inject(I18nService);

  @Input() label = 'Valor';
  @Input() inputId = 'currencyRange';

  @Input() endLabel = 'Final';
  @Input() startLabel = 'Inicial';

  /**
   * currency: R$ 1.234,56
   * percent: 2,50 %
   * decimal: 1234,56
   */
  @Input() mask: CsCurrencyRangeMask = 'currency';

  @Input() useGrouping = true;
  @Input() minFractionDigits = 2;
  @Input() maxFractionDigits = 2;

  @Input() set value(value: CsCurrencyRangeValue | null | undefined) {
    this.startValue.set(value?.start ?? null);
    this.endValue.set(value?.end ?? null);
  }

  @Output() valueChange = new EventEmitter<CsCurrencyRangeValue>();

  protected readonly endValue = signal<number | null>(null);
  protected readonly startValue = signal<number | null>(null);

  protected readonly locale = computed(() => {
    this.i18n.appliedLang();
    return this.i18n.getLocale();
  });

  protected readonly currency = computed(() => {
    this.i18n.appliedLang();
    return this.i18n.getCurrencyBrl();
  });

  protected readonly hasValue = computed(
    () => this.startValue() !== null || this.endValue() !== null,
  );

  protected readonly inputNumberMode = computed<'currency' | 'decimal'>(() => {
    return this.mask === 'currency' ? 'currency' : 'decimal';
  });

  protected readonly currencyCode = computed<string | undefined>(() => {
    return this.mask === 'currency' ? this.currency() : undefined;
  });

  protected readonly suffix = computed<string | undefined>(() => {
    return this.mask === 'percent' ? ' %' : undefined;
  });

  protected readonly prefix = computed<string | undefined>(() => undefined);

  protected readonly placeholder = computed(() => {
    if (this.mask === 'percent') return '0,00 %';
    if (this.mask === 'decimal') return '0,00';
    return undefined;
  });

  protected onStartChange(value: number | null): void {
    this.startValue.set(value ?? null);
    this.emitChange();
  }

  protected onEndChange(value: number | null): void {
    this.endValue.set(value ?? null);
    this.emitChange();
  }

  protected emitChange(): void {
    this.valueChange.emit({
      start: this.startValue(),
      end: this.endValue(),
    });
  }
}

export function currencyRangeLabel(
  i18n: I18nService,
  start: number | null | undefined,
  end: number | null | undefined,
): string | null {
  return rangeLabel(i18n, start, end, 'currency');
}

export function percentRangeLabel(
  i18n: I18nService,
  start: number | null | undefined,
  end: number | null | undefined,
): string | null {
  return rangeLabel(i18n, start, end, 'percent');
}

export function decimalRangeLabel(
  i18n: I18nService,
  start: number | null | undefined,
  end: number | null | undefined,
): string | null {
  return rangeLabel(i18n, start, end, 'decimal');
}

function rangeLabel(
  i18n: I18nService,
  start: number | null | undefined,
  end: number | null | undefined,
  mask: CsCurrencyRangeMask,
): string | null {
  const formatter = (value: number) => formatRangeValue(i18n, value, mask);

  if (start !== null && start !== undefined && end !== null && end !== undefined) {
    return `${formatter(start)} ${i18n.tUi('common.to')} ${formatter(end)}`;
  }

  if (start !== null && start !== undefined) {
    return `${i18n.tUi('common.from')} ${formatter(start)}`;
  }

  if (end !== null && end !== undefined) {
    return `${i18n.tUi('common.until')} ${formatter(end)}`;
  }

  return null;
}

function formatRangeValue(i18n: I18nService, value: number, mask: CsCurrencyRangeMask): string {
  if (mask === 'currency') {
    return i18n.formatBrlCurrency(value);
  }

  if (mask === 'percent') {
    return new Intl.NumberFormat(i18n.getLocale(), {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(value / 100);
  }

  return new Intl.NumberFormat(i18n.getLocale(), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value);
}

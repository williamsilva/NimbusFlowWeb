import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { BadgeModule } from 'primeng/badge';

import { badgeClassFromTone, badgeSeverityFromTone, CsBadgeTone } from './badge-tone.type';

export type CsBadgeSize = 'large' | 'xlarge';

@Component({
  standalone: true,
  selector: 'cs-badge',
  imports: [BadgeModule],
  template: `
    @if (visible()) {
      <p-badge
        [value]="displayValue()"
        [severity]="severity()"
        [size]="size()"
        [class]="badgeClass()"
      />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CsBadgeComponent {
  readonly value = input<string | number | null | undefined>();
  readonly tone = input<CsBadgeTone | null | undefined>('secondary');

  /**
   * Quando true, mostra somente a bolinha do badge, sem texto.
   *
   * Exemplo:
   * <cs-badge tone="danger" [dot]="true" />
   */
  readonly dot = input(false);

  /**
   * Limita valor numérico.
   *
   * Exemplo:
   * value=150 max=99 => "99+"
   */
  readonly max = input<number | null | undefined>();

  readonly size = input<CsBadgeSize | null | undefined>();

  protected readonly visible = computed(() => {
    if (this.dot()) {
      return true;
    }

    const value = this.value();

    return value !== null && value !== undefined && value !== '';
  });

  protected readonly displayValue = computed(() => {
    if (this.dot()) {
      return undefined;
    }

    const value = this.value();

    if (value === null || value === undefined || value === '') {
      return undefined;
    }

    const max = this.max();

    if (typeof value === 'number' && typeof max === 'number' && value > max) {
      return `${max}+`;
    }

    return String(value);
  });

  protected readonly severity = computed(() => badgeSeverityFromTone(this.tone()));
  protected readonly badgeClass = computed(() => badgeClassFromTone(this.tone()));
}

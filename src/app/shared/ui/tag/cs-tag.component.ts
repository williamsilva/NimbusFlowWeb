import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { TagModule } from 'primeng/tag';

import { CsTagTone, tagClassFromTone, tagSeverityFromTone } from './tag-tone.type';

@Component({
  standalone: true,
  selector: 'cs-tag',
  imports: [TagModule],
  template: `<p-tag [value]="displayValue()" [severity]="severity()" [class]="tagClass()" [title]="displayValue()" />`,
  styles: [`
    :host {
      display: inline-block;
      max-width: 100%;
      overflow: hidden;
    }
    :host ::ng-deep .p-tag {
      max-width: 100%;
      overflow: hidden;
    }
    :host ::ng-deep .p-tag-label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      min-width: 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CsTagComponent {
  readonly value = input<string | number | null | undefined>();
  readonly tone = input<CsTagTone | null | undefined>('secondary');

  protected readonly displayValue = computed(() => {
    const value = this.value();

    if (value === null || value === undefined || value === '') {
      return undefined;
    }

    return String(value);
  });

  protected readonly severity = computed(() => tagSeverityFromTone(this.tone()));
  protected readonly tagClass = computed(() => tagClassFromTone(this.tone()));
}

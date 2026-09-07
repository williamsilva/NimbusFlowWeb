import { Component, EventEmitter, Input, Output } from '@angular/core';

import { ButtonModule } from 'primeng/button';

@Component({
  standalone: true,
  selector: 'app-column-filter-shell',
  imports: [ButtonModule],
  template: `
    <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -- só existe pra impedir que o clique dentro do painel feche o overlay por propagação, não é uma interação em si -->
    <div
      [style.min-width]="minWidth"
      style="padding-top: 0.25rem"
      class="flex flex-column gap-3"
      (click)="$event.stopPropagation()"
      (mousedown)="$event.stopPropagation()"
    >
      <ng-content></ng-content>

      <div class="flex justify-content-end gap-2 pt-1">
        <button
          pButton
          type="button"
          variant="text"
          icon="pi pi-times"
          severity="danger"
          class="p-button-sm"
          [label]="clearLabel"
          (click)="clear.emit()"
        ></button>

        <button
          pButton
          type="button"
          icon="pi pi-check"
          severity="success"
          class="p-button-sm"
          [label]="applyLabel"
          (click)="apply.emit()"
          [disabled]="applyDisabled"
        ></button>
      </div>
    </div>
  `,
})
export class CsColumnFilterShellComponent {
  @Input() minWidth = '18rem';
  @Input() clearLabel = 'Limpar';
  @Input() applyLabel = 'Aplicar';
  @Input() applyDisabled = false;

  @Output() clear = new EventEmitter<void>();
  @Output() apply = new EventEmitter<void>();
}

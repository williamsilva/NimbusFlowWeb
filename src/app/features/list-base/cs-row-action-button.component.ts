import { Component, EventEmitter, Input, Output } from '@angular/core';

import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  standalone: true,
  selector: 'cs-row-action-button',
  imports: [ButtonModule, TooltipModule],
  template: `
    <button
      pButton
      type="button"
      [icon]="icon"
      tooltipPosition="top"
      [disabled]="disabled"
      (click)="clicked.emit()"
      class="p-button-text p-button-sm"
      [pTooltip]="tooltip || undefined"
    ></button>
  `,
})
export class CsRowActionButtonComponent {
  @Input() disabled = false;
  @Input({ required: true }) icon!: string;
  @Input() tooltip: string | undefined | null = '';

  @Output() clicked = new EventEmitter<void>();
}

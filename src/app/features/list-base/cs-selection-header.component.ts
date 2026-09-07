import { FormsModule } from '@angular/forms';

import { Component, EventEmitter, Input, Output } from '@angular/core';

import { TooltipModule } from 'primeng/tooltip';
import { CheckboxModule } from 'primeng/checkbox';

@Component({
  standalone: true,
  selector: 'app-selection-header',
  imports: [FormsModule, CheckboxModule, TooltipModule],
  template: `
    @if (enabled) {
      <p-checkbox
        [binary]="true"
        [ngModel]="checked"
        [indeterminate]="indeterminate"
        (onChange)="selectionToggle.emit(!!$event.checked)"
      ></p-checkbox>
    } @else {
      <i class="pi pi-info-circle opacity-70" [pTooltip]="hintTooltip" tooltipPosition="top"></i>
    }
    
    `,
})
export class CsSelectionHeaderComponent {
  @Input() enabled = false;
  @Input() checked = false;
  @Input() indeterminate = false;
  @Input() hintTooltip = '';

  @Output() selectionToggle = new EventEmitter<boolean>();
}

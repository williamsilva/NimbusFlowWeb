
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { FloatLabel } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  standalone: true,
  selector: 'cs-advanced-text-filter',
  imports: [FloatLabel, InputTextModule],
  host: {
    class: 'block',
  },
  template: `
    <p-floatLabel variant="on" class="w-full">
      <input
        pInputText
        type="text"
        [id]="inputId"
        [value]="value"
        [disabled]="disabled"
        class="w-full p-inputtext-sm"
        (input)="valueChange.emit(($any($event.target).value ?? '').toString())"
      />

      <label [for]="inputId">{{ label }}</label>
    </p-floatLabel>
  `,
})
export class CsAdvancedTextFilterComponent {
  @Input() label = '';
  @Input() value = '';
  @Input() inputId = '';
  @Input() disabled = false;

  @Output() valueChange = new EventEmitter<string>();
}

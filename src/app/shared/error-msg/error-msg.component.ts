
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { Component, Input, inject } from '@angular/core';

import { TooltipModule } from 'primeng/tooltip';
import { ErrorMapperService } from '../../core/errors/error-mapper.service';

@Component({
  selector: 'app-error-msg',
  standalone: true,
  imports: [TooltipModule],
  template: `
    <span class="cs-error-wrap">
      <label
        [attr.for]="forId || null"
        class="cs-float-label"
        [class.cs-float-label-error]="hasErrorMessage"
        >
        {{ text }}
      </label>
    
      @if (showTechnicalDetails && technicalMessage) {
        <i
          class="pi pi-info-circle cs-error-tech"
          [pTooltip]="technicalMessage"
          tooltipPosition="top"
        ></i>
      }
    </span>
    `,
  styles: [
    `
      :host {
        display: contents;
      }

      .cs-error-wrap {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        min-width: 0;
      }

      .cs-error-wrap .cs-float-label {
        font-size: 0.88rem;
        line-height: 1.15;
      }

      .cs-error-wrap .cs-float-label-error {
        color: var(--p-red-500, #ef4444);
      }

      .cs-error-tech {
        font-size: 0.8rem;
        cursor: help;
        color: var(--p-red-500, #ef4444);
        flex: 0 0 auto;
      }

      :root.dark .cs-error-wrap .cs-float-label {
        color: #cbd5e1;
      }

      :root.dark .cs-error-wrap .cs-float-label-error {
        color: #f87171;
      }

      :root.dark .cs-error-tech {
        color: #f87171;
      }
    `,
  ],
})
export class ErrorMsgComponent {
  private readonly mapper = inject(ErrorMapperService);

  @Input() field?: string;
  @Input() hidden = false;
  @Input() forId?: string;
  @Input() required = true;
  @Input() showTechnicalDetails = false;
  @Input({ required: true }) label!: string;
  @Input({ required: true }) control!: AbstractControl | null;

  get hasErrorMessage(): boolean {
    if (!this.control || this.hidden) return false;
    return this.control.invalid && (this.control.touched || this.control.dirty);
  }

  get technicalMessage(): string | undefined {
    const api = this.control?.errors?.['api'];
    return api?.technicalMessage ?? undefined;
  }

  get text(): string {
    const control = this.control;

    if (!control) {
      return this.decorateLabel(this.label);
    }

    if (this.hasErrorMessage && control.errors) {
      const fieldName = this.field ?? '';

      if (control.errors['api']) {
        const api = control.errors['api'];

        return this.mapper.fieldMessage(fieldName, api?.code, this.label, api?.message, {
          label: this.label,
          ...(api?.params ?? {}),
        });
      }

      const firstKey = Object.keys(control.errors)[0];
      if (firstKey) {
        const normalizedKey = normalizeAngularErrorKey(firstKey);
        const params = extractAngularErrorParams(firstKey, control.errors);

        return this.mapper.fieldMessage(fieldName, normalizedKey, this.label, undefined, {
          label: this.label,
          ...params,
        });
      }
    }

    if (this.hidden) return '';
    return this.decorateLabel(this.label);
  }

  private decorateLabel(label: string): string {
    return this.required ? `* ${label}` : label;
  }
}

function normalizeAngularErrorKey(key: string): string {
  switch (key) {
    case 'required':
      return 'required';
    case 'email':
      return 'email';
    case 'pattern':
      return 'pattern';
    case 'min':
      return 'min';
    case 'max':
      return 'max';
    case 'minlength':
      return 'minLength';
    case 'maxlength':
      return 'maxLength';
    case 'passwordMismatch':
      return 'passwordMismatch';
    default:
      return 'invalid';
  }
}

function extractAngularErrorParams(
  key: string,
  errors: ValidationErrors,
): Record<string, unknown> | undefined {
  const value = errors[key];

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  return { ...(value as Record<string, unknown>) };
}

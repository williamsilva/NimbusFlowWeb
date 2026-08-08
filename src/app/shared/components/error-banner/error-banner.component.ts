import { CommonModule } from '@angular/common';
import {
  Input,
  Output,
  signal,
  computed,
  Component,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';

import { CsTagTone } from '@shared/ui';
import { TranslateModule } from '@ngx-translate/core';
import { ApiError } from '../../../core/errors/api-error.model';
import { ErrorMapperService } from '../../../core/errors/error-mapper.service';

export type BannerType = CsTagTone;

@Component({
  standalone: true,
  imports: [CommonModule, TranslateModule],
  selector: 'app-error-banner',
  styleUrl: './error-banner.component.scss',
  templateUrl: './error-banner.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorBannerComponent {
  @Input() type: BannerType = 'error';
  @Input() error: ApiError | null = null;
  @Input() title?: string;
  @Input() message?: string;
  @Input() dismissible = true;
  @Input() showDetails = false;
  @Input() showTechnicalDetails = false;
  @Input() fieldLabelNamespaces: string[] = [];

  @Output() dismissed = new EventEmitter<void>();

  private _visible = signal(true);
  visible = this._visible.asReadonly();

  constructor(private mapper: ErrorMapperService) {}

  readonly inferredType = computed<BannerType>(() => {
    if (!this.error) return this.type;

    const st = this.error.status ?? 0;
    if (st === 400) return 'warn';
    if (st === 404) return 'info';
    if (st === 401 || st === 403) return 'warn';
    if (st >= 500) return 'error';
    return this.type;
  });

  readonly resolvedIcon = computed(() => {
    switch (this.inferredType()) {
      case 'success':
        return 'pi-check-circle';
      case 'info':
        return 'pi-info-circle';
      case 'warn':
        return 'pi-exclamation-triangle';
      case 'error':
      default:
        return 'pi-times-circle';
    }
  });

  readonly resolvedTitle = computed(() => {
    if (this.title) return this.title;
    if (this.error?.status) return this.mapper.titleForStatus(this.error.status);

    switch (this.inferredType()) {
      case 'success':
        return this.mapper.ui('common.success', 'Success');
      case 'info':
        return this.mapper.ui('common.info', 'Info');
      case 'warn':
        return this.mapper.ui('common.warning', 'Warning');
      case 'error':
      default:
        return this.mapper.ui('common.error', 'Error');
    }
  });

  readonly resolvedMessage = computed(() => {
    if (this.message) return this.message;
    if (this.error) return this.mapper.message(this.error);
    return '';
  });

  readonly details = computed(() => {
    if (!this.error?.fieldErrors?.length) return [];

    return this.error.fieldErrors.map((fe) => {
      const label = this.mapper.fieldLabel(fe.field, this.fieldLabelNamespaces);
      const msg = this.mapper.fieldMessage(fe.field, fe.code, fe.userMessage, fe.userMessage);
      return label ? `${label}: ${msg}` : msg;
    });
  });

  dismiss() {
    this._visible.set(false);
    this.dismissed.emit();
  }
}

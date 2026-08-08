import { Injectable, inject } from '@angular/core';

import { MessageService } from 'primeng/api';

import { CsTagTone } from '@shared/ui';
import { I18nService } from '../i18n/i18n.service';

type ToastSeverity = CsTagTone;

export interface ToastMeta {
  context?: string;
  correlationId?: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly messageService = inject(MessageService);
  private readonly i18n = inject(I18nService);

  success(summary?: string, detail?: string, life = 4000, _meta?: ToastMeta): void {
    this.show('success', summary, detail, life);
  }

  info(summary?: string, detail?: string, life = 4000, _meta?: ToastMeta): void {
    this.show('info', summary, detail, life);
  }

  warn(summary?: string, detail?: string, life = 5000, _meta?: ToastMeta): void {
    this.show('warn', summary, detail, life);
  }

  error(summary?: string, detail?: string, life = 6000, meta?: ToastMeta): void {
    const finalDetail =
      meta?.correlationId && detail
        ? `${detail} (${this.i18n.tUi('common.correlationId' as never, 'Correlation ID')}: ${meta.correlationId})`
        : detail;

    this.show('error', summary, finalDetail, life);
  }

  private show(severity: ToastSeverity, summary?: string, detail?: string, life = 4000): void {
    this.messageService.add({
      severity,
      summary: summary || this.defaultSummary(severity),
      detail,
      life,
    });
  }

  private defaultSummary(kind: ToastSeverity): string {
    switch (kind) {
      case 'success':
        return this.i18n.tUi('common.success' as never, 'Success');
      case 'info':
        return this.i18n.tUi('common.info' as never, 'Info');
      case 'warn':
        return this.i18n.tUi('common.warning' as never, 'Warning');
      case 'error':
      default:
        return this.i18n.tUi('common.error' as never, 'Error');
    }
  }
}

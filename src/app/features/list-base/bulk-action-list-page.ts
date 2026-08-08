import { Observable } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';

import { I18nService } from '@core/i18n/i18n.service';

export abstract class BulkActionListPage {
  protected abstract readonly i18n: I18nService;
  protected abstract readonly toast: MessageService;
  protected abstract readonly confirm: ConfirmationService;

  protected abstract clearSelection(): void;

  executeAction(action$: Observable<unknown>, successDetail: string): void {
    this.clearSelection();

    action$.subscribe({
      next: () => {
        this.clearSelection();
        this.toast.add({
          severity: 'success',
          summary: this.i18n.tUi('common.success'),
          detail: successDetail,
        });
      },
      error: () => {
        this.clearSelection();
      },
    });
  }

  confirmAction(params: {
    header: string;
    message: string;
    icon: string;
    accept: () => void;
  }): void {
    this.confirm.confirm({
      header: params.header,
      message: params.message,
      icon: params.icon,
      accept: params.accept,
    });
  }
}

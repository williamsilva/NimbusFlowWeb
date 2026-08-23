import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { TranslateModule } from '@ngx-translate/core';

import { I18nService } from '@core/i18n/i18n.service';
import { CsDatePipe } from '@shared/pipes/cs-date.pipe';
import { CsCurrencyPipe } from '@shared/pipes/cs-currency.pipe';
import { PaymentsFacade } from '@features/facade/payments.facade';
import { translateWorksErrorDetail } from '@features/works/works-error.util';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { StatusBadgeComponent } from '@shared/features/status-badge/status-badge.component';
import { InstallmentsPermissionPolicy } from '@features/works/installments-permission.policy';
import { MarkInstallmentPaidDialogComponent } from '@features/works/installments/mark-installment-paid-dialog.component';
import { PaymentModel } from '@models/payments.models';
import { PaymentStatusEnum, paymentStatusTone } from '@models/enums/payment-status.enum';

/**
 * Listagem global de Pagamentos (envio consolidado de N Ordens de Pagamento de um fornecedor,
 * ver payment-orders.component.ts pra tela que os cria). Sem paginação de propósito - mesmo
 * espírito de payment-orders.component.ts (volume esperado pequeno, bem menor que o de Ordens
 * individuais).
 */
@Component({
  standalone: true,
  selector: 'app-payments-list',
  templateUrl: './payments-list.component.html',
  imports: [
    TableModule,
    ButtonModule,
    TooltipModule,
    CsDatePipe,
    CsCurrencyPipe,
    TranslateModule,
    PageHeaderComponent,
    StatusBadgeComponent,
    MarkInstallmentPaidDialogComponent,
  ],
})
export class PaymentsListComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(MessageService);

  readonly i18n = inject(I18nService);
  readonly facade = inject(PaymentsFacade);
  readonly policy = inject(InstallmentsPermissionPolicy);

  readonly markPaidDialogVisible = signal(false);
  readonly markPaidRow = signal<PaymentModel | null>(null);

  constructor() {
    this.facade.loadAll();
  }

  refresh(): void {
    this.facade.loadAll();
  }

  tone(status: string): ReturnType<typeof paymentStatusTone> {
    return paymentStatusTone(status);
  }

  canMarkPaid(row: PaymentModel): boolean {
    return row.status === PaymentStatusEnum.SENT && this.policy.canMarkPaid();
  }

  markPaidDisabledReason(row: PaymentModel): string {
    if (row.status !== PaymentStatusEnum.SENT) {
      return 'payments.action.requiresSent';
    }
    return this.policy.markPaidDisabledReason() ?? 'installments.action.noPermission';
  }

  openMarkPaidDialog(row: PaymentModel): void {
    if (!this.canMarkPaid(row)) return;
    this.markPaidRow.set(row);
    this.markPaidDialogVisible.set(true);
  }

  onMarkPaidConfirmed(paidAt: string): void {
    const row = this.markPaidRow();
    if (!row) return;

    this.facade
      .markPaid(row.id, paidAt)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.markPaidDialogVisible.set(false);
          this.toast.add({
            severity: 'success',
            summary: this.i18n.tUi('common.success'),
            detail: this.i18n.tUi('payments.markPaidConfirm.success'),
          });
        },
        error: (err) =>
          this.toast.add({
            severity: 'error',
            summary: this.i18n.tUi('common.error'),
            detail: translateWorksErrorDetail(err, this.i18n) ?? this.i18n.tUi('payments.markPaidConfirm.error'),
          }),
      });
  }
}

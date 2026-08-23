import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { TranslateModule } from '@ngx-translate/core';
import { FloatLabelModule } from 'primeng/floatlabel';

import { I18nService } from '@core/i18n/i18n.service';
import { CsDatePipe } from '@shared/pipes/cs-date.pipe';
import { CsCurrencyPipe } from '@shared/pipes/cs-currency.pipe';
import { SuppliersFacade } from '@features/facade/suppliers.facade';
import { formatSequentialNumber } from '@shared/utils/br-format';
import { translateWorksErrorDetail } from '@features/works/works-error.util';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { PaymentOrdersApiService } from '@features/service/payment-orders.api.service';
import { InstallmentsPermissionPolicy } from '@features/works/installments-permission.policy';
import { PaymentOrderCandidateModel } from '@models/payment-orders.models';

@Component({
  standalone: true,
  selector: 'app-payment-orders',
  templateUrl: './payment-orders.component.html',
  imports: [
    FormsModule,
    TableModule,
    ButtonModule,
    SelectModule,
    CsDatePipe,
    CsCurrencyPipe,
    TranslateModule,
    FloatLabelModule,
    PageHeaderComponent,
  ],
})
export class PaymentOrdersComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(MessageService);
  private readonly api = inject(PaymentOrdersApiService);
  private readonly suppliersFacade = inject(SuppliersFacade);

  readonly i18n = inject(I18nService);
  readonly policy = inject(InstallmentsPermissionPolicy);
  readonly supplierOptions = this.suppliersFacade.options;

  readonly supplierId = signal<string | null>(null);
  readonly loading = signal(false);
  readonly sending = signal(false);
  readonly candidates = signal<PaymentOrderCandidateModel[]>([]);
  readonly selected = signal<PaymentOrderCandidateModel[]>([]);

  readonly selectedTotal = computed(() =>
    this.selected().reduce((sum, c) => sum + c.amount, 0),
  );

  constructor() {
    this.suppliersFacade.loadSupplierOptions();
  }

  numberLabel(row: PaymentOrderCandidateModel): string {
    return formatSequentialNumber('PAG', row.number);
  }

  onSupplierChange(supplierId: string | null): void {
    this.supplierId.set(supplierId);
    this.selected.set([]);
    this.candidates.set([]);

    if (!supplierId) return;

    this.loading.set(true);
    this.api
      .findReleasedBySupplier(supplierId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          this.candidates.set(items);
          this.loading.set(false);
        },
        error: () => {
          this.candidates.set([]);
          this.loading.set(false);
        },
      });
  }

  send(): void {
    const selected = this.selected();
    if (selected.length === 0 || this.sending()) return;

    this.sending.set(true);
    this.api
      .sendPaymentOrder(selected.map((c) => c.id))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.sending.set(false);
          this.selected.set([]);
          this.toast.add({
            severity: 'success',
            summary: this.i18n.tUi('common.success'),
            detail: this.i18n.tUi('paymentOrders.sent', {
              count: result.orderCount,
              total: this.i18n.formatBrlCurrency(result.totalAmount),
            }),
          });
        },
        error: (err) => {
          this.sending.set(false);
          this.toast.add({
            severity: 'error',
            summary: this.i18n.tUi('common.error'),
            detail: translateWorksErrorDetail(err, this.i18n) ?? this.i18n.tUi('paymentOrders.sendError'),
          });
        },
      });
  }
}

import { FormsModule } from '@angular/forms';
import { Component, ViewChild, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';

import { finalize } from 'rxjs';

import { Table } from 'primeng/table';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { FloatLabel } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { TranslateModule } from '@ngx-translate/core';
import { ConfirmationService, MessageService } from 'primeng/api';

import { I18nService } from '@core/i18n/i18n.service';
import { CsDatePipe } from '@shared/pipes/cs-date.pipe';
import { CsCurrencyPipe } from '@shared/pipes/cs-currency.pipe';
import { STATE_KEY } from '@features/state-key.constants';
import { PaymentsFacade } from '@features/facade/payments.facade';
import { PaymentsAdvancedFilters } from '@features/filter/payments.filters';
import { StatefulListPage } from '@features/list-base/stateful-list-page';
import { buildListQuery } from '@shared/features/list-query/list-query.builder';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { InstallmentsPermissionPolicy } from '@features/works/installments-permission.policy';
import { formatSequentialNumber } from '@shared/utils/br-format';
import { StatusBadgeComponent } from '@shared/features/status-badge/status-badge.component';
import { PaymentModel, PaymentsFiltersState } from '@models/payments.models';
import { PAYMENT_STATUS_VALUES, PaymentStatusEnum, paymentStatusTone } from '@models/enums/payment-status.enum';
import { PeriodEnum, allPeriodEnum, periodEnumLabel } from '@models/enums/period.enum';
import { MarkInstallmentPaidDialogComponent } from '@features/works/installments/mark-installment-paid-dialog.component';
import { CsAdvancedPeriodDateFilterComponent } from '@features/list-base/cs-advanced-period-date-filter.component';
import {
  currencyRangeLabel,
  CsCurrencyRangeFilterComponent,
} from '@features/list-base/cs-currency-range-filter.component';
import {
  ActiveFilterItem,
  FiltersPanelComponent,
} from '@shared/features/filters-panel/filters-panel.component';
import {
  readSingleFilterValue,
  readArrayFilterValues,
  readDateRangeFilterValue,
} from '@features/list-base/table-filter-readers';
import { translateWorksErrorDetail } from '@features/works/works-error.util';

/** Listagem global paginada/filtrada/ordenada de Pagamentos (envio consolidado de N Ordens de
 *  Pagamento de um fornecedor, ver payment-orders.component.ts pra tela que os cria) - mesmo
 *  padrão StatefulListPage de AllInstallmentsListComponent (do lado da Ordem). Expandir a linha
 *  mostra todas as Ordens incluídas nesse envio (podendo ser de obras/projetos diferentes). */
@Component({
  standalone: true,
  selector: 'app-payments-list',
  templateUrl: './payments-list.component.html',
  styleUrl: './payments-list.component.scss',
  imports: [
    FloatLabel,
    FormsModule,
    TableModule,
    ButtonModule,
    CsDatePipe,
    CsCurrencyPipe,
    TooltipModule,
    InputTextModule,
    TranslateModule,
    MultiSelectModule,
    PageHeaderComponent,
    StatusBadgeComponent,
    FiltersPanelComponent,
    CsCurrencyRangeFilterComponent,
    CsAdvancedPeriodDateFilterComponent,
    MarkInstallmentPaidDialogComponent,
  ],
})
export class PaymentsListComponent extends StatefulListPage<
  PaymentsFiltersState,
  PaymentsAdvancedFilters
> {
  @ViewChild('dt') private dt?: Table;
  private readonly destroyRef = inject(DestroyRef);

  protected override readonly i18n = inject(I18nService);
  readonly facade = inject(PaymentsFacade);
  readonly policy = inject(InstallmentsPermissionPolicy);
  private readonly toast = inject(MessageService);
  private readonly confirm = inject(ConfirmationService);

  readonly markPaidDialogVisible = signal(false);
  readonly markPaidRow = signal<PaymentModel | null>(null);

  /** id do Pagamento com reenvio de notificação em andamento (no máximo 1 por vez) - trava só o
   *  botão dessa linha pra evitar duplo clique, o resto da tela continua usável. */
  readonly resendingId = signal<string | null>(null);

  override rows =
    Number(localStorage.getItem(this.tableRowsKey())) || StatefulListPage.DEFAULT_ROWS;

  supplierName = signal('');
  status = signal<string[] | null>(null);
  amountFrom = signal<number | null>(null);
  amountTo = signal<number | null>(null);
  sentAt = signal<string | string[] | null>(null);
  periodSentAt = signal<PeriodEnum | null>(null);

  readonly periodEnumOptions = computed(() => {
    this.i18n.getAppliedLang();
    return allPeriodEnum().map((value) => ({ label: periodEnumLabel(value, this.i18n), value }));
  });

  readonly totalRecords = computed(() => this.facade.totalRecords());
  readonly items = computed<PaymentModel[]>(() => this.facade.items());
  readonly loading = computed(() => this.facade.loading());
  readonly loadedOnce = computed(() => this.facade.loadedOnce());

  readonly statusOptions = computed(() => {
    this.i18n.getAppliedLang();
    return PAYMENT_STATUS_VALUES.map((value) => ({
      value,
      label: this.i18n.tUi(`payments.status.${value}` as never),
    }));
  });

  protected override readonly advancedActiveFilters = computed<ActiveFilterItem[]>(() => {
    const items: ActiveFilterItem[] = [];

    const supplierName = this.supplierName().trim();
    const status = this.status();
    const amountFrom = this.amountFrom();
    const amountTo = this.amountTo();

    if (supplierName) {
      items.push({ label: this.i18n.tUi('payments.fields.supplier'), value: supplierName });
    }
    if (status?.length) {
      const labels = this.statusOptions()
        .filter((opt) => status.includes(opt.value))
        .map((opt) => opt.label)
        .join(', ');
      items.push({ label: this.i18n.tUi('payments.fields.status'), value: labels });
    }
    const amountLabel = currencyRangeLabel(this.i18n, amountFrom, amountTo);
    if (amountLabel) {
      items.push({ label: this.i18n.tUi('payments.fields.amount'), value: amountLabel });
    }
    const sentAtLabel = this.formatActiveFilterPeriodDateValue(
      this.periodSentAt(),
      this.sentAt(),
      this.i18n,
    );
    if (sentAtLabel) {
      items.push({ label: this.i18n.tUi('payments.fields.sentAt'), value: sentAtLabel });
    }

    return items;
  });

  ngOnInit() {
    this.initStatefulList();
  }

  tone(status: string): ReturnType<typeof paymentStatusTone> {
    return paymentStatusTone(status);
  }

  clear() {
    this.clearTableAndReload(this.dt);
  }

  /** Sequencial por obra com prefixo "PAG-" (ex.: PAG-0001) - mesma formatação da Ordem, usado
   *  na tabela de Ordens vinculadas ao expandir a linha. */
  orderNumberLabel(number: number): string {
    return formatSequentialNumber('PAG', number);
  }

  canMarkPaid(row: PaymentModel): boolean {
    return row.status === PaymentStatusEnum.SENT && this.policy.canMarkPaid();
  }

  markPaidDisabledReason(row: PaymentModel): string {
    if (row.status !== PaymentStatusEnum.SENT) {
      return 'payments.action.alreadyPaid';
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
            detail:
              translateWorksErrorDetail(err, this.i18n) ??
              this.i18n.tUi('payments.markPaidConfirm.error'),
          }),
      });
  }

  /** Ação nova (2026-08-24, movida do conceito equivalente por Ordem em "Parcelas Liberadas" a
   *  pedido do usuário) - reenvia o e-mail com o PDF consolidado deste Pagamento, mesma authority
   *  de enviar (ver policy.canSendPaymentOrder()/InstallmentService.resendNotification). Sem
   *  restrição por status: útil tanto pra um pagamento SENT quanto já PAID (ex.: o financeiro
   *  perdeu o e-mail original). */
  canResendNotification(): boolean {
    return this.policy.canSendPaymentOrder();
  }

  resendNotificationDisabledReason(): string {
    return 'installments.action.noPermission';
  }

  confirmResendNotification(row: PaymentModel): void {
    if (!this.canResendNotification() || this.resendingId()) return;

    this.confirm.confirm({
      header: this.i18n.tUi('payments.resendNotificationConfirm.header'),
      message: this.i18n.tUi('payments.resendNotificationConfirm.message', {
        supplier: row.supplierName,
      }),
      icon: 'pi pi-question-circle',
      accept: () => {
        this.resendingId.set(row.id);
        this.facade
          .resendNotification(row.id)
          .pipe(finalize(() => this.resendingId.set(null)), takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () =>
              this.toast.add({
                severity: 'success',
                summary: this.i18n.tUi('common.success'),
                detail: this.i18n.tUi('payments.resendNotificationConfirm.success'),
              }),
            error: (err) =>
              this.toast.add({
                severity: 'error',
                summary: this.i18n.tUi('common.error'),
                detail:
                  translateWorksErrorDetail(err, this.i18n) ??
                  this.i18n.tUi('payments.resendNotificationConfirm.error'),
              }),
          });
      },
    });
  }

  protected formatDate(value: Date | string): string {
    const date = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat(this.i18n.getLang(), { dateStyle: 'short' }).format(date);
  }

  protected override tableStateKey(): string {
    return STATE_KEY.NIMBUSFLOW.WORKS.PAYMENTS.TABLE.STATE.V1;
  }

  protected override tableRowsKey(): string {
    return STATE_KEY.NIMBUSFLOW.WORKS.PAYMENTS.TABLE.ROWS.V1;
  }

  protected override filtersKey(): string {
    return STATE_KEY.NIMBUSFLOW.WORKS.PAYMENTS.FILTERS.V1;
  }

  protected override refresh(): void {
    this.reloadWithCurrentState();
  }

  protected override resetFilters(): void {
    this.supplierName.set('');
    this.status.set(null);
    this.amountFrom.set(null);
    this.amountTo.set(null);
    this.sentAt.set(null);
    this.periodSentAt.set(null);
  }

  protected override toFiltersState(): PaymentsFiltersState {
    return {
      supplierName: this.supplierName(),
      status: this.status()?.length ? this.status() : null,
      amountFrom: this.amountFrom(),
      amountTo: this.amountTo(),
      sentAt: this.sentAt(),
      periodSentAt: this.periodSentAt(),
    };
  }

  protected override applyFiltersState(state: PaymentsFiltersState): void {
    this.supplierName.set(state.supplierName ?? '');
    this.status.set(state.status ?? null);
    this.amountFrom.set(state.amountFrom ?? null);
    this.amountTo.set(state.amountTo ?? null);
    this.sentAt.set(state.sentAt ?? null);
    this.periodSentAt.set(state.periodSentAt ?? null);
  }

  protected override buildAdvancedFilters(): Partial<PaymentsAdvancedFilters> {
    return {
      supplierName: this.supplierName().trim() || undefined,
      status: this.status()?.length ? this.status() : undefined,
      amountFrom: this.amountFrom() ?? undefined,
      amountTo: this.amountTo() ?? undefined,
      sentAt: this.sentAt() ?? undefined,
      periodSentAt: this.periodSentAt() ?? undefined,
    };
  }

  protected override mapTableFiltersToActiveItems(filters: any): ActiveFilterItem[] {
    this.i18n.getAppliedLang();

    const items: ActiveFilterItem[] = [];

    const supplierName = readSingleFilterValue(filters, 'supplierName');
    if (supplierName) {
      items.push({ label: this.i18n.tUi('payments.fields.supplier'), value: supplierName });
    }

    const statusValues = readArrayFilterValues(filters, 'status');
    if (statusValues.length) {
      const labels = this.statusOptions()
        .filter((option) => statusValues.includes(option.value))
        .map((option) => option.label);
      items.push({
        label: this.i18n.tUi('payments.fields.status'),
        value: (labels.length ? labels : statusValues).join(', '),
      });
    }

    const sentAt = readDateRangeFilterValue(filters, 'sentAt', this.formatDate.bind(this));
    if (sentAt) {
      items.push({ label: this.i18n.tUi('payments.fields.sentAt'), value: sentAt });
    }

    return items;
  }

  protected override loadPage(
    query: ReturnType<typeof buildListQuery<PaymentsAdvancedFilters>>,
  ): void {
    this.facade.loadPage(query);
  }

  protected override loadFirstPage(): void {}
}

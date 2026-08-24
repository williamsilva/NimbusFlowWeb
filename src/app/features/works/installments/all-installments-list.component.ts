import { FormsModule } from '@angular/forms';
import { Component, ViewChild, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';

import { Table } from 'primeng/table';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { FloatLabel } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { MultiSelectModule } from 'primeng/multiselect';
import { TranslateModule } from '@ngx-translate/core';
import { ConfirmationService, MessageService } from 'primeng/api';

import { I18nService } from '@core/i18n/i18n.service';
import { CsDatePipe } from '@shared/pipes/cs-date.pipe';
import { DateInputMaskDirective } from '@shared/directives/date-input-mask.directive';
import { CsCurrencyPipe } from '@shared/pipes/cs-currency.pipe';
import { STATE_KEY } from '@features/state-key.constants';
import { InstallmentsGlobalFacade } from '@features/facade/installments-global.facade';
import { InstallmentsAdvancedFilters } from '@features/filter/installments.filters';
import { StatefulListPage } from '@features/list-base/stateful-list-page';
import { buildListQuery } from '@shared/features/list-query/list-query.builder';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { InstallmentsPermissionPolicy } from '@features/works/installments-permission.policy';
import { formatApprovalRanges } from '@features/works/installments/installments-approval-range.util';
import { formatSequentialNumber } from '@shared/utils/br-format';
import { StatusBadgeComponent } from '@shared/features/status-badge/status-badge.component';
import { InstallmentWithWorkModel, InstallmentsFiltersState } from '@models/installments.models';
import { PeriodEnum, allPeriodEnum, periodEnumLabel } from '@models/enums/period.enum';
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
import {
  INSTALLMENT_STATUS_VALUES,
  InstallmentStatusEnum,
  installmentStatusTone,
} from '@models/enums/installment-status.enum';
import { translateWorksErrorDetail } from '@features/works/works-error.util';

@Component({
  standalone: true,
  selector: 'app-all-installments-list',
  templateUrl: './all-installments-list.component.html',
  styleUrl: './all-installments-list.component.scss',
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
    DatePickerModule,
    MultiSelectModule,
    PageHeaderComponent,
    StatusBadgeComponent,
    FiltersPanelComponent,
    CsCurrencyRangeFilterComponent,
    CsAdvancedPeriodDateFilterComponent,
    DateInputMaskDirective,
  ],
})
export class AllInstallmentsListComponent extends StatefulListPage<
  InstallmentsFiltersState,
  InstallmentsAdvancedFilters
> {
  @ViewChild('dt') private dt?: Table;
  private readonly destroyRef = inject(DestroyRef);

  protected override readonly i18n = inject(I18nService);
  readonly facade = inject(InstallmentsGlobalFacade);
  readonly policy = inject(InstallmentsPermissionPolicy);
  private readonly toast = inject(MessageService);
  private readonly confirm = inject(ConfirmationService);

  override rows =
    Number(localStorage.getItem(this.tableRowsKey())) || StatefulListPage.DEFAULT_ROWS;

  /** Seleção pro envio (ver send()) - mantida entre páginas de propósito: o dataKey="id" da
   *  tabela deixa o PrimeNG reconciliar quem está marcado mesmo trocando de página, então
   *  seleção nunca é limitada à página atual. */
  readonly selection = signal<InstallmentWithWorkModel[]>([]);
  readonly sending = signal(false);

  readonly selectedTotal = computed(() =>
    this.selection().reduce((sum, r) => sum + r.amount, 0),
  );

  workName = signal('');
  status = signal<string[] | null>(this.defaultStatus());
  amountFrom = signal<number | null>(null);
  amountTo = signal<number | null>(null);
  dueDate = signal<string | string[] | null>(null);
  periodDueDate = signal<PeriodEnum | null>(null);

  readonly periodEnumOptions = computed(() => {
    this.i18n.getAppliedLang();
    return allPeriodEnum().map((value) => ({ label: periodEnumLabel(value, this.i18n), value }));
  });

  readonly totalRecords = computed(() => this.facade.totalRecords());
  readonly items = computed<InstallmentWithWorkModel[]>(() => this.facade.items());
  readonly loading = computed(() => this.facade.loading());
  readonly loadedOnce = computed(() => this.facade.loadedOnce());

  readonly statusOptions = computed(() => {
    this.i18n.getAppliedLang();
    return INSTALLMENT_STATUS_VALUES.map((value) => ({
      value,
      label: this.i18n.tUi(`installments.status.${value}` as never),
    }));
  });

  protected override readonly advancedActiveFilters = computed<ActiveFilterItem[]>(() => {
    const items: ActiveFilterItem[] = [];

    const workName = this.workName().trim();
    const status = this.status();
    const amountFrom = this.amountFrom();
    const amountTo = this.amountTo();

    if (workName) {
      items.push({ label: this.i18n.tUi('installments.fields.work'), value: workName });
    }
    if (status?.length) {
      const labels = this.statusOptions()
        .filter((opt) => status.includes(opt.value))
        .map((opt) => opt.label)
        .join(', ');
      items.push({ label: this.i18n.tUi('installments.fields.status'), value: labels });
    }
    const amountLabel = currencyRangeLabel(this.i18n, amountFrom, amountTo);
    if (amountLabel) {
      items.push({ label: this.i18n.tUi('installments.fields.amount'), value: amountLabel });
    }
    const dueDateLabel = this.formatActiveFilterPeriodDateValue(
      this.periodDueDate(),
      this.dueDate(),
      this.i18n,
    );
    if (dueDateLabel) {
      items.push({ label: this.i18n.tUi('installments.fields.dueDate'), value: dueDateLabel });
    }

    return items;
  });

  ngOnInit() {
    this.initStatefulList();
  }

  tone(status: string): ReturnType<typeof installmentStatusTone> {
    return installmentStatusTone(status);
  }

  clear() {
    this.selection.set([]);
    this.clearTableAndReload(this.dt);
  }

  /** row.canRelease já cobre status MEASUREMENT_APPROVED + permissão/alçada (ver
   *  InstallmentService.canReleasePending) - mesmo padrão de AddendumModel.canDecide, não
   *  recalcular no cliente. */
  canRelease(row: InstallmentWithWorkModel): boolean {
    return row.canRelease;
  }

  releaseDisabledReason(row: InstallmentWithWorkModel): string {
    if (row.status !== InstallmentStatusEnum.MEASUREMENT_APPROVED) {
      return 'installments.action.requiresMeasurementApproved';
    }
    return 'installments.action.noPermission';
  }

  approvalRangeLabel(row: InstallmentWithWorkModel): string {
    return formatApprovalRanges(this.i18n, row.approvalRanges);
  }

  /** Sequencial por obra com prefixo "PAG-" (ex.: PAG-0001) - mesmo padrão de
   *  Addendums/MeasurementsListComponent ("ADT-"/"MED-"). */
  numberLabel(row: InstallmentWithWorkModel): string {
    return this.orderNumberLabel(row.number);
  }

  orderNumberLabel(number: number): string {
    return formatSequentialNumber('PAG', number);
  }

  canResendNotification(row: InstallmentWithWorkModel): boolean {
    return (
      (row.status === InstallmentStatusEnum.RELEASED ||
        row.status === InstallmentStatusEnum.CANCELLED) &&
      this.policy.canResendNotification()
    );
  }

  resendNotificationDisabledReason(row: InstallmentWithWorkModel): string {
    if (
      row.status !== InstallmentStatusEnum.RELEASED &&
      row.status !== InstallmentStatusEnum.CANCELLED
    ) {
      return 'installments.action.requiresReleasedOrCancelled';
    }
    return this.policy.resendNotificationDisabledReason() ?? 'installments.action.noPermission';
  }

  confirmRelease(row: InstallmentWithWorkModel): void {
    if (!this.canRelease(row)) return;

    this.confirm.confirm({
      header: this.i18n.tUi('installments.releaseConfirm.header'),
      message: this.i18n.tUi('installments.releaseConfirm.message', {
        number: this.numberLabel(row),
      }),
      icon: 'pi pi-question-circle',
      accept: () => {
        this.facade
          .release(row.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () =>
              this.toast.add({
                severity: 'success',
                summary: this.i18n.tUi('common.success'),
                detail: this.i18n.tUi('installments.releaseConfirm.success'),
              }),
            error: (err) =>
              this.toast.add({
                severity: 'error',
                summary: this.i18n.tUi('common.error'),
                detail:
                  translateWorksErrorDetail(err, this.i18n) ??
                  this.i18n.tUi('installments.form.saveError'),
              }),
          });
      },
    });
  }

  confirmResendNotification(row: InstallmentWithWorkModel): void {
    if (!this.canResendNotification(row)) return;

    this.confirm.confirm({
      header: this.i18n.tUi('installments.resendNotificationConfirm.header'),
      message: this.i18n.tUi('installments.resendNotificationConfirm.message', {
        number: this.numberLabel(row),
      }),
      icon: 'pi pi-question-circle',
      accept: () => {
        this.facade
          .resendNotification(row.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () =>
              this.toast.add({
                severity: 'success',
                summary: this.i18n.tUi('common.success'),
                detail: this.i18n.tUi('installments.resendNotificationConfirm.success'),
              }),
            error: (err) =>
              this.toast.add({
                severity: 'error',
                summary: this.i18n.tUi('common.error'),
                detail:
                  translateWorksErrorDetail(err, this.i18n) ??
                  this.i18n.tUi('installments.form.saveError'),
              }),
          });
      },
    });
  }

  /** Só Ordens RELEASED (e, pelo filtro do backend, ainda não enviadas - ver
   *  PaymentOrderService.filterOrders) podem entrar num envio. */
  canSelectForSend(row: InstallmentWithWorkModel): boolean {
    return row.status === InstallmentStatusEnum.RELEASED;
  }

  /** Passada pro [rowSelectable] da tabela - o PrimeNG usa isso tanto pro checkbox de cada linha
   *  quanto pro "selecionar tudo" do cabeçalho (nunca marca uma linha não-RELEASED mesmo em
   *  "selecionar tudo"). [disabled] do <p-tableCheckbox> de cada linha (canSelectForSend) ainda
   *  é necessário à parte - o PrimeNG não deriva o estado visual/clique do checkbox a partir
   *  disso automaticamente. */
  readonly rowSelectable = (event: { data: InstallmentWithWorkModel }): boolean =>
    this.canSelectForSend(event.data);

  onSelectionChange(selection: InstallmentWithWorkModel[]): void {
    this.selection.set(selection);
  }

  /** Ação da extinta tela "Ordens de Pagamento" (2026-08-24: incorporada aqui, a pedido do
   *  usuário, pra não precisar escolher fornecedor antes de ver as Ordens) - seleciona N Ordens
   *  RELEASED do mesmo fornecedor e gera 1 Pagamento consolidado. Fornecedor único é validado
   *  aqui ANTES de chamar a API (evita um round-trip só pra descobrir um erro que já dá pra
   *  checar no cliente) - o backend valida de novo mesmo assim (defesa em profundidade). */
  send(): void {
    const selected = this.selection();
    if (selected.length === 0 || this.sending()) return;

    const supplierNames = new Set(selected.map((r) => r.supplierName));
    if (supplierNames.size > 1) {
      this.toast.add({
        severity: 'error',
        summary: this.i18n.tUi('common.error'),
        detail: this.i18n.tUi('paymentOrders.action.differentSuppliers'),
      });
      return;
    }

    this.sending.set(true);
    this.facade
      .sendPaymentOrder(selected.map((r) => r.id))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.sending.set(false);
          this.selection.set([]);
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

  protected formatDate(value: Date | string): string {
    const date = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat(this.i18n.getLang(), { dateStyle: 'short' }).format(date);
  }

  protected override tableStateKey(): string {
    return STATE_KEY.NIMBUSFLOW.WORKS.ALL_INSTALLMENTS.TABLE.STATE.V1;
  }

  protected override tableRowsKey(): string {
    return STATE_KEY.NIMBUSFLOW.WORKS.ALL_INSTALLMENTS.TABLE.ROWS.V1;
  }

  protected override filtersKey(): string {
    return STATE_KEY.NIMBUSFLOW.WORKS.ALL_INSTALLMENTS.FILTERS.V1;
  }

  protected override refresh(): void {
    this.selection.set([]);
    this.reloadWithCurrentState();
  }

  /** Mesmo padrão do WorksListComponent (status pré-selecionado): "Aguardando liberação"+
   *  "Liberada" pré-selecionados, mas só quando o painel de filtros está vazio de verdade (nem
   *  restaurado do localStorage, nem definido pelo usuário) - ver
   *  applyDefaultAdvancedFiltersIfEmpty em StatefulListPage. */
  private defaultStatus(): string[] {
    return [InstallmentStatusEnum.MEASUREMENT_APPROVED, InstallmentStatusEnum.RELEASED];
  }

  protected override applyDefaultAdvancedFilters(): void {
    this.status.set(this.defaultStatus());
  }

  protected override resetFilters(): void {
    this.workName.set('');
    this.status.set(null);
    this.amountFrom.set(null);
    this.amountTo.set(null);
    this.dueDate.set(null);
    this.periodDueDate.set(null);
    this.applyDefaultAdvancedFiltersIfEmpty();
  }

  protected override toFiltersState(): InstallmentsFiltersState {
    return {
      workName: this.workName(),
      status: this.status()?.length ? this.status() : null,
      amountFrom: this.amountFrom(),
      amountTo: this.amountTo(),
      dueDate: this.dueDate(),
      periodDueDate: this.periodDueDate(),
    };
  }

  protected override applyFiltersState(state: InstallmentsFiltersState): void {
    this.workName.set(state.workName ?? '');
    this.status.set(state.status ?? null);
    this.amountFrom.set(state.amountFrom ?? null);
    this.amountTo.set(state.amountTo ?? null);
    this.dueDate.set(state.dueDate ?? null);
    this.periodDueDate.set(state.periodDueDate ?? null);
    this.applyDefaultAdvancedFiltersIfEmpty();
  }

  protected override buildAdvancedFilters(): Partial<InstallmentsAdvancedFilters> {
    return {
      workName: this.workName().trim() || undefined,
      status: this.status()?.length ? this.status() : undefined,
      amountFrom: this.amountFrom() ?? undefined,
      amountTo: this.amountTo() ?? undefined,
      dueDate: this.dueDate() ?? undefined,
      periodDueDate: this.periodDueDate() ?? undefined,
    };
  }

  protected override mapTableFiltersToActiveItems(filters: any): ActiveFilterItem[] {
    this.i18n.getAppliedLang();

    const items: ActiveFilterItem[] = [];

    const workName = readSingleFilterValue(filters, 'workName');
    if (workName) {
      items.push({ label: this.i18n.tUi('installments.fields.work'), value: workName });
    }

    const statusValues = readArrayFilterValues(filters, 'status');
    if (statusValues.length) {
      const labels = this.statusOptions()
        .filter((option) => statusValues.includes(option.value))
        .map((option) => option.label);
      items.push({
        label: this.i18n.tUi('installments.fields.status'),
        value: (labels.length ? labels : statusValues).join(', '),
      });
    }

    const dueDate = readDateRangeFilterValue(filters, 'dueDate', this.formatDate.bind(this));
    if (dueDate) {
      items.push({ label: this.i18n.tUi('installments.fields.dueDate'), value: dueDate });
    }

    return items;
  }

  protected override loadPage(
    query: ReturnType<typeof buildListQuery<InstallmentsAdvancedFilters>>,
  ): void {
    this.facade.loadPage(query);
  }

  protected override loadFirstPage(): void {}
}

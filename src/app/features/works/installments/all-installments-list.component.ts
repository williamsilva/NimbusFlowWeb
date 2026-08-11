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
import { CsCurrencyPipe } from '@shared/pipes/cs-currency.pipe';
import { STATE_KEY } from '@features/state-key.constants';
import { InstallmentsGlobalFacade } from '@features/facade/installments-global.facade';
import { InstallmentsAdvancedFilters } from '@features/filter/installments.filters';
import { StatefulListPage } from '@features/list-base/stateful-list-page';
import { buildListQuery } from '@shared/features/list-query/list-query.builder';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { InstallmentsPermissionPolicy } from '@features/works/installments-permission.policy';
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

  workName = signal('');
  status = signal<string[] | null>(null);
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
    this.clearTableAndReload(this.dt);
  }

  canRelease(row: InstallmentWithWorkModel): boolean {
    return row.status === InstallmentStatusEnum.MEASUREMENT_APPROVED && this.policy.canRelease();
  }

  releaseDisabledReason(row: InstallmentWithWorkModel): string {
    if (row.status !== InstallmentStatusEnum.MEASUREMENT_APPROVED) {
      return 'installments.action.requiresMeasurementApproved';
    }
    return this.policy.releaseDisabledReason() ?? 'installments.action.noPermission';
  }

  canMarkPaid(row: InstallmentWithWorkModel): boolean {
    return row.status === InstallmentStatusEnum.RELEASED && this.policy.canMarkPaid();
  }

  markPaidDisabledReason(row: InstallmentWithWorkModel): string {
    if (row.status !== InstallmentStatusEnum.RELEASED) {
      return 'installments.action.requiresReleased';
    }
    return this.policy.markPaidDisabledReason() ?? 'installments.action.noPermission';
  }

  confirmRelease(row: InstallmentWithWorkModel): void {
    if (!this.canRelease(row)) return;

    this.confirm.confirm({
      header: this.i18n.tUi('installments.releaseConfirm.header'),
      message: this.i18n.tUi('installments.releaseConfirm.message', {
        number: row.number,
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

  confirmMarkPaid(row: InstallmentWithWorkModel): void {
    if (!this.canMarkPaid(row)) return;

    this.confirm.confirm({
      header: this.i18n.tUi('installments.markPaidConfirm.header'),
      message: this.i18n.tUi('installments.markPaidConfirm.message', {
        number: row.number,
      }),
      icon: 'pi pi-question-circle',
      accept: () => {
        this.facade
          .markPaid(row.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () =>
              this.toast.add({
                severity: 'success',
                summary: this.i18n.tUi('common.success'),
                detail: this.i18n.tUi('installments.markPaidConfirm.success'),
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
    this.reloadWithCurrentState();
  }

  protected override resetFilters(): void {
    this.workName.set('');
    this.status.set(null);
    this.amountFrom.set(null);
    this.amountTo.set(null);
    this.dueDate.set(null);
    this.periodDueDate.set(null);
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

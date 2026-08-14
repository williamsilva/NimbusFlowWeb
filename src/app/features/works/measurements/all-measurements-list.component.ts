import { DecimalPipe } from '@angular/common';
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
import { MeasurementsGlobalFacade } from '@features/facade/measurements-global.facade';
import { MeasurementsAdvancedFilters } from '@features/filter/measurements.filters';
import { StatefulListPage } from '@features/list-base/stateful-list-page';
import { buildListQuery } from '@shared/features/list-query/list-query.builder';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { MeasurementsPermissionPolicy } from '@features/works/measurements-permission.policy';
import { StatusBadgeComponent } from '@shared/features/status-badge/status-badge.component';
import { MeasurementWithContextModel, MeasurementsFiltersState } from '@models/measurements.models';
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
  MEASUREMENT_STATUS_VALUES,
  MeasurementStatusEnum,
  measurementStatusTone,
} from '@models/enums/measurement-status.enum';
import { translateWorksErrorDetail } from '@features/works/works-error.util';

@Component({
  standalone: true,
  selector: 'app-all-measurements-list',
  templateUrl: './all-measurements-list.component.html',
  imports: [
    FloatLabel,
    DecimalPipe,
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
export class AllMeasurementsListComponent extends StatefulListPage<
  MeasurementsFiltersState,
  MeasurementsAdvancedFilters
> {
  @ViewChild('dt') private dt?: Table;
  private readonly destroyRef = inject(DestroyRef);

  protected override readonly i18n = inject(I18nService);
  readonly facade = inject(MeasurementsGlobalFacade);
  readonly policy = inject(MeasurementsPermissionPolicy);
  private readonly toast = inject(MessageService);
  private readonly confirm = inject(ConfirmationService);

  override rows =
    Number(localStorage.getItem(this.tableRowsKey())) || StatefulListPage.DEFAULT_ROWS;

  workName = signal('');
  description = signal('');
  status = signal<string[] | null>(null);
  amountToPayFrom = signal<number | null>(null);
  amountToPayTo = signal<number | null>(null);
  dueDate = signal<string | string[] | null>(null);
  periodDueDate = signal<PeriodEnum | null>(null);

  readonly periodEnumOptions = computed(() => {
    this.i18n.getAppliedLang();
    return allPeriodEnum().map((value) => ({ label: periodEnumLabel(value, this.i18n), value }));
  });

  readonly totalRecords = computed(() => this.facade.totalRecords());
  readonly items = computed<MeasurementWithContextModel[]>(() => this.facade.items());
  readonly loading = computed(() => this.facade.loading());
  readonly loadedOnce = computed(() => this.facade.loadedOnce());

  readonly statusOptions = computed(() => {
    this.i18n.getAppliedLang();
    return MEASUREMENT_STATUS_VALUES.map((value) => ({
      value,
      label: this.i18n.tUi(`measurements.status.${value}` as never),
    }));
  });

  protected override readonly advancedActiveFilters = computed<ActiveFilterItem[]>(() => {
    const items: ActiveFilterItem[] = [];

    const workName = this.workName().trim();
    const description = this.description().trim();
    const status = this.status();
    const amountToPayFrom = this.amountToPayFrom();
    const amountToPayTo = this.amountToPayTo();

    if (workName) {
      items.push({ label: this.i18n.tUi('measurements.fields.work'), value: workName });
    }
    if (description) {
      items.push({ label: this.i18n.tUi('measurements.fields.description'), value: description });
    }
    if (status?.length) {
      const labels = this.statusOptions()
        .filter((opt) => status.includes(opt.value))
        .map((opt) => opt.label)
        .join(', ');
      items.push({ label: this.i18n.tUi('measurements.fields.status'), value: labels });
    }
    const amountLabel = currencyRangeLabel(this.i18n, amountToPayFrom, amountToPayTo);
    if (amountLabel) {
      items.push({ label: this.i18n.tUi('measurements.fields.amountToPay'), value: amountLabel });
    }
    const dueDateLabel = this.formatActiveFilterPeriodDateValue(
      this.periodDueDate(),
      this.dueDate(),
      this.i18n,
    );
    if (dueDateLabel) {
      items.push({ label: this.i18n.tUi('measurements.fields.dueDate'), value: dueDateLabel });
    }

    return items;
  });

  ngOnInit() {
    this.initStatefulList();
  }

  tone(status: string): ReturnType<typeof measurementStatusTone> {
    return measurementStatusTone(status);
  }

  isPending(row: MeasurementWithContextModel): boolean {
    return row.status === MeasurementStatusEnum.PENDING;
  }

  canDecide(row: MeasurementWithContextModel): boolean {
    return this.isPending(row) && this.policy.canDecide();
  }

  decideDisabledReason(row: MeasurementWithContextModel): string {
    if (!this.isPending(row)) {
      return 'measurements.action.alreadyDecided';
    }
    return this.policy.decideDisabledReason() ?? 'measurements.action.noPermission';
  }

  clear() {
    this.clearTableAndReload(this.dt);
  }

  confirmApprove(row: MeasurementWithContextModel): void {
    if (!this.canDecide(row)) return;

    this.confirm.confirm({
      header: this.i18n.tUi('measurements.approveConfirm.header'),
      message: this.i18n.tUi('measurements.approveConfirm.message'),
      icon: 'pi pi-question-circle',
      accept: () => {
        this.facade
          .approve(row.id, { decisionNote: null })
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () =>
              this.toast.add({
                severity: 'success',
                summary: this.i18n.tUi('common.success'),
                detail: this.i18n.tUi('measurements.approveConfirm.success'),
              }),
            error: (err) =>
              this.toast.add({
                severity: 'error',
                summary: this.i18n.tUi('common.error'),
                detail:
                  translateWorksErrorDetail(err, this.i18n) ??
                  this.i18n.tUi('measurements.form.saveError'),
              }),
          });
      },
    });
  }

  confirmReject(row: MeasurementWithContextModel): void {
    if (!this.canDecide(row)) return;

    this.confirm.confirm({
      header: this.i18n.tUi('measurements.rejectConfirm.header'),
      message: this.i18n.tUi('measurements.rejectConfirm.message'),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.facade
          .reject(row.id, { decisionNote: null })
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () =>
              this.toast.add({
                severity: 'success',
                summary: this.i18n.tUi('common.success'),
                detail: this.i18n.tUi('measurements.rejectConfirm.success'),
              }),
            error: (err) =>
              this.toast.add({
                severity: 'error',
                summary: this.i18n.tUi('common.error'),
                detail:
                  translateWorksErrorDetail(err, this.i18n) ??
                  this.i18n.tUi('measurements.form.saveError'),
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
    return STATE_KEY.NIMBUSFLOW.WORKS.ALL_MEASUREMENTS.TABLE.STATE.V1;
  }

  protected override tableRowsKey(): string {
    return STATE_KEY.NIMBUSFLOW.WORKS.ALL_MEASUREMENTS.TABLE.ROWS.V1;
  }

  protected override filtersKey(): string {
    return STATE_KEY.NIMBUSFLOW.WORKS.ALL_MEASUREMENTS.FILTERS.V1;
  }

  protected override refresh(): void {
    this.reloadWithCurrentState();
  }

  protected override resetFilters(): void {
    this.workName.set('');
    this.description.set('');
    this.status.set(null);
    this.amountToPayFrom.set(null);
    this.amountToPayTo.set(null);
    this.dueDate.set(null);
    this.periodDueDate.set(null);
  }

  protected override toFiltersState(): MeasurementsFiltersState {
    return {
      workName: this.workName(),
      description: this.description(),
      status: this.status()?.length ? this.status() : null,
      amountToPayFrom: this.amountToPayFrom(),
      amountToPayTo: this.amountToPayTo(),
      dueDate: this.dueDate(),
      periodDueDate: this.periodDueDate(),
    };
  }

  protected override applyFiltersState(state: MeasurementsFiltersState): void {
    this.workName.set(state.workName ?? '');
    this.description.set(state.description ?? '');
    this.status.set(state.status ?? null);
    this.amountToPayFrom.set(state.amountToPayFrom ?? null);
    this.amountToPayTo.set(state.amountToPayTo ?? null);
    this.dueDate.set(state.dueDate ?? null);
    this.periodDueDate.set(state.periodDueDate ?? null);
  }

  protected override buildAdvancedFilters(): Partial<MeasurementsAdvancedFilters> {
    return {
      workName: this.workName().trim() || undefined,
      description: this.description().trim() || undefined,
      status: this.status()?.length ? this.status() : undefined,
      amountToPayFrom: this.amountToPayFrom() ?? undefined,
      amountToPayTo: this.amountToPayTo() ?? undefined,
      dueDate: this.dueDate() ?? undefined,
      periodDueDate: this.periodDueDate() ?? undefined,
    };
  }

  protected override mapTableFiltersToActiveItems(filters: any): ActiveFilterItem[] {
    this.i18n.getAppliedLang();

    const items: ActiveFilterItem[] = [];

    const workName = readSingleFilterValue(filters, 'workName');
    if (workName) {
      items.push({ label: this.i18n.tUi('measurements.fields.work'), value: workName });
    }

    const description = readSingleFilterValue(filters, 'description');
    if (description) {
      items.push({ label: this.i18n.tUi('measurements.fields.description'), value: description });
    }

    const statusValues = readArrayFilterValues(filters, 'status');
    if (statusValues.length) {
      const labels = this.statusOptions()
        .filter((option) => statusValues.includes(option.value))
        .map((option) => option.label);
      items.push({
        label: this.i18n.tUi('measurements.fields.status'),
        value: (labels.length ? labels : statusValues).join(', '),
      });
    }

    const dueDate = readDateRangeFilterValue(filters, 'dueDate', this.formatDate.bind(this));
    if (dueDate) {
      items.push({ label: this.i18n.tUi('measurements.fields.dueDate'), value: dueDate });
    }

    return items;
  }

  protected override loadPage(
    query: ReturnType<typeof buildListQuery<MeasurementsAdvancedFilters>>,
  ): void {
    this.facade.loadPage(query);
  }

  protected override loadFirstPage(): void {}
}

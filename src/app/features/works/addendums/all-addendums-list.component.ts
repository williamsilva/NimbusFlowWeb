import { NgIf } from '@angular/common';
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
import { AddendumsGlobalFacade } from '@features/facade/addendums-global.facade';
import { AddendumsAdvancedFilters } from '@features/filter/addendums.filters';
import { StatefulListPage } from '@features/list-base/stateful-list-page';
import { buildListQuery } from '@shared/features/list-query/list-query.builder';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { StatusBadgeComponent } from '@shared/features/status-badge/status-badge.component';
import {
  currencyRangeLabel,
  CsCurrencyRangeFilterComponent,
} from '@features/list-base/cs-currency-range-filter.component';
import { AddendumWithWorkModel, AddendumsFiltersState } from '@models/addendums.models';
import { PeriodEnum, allPeriodEnum, periodEnumLabel } from '@models/enums/period.enum';
import { CsAdvancedPeriodDateFilterComponent } from '@features/list-base/cs-advanced-period-date-filter.component';
import {
  ActiveFilterItem,
  FiltersPanelComponent,
} from '@shared/features/filters-panel/filters-panel.component';
import {
  readSingleFilterValue,
  readArrayFilterValues,
  readDateRangeFilterValue,
} from '@features/list-base/table-filter-readers';
import { ADDENDUM_STATUS_VALUES, AddendumStatusEnum, addendumStatusTone } from '@models/enums/addendum-status.enum';
import { formatApprovalRanges } from '@features/works/addendums/addendums-approval-range.util';
import { translateWorksErrorDetail } from '@features/works/works-error.util';

@Component({
  standalone: true,
  selector: 'app-all-addendums-list',
  templateUrl: './all-addendums-list.component.html',
  imports: [
    NgIf,
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
export class AllAddendumsListComponent extends StatefulListPage<
  AddendumsFiltersState,
  AddendumsAdvancedFilters
> {
  @ViewChild('dt') private dt?: Table;
  private readonly destroyRef = inject(DestroyRef);

  protected override readonly i18n = inject(I18nService);
  readonly facade = inject(AddendumsGlobalFacade);
  private readonly toast = inject(MessageService);
  private readonly confirm = inject(ConfirmationService);

  override rows =
    Number(localStorage.getItem(this.tableRowsKey())) || StatefulListPage.DEFAULT_ROWS;

  workName = signal('');
  justification = signal('');
  status = signal<string[] | null>(null);
  amountFrom = signal<number | null>(null);
  amountTo = signal<number | null>(null);
  createdAt = signal<string | string[] | null>(null);
  periodCreatedAt = signal<PeriodEnum | null>(null);

  readonly periodEnumOptions = computed(() => {
    this.i18n.getAppliedLang();
    return allPeriodEnum().map((value) => ({ label: periodEnumLabel(value, this.i18n), value }));
  });

  readonly totalRecords = computed(() => this.facade.totalRecords());
  readonly items = computed<AddendumWithWorkModel[]>(() => this.facade.items());
  readonly loading = computed(() => this.facade.loading());
  readonly loadedOnce = computed(() => this.facade.loadedOnce());

  readonly statusOptions = computed(() => {
    this.i18n.getAppliedLang();
    return ADDENDUM_STATUS_VALUES.map((value) => ({
      value,
      label: this.i18n.tUi(`addendums.status.${value}` as never),
    }));
  });

  protected override readonly advancedActiveFilters = computed<ActiveFilterItem[]>(() => {
    const items: ActiveFilterItem[] = [];

    const workName = this.workName().trim();
    const justification = this.justification().trim();
    const status = this.status();
    const amountFrom = this.amountFrom();
    const amountTo = this.amountTo();

    if (workName) {
      items.push({ label: this.i18n.tUi('addendums.fields.work'), value: workName });
    }
    if (justification) {
      items.push({ label: this.i18n.tUi('addendums.fields.justification'), value: justification });
    }
    if (status?.length) {
      const labels = this.statusOptions()
        .filter((opt) => status.includes(opt.value))
        .map((opt) => opt.label)
        .join(', ');
      items.push({ label: this.i18n.tUi('addendums.fields.status'), value: labels });
    }
    const amountLabel = currencyRangeLabel(this.i18n, amountFrom, amountTo);
    if (amountLabel) {
      items.push({ label: this.i18n.tUi('addendums.fields.amount'), value: amountLabel });
    }
    const createdAtLabel = this.formatActiveFilterPeriodDateValue(
      this.periodCreatedAt(),
      this.createdAt(),
      this.i18n,
    );
    if (createdAtLabel) {
      items.push({ label: this.i18n.tUi('addendums.fields.createdAt'), value: createdAtLabel });
    }

    return items;
  });

  ngOnInit() {
    this.initStatefulList();
  }

  tone(status: string): ReturnType<typeof addendumStatusTone> {
    return addendumStatusTone(status);
  }

  isPending(row: AddendumWithWorkModel): boolean {
    return row.status === AddendumStatusEnum.PENDING;
  }

  approvalRangeLabel(row: AddendumWithWorkModel): string {
    return formatApprovalRanges(this.i18n, row.approvalRanges);
  }

  clear() {
    this.clearTableAndReload(this.dt);
  }

  confirmApprove(row: AddendumWithWorkModel): void {
    if (!row.canDecide) return;

    this.confirm.confirm({
      header: this.i18n.tUi('addendums.approveConfirm.header'),
      message: this.i18n.tUi('addendums.approveConfirm.message', {
        amount: this.i18n.formatBrlCurrency(row.amount),
      }),
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
                detail: this.i18n.tUi('addendums.approveConfirm.success'),
              }),
            error: (err) =>
              this.toast.add({
                severity: 'error',
                summary: this.i18n.tUi('common.error'),
                detail:
                  translateWorksErrorDetail(err, this.i18n) ??
                  this.i18n.tUi('addendums.form.saveError'),
              }),
          });
      },
    });
  }

  confirmReject(row: AddendumWithWorkModel): void {
    if (!row.canDecide) return;

    this.confirm.confirm({
      header: this.i18n.tUi('addendums.rejectConfirm.header'),
      message: this.i18n.tUi('addendums.rejectConfirm.message', {
        amount: this.i18n.formatBrlCurrency(row.amount),
      }),
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
                detail: this.i18n.tUi('addendums.rejectConfirm.success'),
              }),
            error: (err) =>
              this.toast.add({
                severity: 'error',
                summary: this.i18n.tUi('common.error'),
                detail:
                  translateWorksErrorDetail(err, this.i18n) ??
                  this.i18n.tUi('addendums.form.saveError'),
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
    return STATE_KEY.NIMBUSFLOW.WORKS.ALL_ADDENDUMS.TABLE.STATE.V1;
  }

  protected override tableRowsKey(): string {
    return STATE_KEY.NIMBUSFLOW.WORKS.ALL_ADDENDUMS.TABLE.ROWS.V1;
  }

  protected override filtersKey(): string {
    return STATE_KEY.NIMBUSFLOW.WORKS.ALL_ADDENDUMS.FILTERS.V1;
  }

  protected override refresh(): void {
    this.reloadWithCurrentState();
  }

  protected override resetFilters(): void {
    this.workName.set('');
    this.justification.set('');
    this.status.set(null);
    this.amountFrom.set(null);
    this.amountTo.set(null);
    this.createdAt.set(null);
    this.periodCreatedAt.set(null);
  }

  protected override toFiltersState(): AddendumsFiltersState {
    return {
      workName: this.workName(),
      justification: this.justification(),
      status: this.status()?.length ? this.status() : null,
      amountFrom: this.amountFrom(),
      amountTo: this.amountTo(),
      createdAt: this.createdAt(),
      periodCreatedAt: this.periodCreatedAt(),
    };
  }

  protected override applyFiltersState(state: AddendumsFiltersState): void {
    this.workName.set(state.workName ?? '');
    this.justification.set(state.justification ?? '');
    this.status.set(state.status ?? null);
    this.amountFrom.set(state.amountFrom ?? null);
    this.amountTo.set(state.amountTo ?? null);
    this.createdAt.set(state.createdAt ?? null);
    this.periodCreatedAt.set(state.periodCreatedAt ?? null);
  }

  protected override buildAdvancedFilters(): Partial<AddendumsAdvancedFilters> {
    return {
      workName: this.workName().trim() || undefined,
      justification: this.justification().trim() || undefined,
      status: this.status()?.length ? this.status() : undefined,
      amountFrom: this.amountFrom() ?? undefined,
      amountTo: this.amountTo() ?? undefined,
      createdAt: this.createdAt() ?? undefined,
      periodCreatedAt: this.periodCreatedAt() ?? undefined,
    };
  }

  protected override mapTableFiltersToActiveItems(filters: any): ActiveFilterItem[] {
    this.i18n.getAppliedLang();

    const items: ActiveFilterItem[] = [];

    const workName = readSingleFilterValue(filters, 'workName');
    if (workName) {
      items.push({ label: this.i18n.tUi('addendums.fields.work'), value: workName });
    }

    const justification = readSingleFilterValue(filters, 'justification');
    if (justification) {
      items.push({ label: this.i18n.tUi('addendums.fields.justification'), value: justification });
    }

    const statusValues = readArrayFilterValues(filters, 'status');
    if (statusValues.length) {
      const labels = this.statusOptions()
        .filter((option) => statusValues.includes(option.value))
        .map((option) => option.label);
      items.push({
        label: this.i18n.tUi('addendums.fields.status'),
        value: (labels.length ? labels : statusValues).join(', '),
      });
    }

    const createdAt = readDateRangeFilterValue(filters, 'createdAt', this.formatDate.bind(this));
    if (createdAt) {
      items.push({ label: this.i18n.tUi('addendums.fields.createdAt'), value: createdAt });
    }

    return items;
  }

  protected override loadPage(
    query: ReturnType<typeof buildListQuery<AddendumsAdvancedFilters>>,
  ): void {
    this.facade.loadPage(query);
  }

  protected override loadFirstPage(): void {}
}

import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, ViewChild, computed, inject, signal } from '@angular/core';

import { Table } from 'primeng/table';
import { TableModule } from 'primeng/table';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { FloatLabel } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { TranslateModule } from '@ngx-translate/core';
import { ProgressBarModule } from 'primeng/progressbar';
import { MultiSelectModule } from 'primeng/multiselect';

import { I18nService } from '@core/i18n/i18n.service';
import { CsDatePipe } from '@shared/pipes/cs-date.pipe';
import { STATE_KEY } from '@features/state-key.constants';
import { WorksFacade } from '@features/facade/works.facade';
import { CsCurrencyPipe } from '@shared/pipes/cs-currency.pipe';
import { ProjectsFacade } from '@features/facade/projects.facade';
import { WorkModel, WorksFiltersState } from '@models/works.models';
import { SuppliersFacade } from '@features/facade/suppliers.facade';
import { WorksAdvancedFilters } from '@features/filter/works.filters';
import { StatefulListPage } from '@features/list-base/stateful-list-page';
import { buildListQuery } from '@shared/features/list-query/list-query.builder';
import { WorksPermissionPolicy } from '@features/works/works-permission.policy';
import { WORK_STATUS_VALUES, WorkStatusEnum, workStatusTone } from '@models/enums/work-status.enum';
import { PeriodEnum, allPeriodEnum, periodEnumLabel } from '@models/enums/period.enum';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { StatusBadgeComponent } from '@shared/features/status-badge/status-badge.component';
import { WorksCreateDialogComponent } from '@features/works/works-create/works-create-dialog.component';
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

@Component({
  standalone: true,
  selector: 'app-works-list',
  templateUrl: './works-list.component.html',
  imports: [
    RouterLink,
    CsDatePipe,
    FloatLabel,
    DecimalPipe,
    FormsModule,
    TableModule,
    ButtonModule,
    TooltipModule,
    CsCurrencyPipe,
    InputTextModule,
    TranslateModule,
    DatePickerModule,
    ProgressBarModule,
    MultiSelectModule,
    PageHeaderComponent,
    StatusBadgeComponent,
    FiltersPanelComponent,
    WorksCreateDialogComponent,
    CsCurrencyRangeFilterComponent,
    CsAdvancedPeriodDateFilterComponent,
  ],
})
export class WorksListComponent extends StatefulListPage<WorksFiltersState, WorksAdvancedFilters> {
  @ViewChild('dt') private dt?: Table;

  protected override readonly i18n = inject(I18nService);
  readonly facade = inject(WorksFacade);
  readonly projectsFacade = inject(ProjectsFacade);
  protected readonly toast = inject(MessageService);
  readonly suppliersFacade = inject(SuppliersFacade);
  protected readonly policy = inject(WorksPermissionPolicy);

  readonly supplierOptions = this.suppliersFacade.options;
  readonly projectOptions = this.projectsFacade.options;

  override rows =
    Number(localStorage.getItem(this.tableRowsKey())) || StatefulListPage.DEFAULT_ROWS;

  name = signal('');
  supplierId = signal<string[] | null>(null);
  projectId = signal<string[] | null>(null);
  status = signal<string[] | null>(this.defaultStatus());
  startDate = signal<string | string[] | null>(null);
  periodStartDate = signal<PeriodEnum | null>(null);
  expectedEndDate = signal<string | string[] | null>(null);
  periodExpectedEndDate = signal<PeriodEnum | null>(null);
  totalAmountFrom = signal<number | null>(null);
  totalAmountTo = signal<number | null>(null);

  readonly periodEnumOptions = computed(() => {
    this.i18n.getAppliedLang();
    return allPeriodEnum().map((value) => ({ label: periodEnumLabel(value, this.i18n), value }));
  });

  upsertVisible = signal(false);
  work = signal<WorkModel | null>(null);

  readonly statusOptions = WORK_STATUS_VALUES.map((value) => ({
    value,
    label: this.i18n.tUi(`works.status.${value}` as never),
  }));

  readonly canCreate = computed(() => this.policy.canCreate());
  readonly totalRecords = computed(() => this.facade.totalRecords());
  readonly works = computed<WorkModel[]>(() => this.facade.works());

  protected override readonly advancedActiveFilters = computed<ActiveFilterItem[]>(() => {
    const items: ActiveFilterItem[] = [];

    const name = this.name().trim();
    const supplierId = this.supplierId();
    const projectId = this.projectId();
    const status = this.status();
    const totalAmountFrom = this.totalAmountFrom();
    const totalAmountTo = this.totalAmountTo();

    if (name) {
      items.push({ label: this.i18n.tUi('works.fields.name'), value: name });
    }
    if (supplierId?.length) {
      const labels = this.supplierOptions()
        .filter((opt) => supplierId.includes(opt.value))
        .map((opt) => opt.label)
        .join(', ');
      items.push({ label: this.i18n.tUi('works.fields.supplier'), value: labels });
    }
    if (projectId?.length) {
      const labels = this.projectOptions()
        .filter((opt) => projectId.includes(opt.value))
        .map((opt) => opt.label)
        .join(', ');
      items.push({ label: this.i18n.tUi('works.fields.project'), value: labels });
    }
    if (status?.length) {
      const labels = this.statusOptions
        .filter((opt) => status.includes(opt.value))
        .map((opt) => opt.label)
        .join(', ');
      items.push({ label: this.i18n.tUi('works.fields.status'), value: labels });
    }
    const startDateLabel = this.formatActiveFilterPeriodDateValue(
      this.periodStartDate(),
      this.startDate(),
      this.i18n,
    );
    if (startDateLabel) {
      items.push({ label: this.i18n.tUi('works.fields.startDate'), value: startDateLabel });
    }
    const expectedEndDateLabel = this.formatActiveFilterPeriodDateValue(
      this.periodExpectedEndDate(),
      this.expectedEndDate(),
      this.i18n,
    );
    if (expectedEndDateLabel) {
      items.push({
        label: this.i18n.tUi('works.fields.expectedEndDate'),
        value: expectedEndDateLabel,
      });
    }
    const totalAmountLabel = currencyRangeLabel(this.i18n, totalAmountFrom, totalAmountTo);
    if (totalAmountLabel) {
      items.push({ label: this.i18n.tUi('works.fields.totalAmount'), value: totalAmountLabel });
    }

    return items;
  });

  ngOnInit() {
    this.suppliersFacade.loadSupplierOptions();
    this.projectsFacade.loadAll();
    this.initStatefulList();
  }

  tone(status: string): ReturnType<typeof workStatusTone> {
    return workStatusTone(status);
  }

  goNew() {
    if (!this.policy.canCreate()) return;
    this.work.set(null);
    this.upsertVisible.set(true);
  }

  edit(row: WorkModel) {
    if (!this.policy.canEdit()) return;
    this.work.set(row);
    this.upsertVisible.set(true);
  }

  onSaved(): void {
    this.refresh();
  }

  onUpsertVisibleChange(v: boolean) {
    this.upsertVisible.set(v);
    if (!v) {
      this.work.set(null);
    }
  }

  clear() {
    this.clearTableAndReload(this.dt);
  }

  protected formatDate(value: Date | string): string {
    const date = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat(this.i18n.getLang(), { dateStyle: 'short' }).format(date);
  }

  protected override tableStateKey(): string {
    return STATE_KEY.NIMBUSFLOW.WORKS.WORKS.TABLE.STATE.V1;
  }

  protected override tableRowsKey(): string {
    return STATE_KEY.NIMBUSFLOW.WORKS.WORKS.TABLE.ROWS.V1;
  }

  protected override filtersKey(): string {
    return STATE_KEY.NIMBUSFLOW.WORKS.WORKS.FILTERS.V1;
  }

  protected override refresh(): void {
    this.reloadWithCurrentState();
  }

  /** Mesmo padrão do CardSync (CreditOrderListComponent - "Ordens de Pagamento"): status "Em
   *  andamento" pré-selecionado, mas só quando o painel de filtros está vazio de verdade (nem
   *  restaurado do localStorage, nem definido pelo usuário) - ver applyDefaultFiltersIfEmpty. */
  private defaultStatus(): string[] {
    return [WorkStatusEnum.IN_PROGRESS];
  }

  /** Só entra quando NENHUM filtro avançado está setado (painel inteiro vazio) - primeira visita
   *  à tela (nada persistido ainda), filtros persistidos totalmente vazios, ou logo após
   *  "Limpar". Checa o painel inteiro, não campo a campo: se o usuário já definiu qualquer outro
   *  filtro (ex.: Nome), isso já conta como painel "não vazio" e não deve reaplicar o default -
   *  senão a escolha dele nunca "gruda". */
  private applyDefaultFiltersIfEmpty(): void {
    if (this.advancedActiveFilters().length > 0) return;

    this.status.set(this.defaultStatus());
  }

  protected override resetFilters(): void {
    this.name.set('');
    this.supplierId.set(null);
    this.projectId.set(null);
    this.status.set(null);
    this.startDate.set(null);
    this.periodStartDate.set(null);
    this.expectedEndDate.set(null);
    this.periodExpectedEndDate.set(null);
    this.totalAmountFrom.set(null);
    this.totalAmountTo.set(null);
    this.applyDefaultFiltersIfEmpty();
  }

  protected override toFiltersState(): WorksFiltersState {
    return {
      name: this.name(),
      supplierId: this.supplierId()?.length ? this.supplierId() : null,
      projectId: this.projectId()?.length ? this.projectId() : null,
      status: this.status()?.length ? this.status() : null,
      startDate: this.startDate(),
      periodStartDate: this.periodStartDate(),
      expectedEndDate: this.expectedEndDate(),
      periodExpectedEndDate: this.periodExpectedEndDate(),
      totalAmountFrom: this.totalAmountFrom(),
      totalAmountTo: this.totalAmountTo(),
    };
  }

  protected override applyFiltersState(state: WorksFiltersState): void {
    this.name.set(state.name ?? '');
    this.supplierId.set(state.supplierId ?? null);
    this.projectId.set(state.projectId ?? null);
    this.status.set(state.status ?? null);
    this.startDate.set(state.startDate ?? null);
    this.periodStartDate.set(state.periodStartDate ?? null);
    this.expectedEndDate.set(state.expectedEndDate ?? null);
    this.periodExpectedEndDate.set(state.periodExpectedEndDate ?? null);
    this.totalAmountFrom.set(state.totalAmountFrom ?? null);
    this.totalAmountTo.set(state.totalAmountTo ?? null);

    this.applyDefaultFiltersIfEmpty();
  }

  protected override buildAdvancedFilters(): Partial<WorksAdvancedFilters> {
    return {
      name: this.name().trim() || undefined,
      supplierId: this.supplierId()?.length ? this.supplierId() : undefined,
      projectId: this.projectId()?.length ? this.projectId() : undefined,
      status: this.status()?.length ? this.status() : undefined,
      startDate: this.startDate() ?? undefined,
      periodStartDate: this.periodStartDate() ?? undefined,
      expectedEndDate: this.expectedEndDate() ?? undefined,
      periodExpectedEndDate: this.periodExpectedEndDate() ?? undefined,
      totalAmountFrom: this.totalAmountFrom() ?? undefined,
      totalAmountTo: this.totalAmountTo() ?? undefined,
    };
  }

  protected override mapTableFiltersToActiveItems(filters: any): ActiveFilterItem[] {
    this.i18n.getAppliedLang();

    const items: ActiveFilterItem[] = [];

    const name = readSingleFilterValue(filters, 'name');
    if (name) {
      items.push({ label: this.i18n.tUi('works.fields.name'), value: name });
    }

    const statusValues = readArrayFilterValues(filters, 'status');
    if (statusValues.length) {
      const labels = this.statusOptions
        .filter((option) => statusValues.includes(option.value))
        .map((option) => option.label);
      items.push({
        label: this.i18n.tUi('works.fields.status'),
        value: (labels.length ? labels : statusValues).join(', '),
      });
    }

    const startDate = readDateRangeFilterValue(filters, 'startDate', this.formatDate.bind(this));
    if (startDate) {
      items.push({ label: this.i18n.tUi('works.fields.startDate'), value: startDate });
    }

    const expectedEndDate = readDateRangeFilterValue(
      filters,
      'expectedEndDate',
      this.formatDate.bind(this),
    );
    if (expectedEndDate) {
      items.push({ label: this.i18n.tUi('works.fields.expectedEndDate'), value: expectedEndDate });
    }

    const totalAmountRange =
      filters?.['totalAmount']?.value ?? filters?.['totalAmount']?.[0]?.value;
    if (
      Array.isArray(totalAmountRange) &&
      (totalAmountRange[0] != null || totalAmountRange[1] != null)
    ) {
      const label = currencyRangeLabel(this.i18n, totalAmountRange[0], totalAmountRange[1]);
      if (label) {
        items.push({ label: this.i18n.tUi('works.fields.totalAmount'), value: label });
      }
    }

    return items;
  }

  protected override loadPage(
    query: ReturnType<typeof buildListQuery<WorksAdvancedFilters>>,
  ): void {
    this.facade.loadPage(query);
  }

  protected override loadFirstPage(): void {}
}

import { Router } from '@angular/router';

import { FormsModule } from '@angular/forms';

import { Component, ViewChild, computed, inject, signal } from '@angular/core';

import { Table } from 'primeng/table';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { FloatLabel } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { TranslateModule } from '@ngx-translate/core';
import { MultiSelectModule } from 'primeng/multiselect';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';

import { I18nService } from '@core/i18n/i18n.service';
import { CsDatePipe } from '@shared/pipes/cs-date.pipe';
import { DateInputMaskDirective } from '@williamsilva/nimbus-web-commons';
import { TaxIdPipe } from '@shared/pipes/tax-id.pipe';
import { PhonePipe } from '@shared/pipes/phone.pipe';
import { STATE_KEY } from '@features/state-key.constants';
import { StatefulListPage } from '@williamsilva/nimbus-web-commons';
import { BulkActionListPage } from '@features/list-base/bulk-action-list-page';
import { SuppliersFacade } from '@features/facade/suppliers.facade';
import { buildListQuery } from '@williamsilva/nimbus-web-commons';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { SuppliersAdvancedFilters } from '@features/filter/suppliers.filters';
import { SuppliersPermissionPolicy } from '@features/suppliers/suppliers-permission.policy';
import { StatusBadgeComponent } from '@shared/features/status-badge/status-badge.component';
import { SupplierModel, SuppliersFiltersState } from '@models/suppliers.models';
import { SuppliersCreateDialogComponent } from '@features/suppliers/suppliers-create/suppliers-create-dialog.component';
import { PeriodEnum, allPeriodEnum, periodEnumLabel } from '@models/enums/period.enum';
import { CsAdvancedPeriodDateFilterComponent } from '@williamsilva/nimbus-web-commons';
import {
  ActiveFilterItem,
  FiltersPanelComponent,
} from '@williamsilva/nimbus-web-commons';
import {
  readSingleFilterValue,
  readArrayFilterValues,
  readDateRangeFilterValue,
} from '@williamsilva/nimbus-web-commons';

@Component({
  standalone: true,
  selector: 'app-suppliers-list',
  templateUrl: './suppliers-list.component.html',
  styleUrl: './suppliers-list.component.scss',
  imports: [
    TaxIdPipe,
    PhonePipe,
    CsDatePipe,
    FloatLabel,
    FormsModule,
    TableModule,
    ButtonModule,
    TooltipModule,
    InputTextModule,
    TranslateModule,
    DatePickerModule,
    MultiSelectModule,
    PageHeaderComponent,
    ConfirmDialogModule,
    FiltersPanelComponent,
    StatusBadgeComponent,
    SuppliersCreateDialogComponent,
    CsAdvancedPeriodDateFilterComponent,
    DateInputMaskDirective,
  ],
})
export class SuppliersListComponent extends StatefulListPage<
  SuppliersFiltersState,
  SuppliersAdvancedFilters
> {
  @ViewChild('dt') private dt?: Table;

  protected override readonly i18n = inject(I18nService);
  readonly facade = inject(SuppliersFacade);
  private readonly router = inject(Router);
  protected readonly toast = inject(MessageService);
  protected readonly confirm = inject(ConfirmationService);
  protected readonly policy = inject(SuppliersPermissionPolicy);

  override rows =
    Number(localStorage.getItem(this.tableRowsKey())) || StatefulListPage.DEFAULT_ROWS;

  private readonly bulk = new (class extends BulkActionListPage {
    protected override readonly i18n = inject(I18nService);
    protected override readonly toast = inject(MessageService);
    protected override readonly confirm = inject(ConfirmationService);

    constructor(private readonly host: SuppliersListComponent) {
      super();
    }

    protected override clearSelection(): void {}

    confirmDeactivate(row: SupplierModel): void {
      this.confirmAction({
        header: this.i18n.tUi('suppliers.deactivate.header' as never),
        message: this.i18n.tUi('suppliers.deactivate.message' as never, {
          companyName: row.companyName,
        }),
        icon: 'pi pi-exclamation-triangle',
        accept: () =>
          this.executeAction(
            this.host.facade.deactivate(row.id),
            this.i18n.tUi('suppliers.deactivate.success' as never),
          ),
      });
    }

    confirmActivate(row: SupplierModel): void {
      this.confirmAction({
        header: this.i18n.tUi('suppliers.activate.header' as never),
        message: this.i18n.tUi('suppliers.activate.message' as never, {
          companyName: row.companyName,
        }),
        icon: 'pi pi-question-circle',
        accept: () =>
          this.executeAction(
            this.host.facade.activate(row.id),
            this.i18n.tUi('suppliers.activate.success' as never),
          ),
      });
    }
  })(this);

  companyName = signal('');
  tradeName = signal('');
  taxId = signal('');
  email = signal('');
  phone = signal('');
  active = signal<string[] | null>(null);
  createdAt = signal<string | string[] | null>(null);
  periodCreatedAt = signal<PeriodEnum | null>(null);

  upsertVisible = signal(false);
  supplier = signal<SupplierModel | null>(null);

  readonly activeOptions = [
    { label: this.i18n.tUi('common.active' as never), value: 'true' },
    { label: this.i18n.tUi('common.inactive' as never), value: 'false' },
  ];

  readonly periodEnumOptions = computed(() => {
    this.i18n.getAppliedLang();
    return allPeriodEnum().map((value) => ({ label: periodEnumLabel(value, this.i18n), value }));
  });

  readonly canCreate = computed(() => this.policy.canCreate());
  readonly totalRecords = computed(() => this.facade.totalRecords());
  readonly suppliers = computed<SupplierModel[]>(() => this.facade.suppliers());

  protected override readonly advancedActiveFilters = computed<ActiveFilterItem[]>(() => {
    const items: ActiveFilterItem[] = [];

    const companyName = this.companyName().trim();
    const tradeName = this.tradeName().trim();
    const taxId = this.taxId().trim();
    const email = this.email().trim();
    const phone = this.phone().trim();
    const active = this.active();

    if (companyName) {
      items.push({ label: this.i18n.tUi('suppliers.fields.companyName'), value: companyName });
    }
    if (tradeName) {
      items.push({ label: this.i18n.tUi('suppliers.fields.tradeName'), value: tradeName });
    }
    if (taxId) {
      items.push({ label: this.i18n.tUi('suppliers.fields.taxId'), value: taxId });
    }
    if (email) {
      items.push({ label: this.i18n.tUi('suppliers.fields.email'), value: email });
    }
    if (phone) {
      items.push({ label: this.i18n.tUi('suppliers.fields.phone'), value: phone });
    }
    if (active?.length) {
      const labels = this.activeOptions
        .filter((opt) => active.includes(opt.value))
        .map((opt) => opt.label)
        .join(', ');
      items.push({ label: this.i18n.tUi('suppliers.fields.status'), value: labels });
    }
    const createdAtLabel = this.formatActiveFilterPeriodDateValue(
      this.periodCreatedAt(),
      this.createdAt(),
      this.i18n,
    );
    if (createdAtLabel) {
      items.push({ label: this.i18n.tUi('suppliers.fields.createdAt'), value: createdAtLabel });
    }

    return items;
  });

  ngOnInit() {
    this.initStatefulList();
  }

  goNew() {
    if (!this.policy.canCreate()) return;
    this.supplier.set(null);
    this.upsertVisible.set(true);
  }

  edit(row: SupplierModel) {
    if (!this.policy.canEdit()) return;
    this.supplier.set(row);
    this.upsertVisible.set(true);
  }

  canDeactivate(row: SupplierModel): boolean {
    return row.active && this.policy.canDeactivate();
  }

  deactivateDisabledReason(row: SupplierModel): string {
    if (!row.active) {
      return 'suppliers.action.alreadyInactive';
    }
    return this.policy.deactivateDisabledReason() ?? 'suppliers.action.noPermission';
  }

  canActivate(row: SupplierModel): boolean {
    return !row.active && this.policy.canActivate();
  }

  activateDisabledReason(row: SupplierModel): string {
    if (row.active) {
      return 'suppliers.action.alreadyActive';
    }
    return this.policy.activateDisabledReason() ?? 'suppliers.action.noPermission';
  }

  confirmDeactivate(row: SupplierModel) {
    if (!this.canDeactivate(row)) return;
    this.bulk.confirmDeactivate(row);
  }

  confirmActivate(row: SupplierModel) {
    if (!this.canActivate(row)) return;
    this.bulk.confirmActivate(row);
  }

  onSaved(): void {
    this.refresh();
  }

  onUpsertVisibleChange(v: boolean) {
    this.upsertVisible.set(v);
    if (!v) {
      this.supplier.set(null);
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
    return STATE_KEY.NIMBUSFLOW.WORKS.SUPPLIERS.TABLE.STATE.V1;
  }

  protected override tableRowsKey(): string {
    return STATE_KEY.NIMBUSFLOW.WORKS.SUPPLIERS.TABLE.ROWS.V1;
  }

  protected override filtersKey(): string {
    return STATE_KEY.NIMBUSFLOW.WORKS.SUPPLIERS.FILTERS.V1;
  }

  protected override refresh(): void {
    this.reloadWithCurrentState();
  }

  protected override resetFilters(): void {
    this.companyName.set('');
    this.tradeName.set('');
    this.taxId.set('');
    this.email.set('');
    this.phone.set('');
    this.active.set(null);
    this.createdAt.set(null);
    this.periodCreatedAt.set(null);
  }

  protected override toFiltersState(): SuppliersFiltersState {
    return {
      companyName: this.companyName(),
      tradeName: this.tradeName(),
      taxId: this.taxId(),
      email: this.email(),
      phone: this.phone(),
      active: this.active()?.length ? this.active() : null,
      createdAt: this.createdAt(),
      periodCreatedAt: this.periodCreatedAt(),
    };
  }

  protected override applyFiltersState(state: SuppliersFiltersState): void {
    this.companyName.set(state.companyName ?? '');
    this.tradeName.set(state.tradeName ?? '');
    this.taxId.set(state.taxId ?? '');
    this.email.set(state.email ?? '');
    this.phone.set(state.phone ?? '');
    this.active.set(state.active ?? null);
    this.createdAt.set(state.createdAt ?? null);
    this.periodCreatedAt.set(state.periodCreatedAt ?? null);
  }

  protected override buildAdvancedFilters(): Partial<SuppliersAdvancedFilters> {
    return {
      companyName: this.companyName().trim() || undefined,
      tradeName: this.tradeName().trim() || undefined,
      taxId: this.taxId().trim() || undefined,
      email: this.email().trim() || undefined,
      phone: this.phone().trim() || undefined,
      active: this.active()?.length ? this.active() : undefined,
      createdAt: this.createdAt() ?? undefined,
      periodCreatedAt: this.periodCreatedAt() ?? undefined,
    };
  }

  protected override mapTableFiltersToActiveItems(filters: any): ActiveFilterItem[] {
    this.i18n.getAppliedLang();

    const items: ActiveFilterItem[] = [];

    const companyName = readSingleFilterValue(filters, 'companyName');
    if (companyName) {
      items.push({ label: this.i18n.tUi('suppliers.fields.companyName'), value: companyName });
    }

    const tradeName = readSingleFilterValue(filters, 'tradeName');
    if (tradeName) {
      items.push({ label: this.i18n.tUi('suppliers.fields.tradeName'), value: tradeName });
    }

    const taxId = readSingleFilterValue(filters, 'taxId');
    if (taxId) {
      items.push({ label: this.i18n.tUi('suppliers.fields.taxId'), value: taxId });
    }

    const email = readSingleFilterValue(filters, 'email');
    if (email) {
      items.push({ label: this.i18n.tUi('suppliers.fields.email'), value: email });
    }

    const phone = readSingleFilterValue(filters, 'phone');
    if (phone) {
      items.push({ label: this.i18n.tUi('suppliers.fields.phone'), value: phone });
    }

    const activeValues = readArrayFilterValues(filters, 'active');
    if (activeValues.length) {
      const labels = this.activeOptions
        .filter((option) => activeValues.includes(option.value))
        .map((option) => option.label);
      items.push({
        label: this.i18n.tUi('suppliers.fields.status'),
        value: (labels.length ? labels : activeValues).join(', '),
      });
    }

    const createdAt = readDateRangeFilterValue(filters, 'createdAt', this.formatDate.bind(this));
    if (createdAt) {
      items.push({ label: this.i18n.tUi('suppliers.fields.createdAt'), value: createdAt });
    }

    return items;
  }

  protected override loadPage(
    query: ReturnType<typeof buildListQuery<SuppliersAdvancedFilters>>,
  ): void {
    this.facade.loadPage(query);
  }

  protected override loadFirstPage(): void {}
}

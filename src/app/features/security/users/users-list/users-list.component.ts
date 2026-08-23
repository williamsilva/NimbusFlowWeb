import { FormsModule } from '@angular/forms';

import { Component, ViewChild, computed, inject, signal } from '@angular/core';

import { Table } from 'primeng/table';
import { TableModule } from 'primeng/table';
import { PanelModule } from 'primeng/panel';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { FloatLabel } from 'primeng/floatlabel';
import { TooltipModule } from 'primeng/tooltip';
import { CheckboxModule } from 'primeng/checkbox';
import { SkeletonModule } from 'primeng/skeleton';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { TranslateModule } from '@ngx-translate/core';
import { MultiSelectModule } from 'primeng/multiselect';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';

import { CsTagComponent } from '@shared/ui';
import { I18nService } from '@core/i18n/i18n.service';
import { CsDatePipe } from '@shared/pipes/cs-date.pipe';
import { onlyDigits } from '@shared/utils/document.utils';
import { STATE_KEY } from '@features/state-key.constants';
import { UsersFacade } from '@features/facade/users.facade';
import { CsDocumentPipe } from '@shared/pipes/cs-document.pipe';
import { PermissionService } from '@core/auth/permission.service';
import { UserModel, UsersFiltersState } from '@models/users.models';
import { UsersAdvancedFilters } from '@features/filter/users.filters';
import { StatefulListPage } from '@features/list-base/stateful-list-page';
import { BulkActionListPage } from '@features/list-base/bulk-action-list-page';
import { buildListQuery } from '@shared/features/list-query/list-query.builder';
import { CpfCnpjMaskDirective } from '@shared/directives/cpf-cnpj-mask.directive';
import { DateInputMaskDirective } from '@shared/directives/date-input-mask.directive';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { DATA_TABLE_SHELL_IMPORTS } from '@shared/features/data-table-shell/data-table-shell.component';
import { UsersCreateDialogComponent } from '@features/security/users/users-create/users-create-dialog.component';
import { PeriodEnum, allPeriodEnum, periodEnumLabel } from '@models/enums/period.enum';
import { CsAdvancedPeriodDateFilterComponent } from '@features/list-base/cs-advanced-period-date-filter.component';
import {
  ActiveFilterItem,
  FiltersPanelComponent,
} from '@shared/features/filters-panel/filters-panel.component';
import {
  UserStatus,
  userStatusLabel,
  allUserStatuses,
  userStatusSeverity,
} from '@models/enums/user-status.enum';
import {
  BulkUserActionMode,
  SecurityPermissionPolicy,
} from '@features/security/policy/security-permission.policy';
import {
  readSingleFilterValue,
  readArrayFilterValues,
  readDateRangeFilterValue,
} from '@features/list-base/table-filter-readers';

@Component({
  standalone: true,
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.scss',
  imports: [
    FloatLabel,
    CsDatePipe,
    FormsModule,
    TableModule,
    PanelModule,
    DialogModule,
    ButtonModule,
    SelectModule,
    TooltipModule,
    CheckboxModule,
    CsDocumentPipe,
    SkeletonModule,
    CsTagComponent,
    InputTextModule,
    TranslateModule,
    DatePickerModule,
    MultiSelectModule,
    PageHeaderComponent,
    ConfirmDialogModule,
    CpfCnpjMaskDirective,
    FiltersPanelComponent,
    DATA_TABLE_SHELL_IMPORTS,
    UsersCreateDialogComponent,
    CsAdvancedPeriodDateFilterComponent,
    DateInputMaskDirective,
  ],
})
export class UsersListComponent extends StatefulListPage<UsersFiltersState, UsersAdvancedFilters> {
  @ViewChild('dt') private dt?: Table;

  protected override readonly i18n = inject(I18nService);
  readonly facade = inject(UsersFacade);
  readonly perms = inject(PermissionService);
  readonly usersOptions = this.facade.options;
  protected readonly toast = inject(MessageService);
  protected readonly confirm = inject(ConfirmationService);
  protected readonly secPolicy = inject(SecurityPermissionPolicy);

  override rows =
    Number(localStorage.getItem(this.tableRowsKey())) || StatefulListPage.DEFAULT_ROWS;

  private readonly bulk = new (class extends BulkActionListPage {
    protected override readonly i18n = inject(I18nService);
    protected override readonly toast = inject(MessageService);
    protected override readonly confirm = inject(ConfirmationService);
    constructor(private readonly host: UsersListComponent) {
      super();
    }
    protected override clearSelection(): void {
      this.host.clearSelection();
    }
  })(this);

  skeletonRows = Array.from({ length: 8 });

  name = signal('');
  userName = signal('');
  document = signal('');
  status = signal<UserStatus[] | null>(this.defaultStatus());
  createdBy = signal<string[] | null>(null);
  createdAt = signal<string | string[] | null>(null);
  periodCreatedAt = signal<PeriodEnum | null>(null);
  lastLoginAt = signal<string | string[] | null>(null);
  periodLastLoginAt = signal<PeriodEnum | null>(null);
  blockedUntil = signal<string | string[] | null>(null);
  periodBlockedUntil = signal<PeriodEnum | null>(null);
  passwordExpiresAt = signal<string | string[] | null>(null);
  periodPasswordExpiresAt = signal<PeriodEnum | null>(null);

  upsertVisible = signal(false);
  user = signal<UserModel | null>(null);
  selectedRows = signal<UserModel[]>([]);

  readonly statusOptions = computed(() => {
    this.i18n.getAppliedLang();
    return allUserStatuses().map((value) => ({
      label: userStatusLabel(value, this.i18n),
      value,
    }));
  });

  readonly periodEnumOptions = computed(() => {
    this.i18n.getAppliedLang();
    return allPeriodEnum().map((value) => ({ label: periodEnumLabel(value, this.i18n), value }));
  });

  users = computed<UserModel[]>(() => this.facade.users() as UserModel[]);
  totalRecords = computed(() => this.facade.totalRecords());

  selectionMode = computed<BulkUserActionMode | null>(() => {
    const selected = this.selectedRows();
    if (!selected.length) return null;
    return this.secPolicy.modeForRow(selected[0]);
  });

  headerEligibleRows = computed(() => {
    const mode = this.selectionMode();
    if (!mode) return [];
    return this.users().filter((row) => this.secPolicy.modeForRow(row) === mode);
  });

  headerChecked = computed(() => {
    const eligible = this.headerEligibleRows();
    if (!eligible.length) return false;
    return eligible.every((row) => this.isRowSelected(row));
  });

  headerIndeterminate = computed(() => {
    const eligible = this.headerEligibleRows();
    if (!eligible.length) return false;

    const selectedCount = eligible.filter((row) => this.isRowSelected(row)).length;
    return selectedCount > 0 && selectedCount < eligible.length;
  });

  selectedActivatableRows = computed(() =>
    this.selectedRows().filter((row) => this.secPolicy.modeForRow(row) === 'activate'),
  );

  selectedDeactivatableRows = computed(() =>
    this.selectedRows().filter((row) => this.secPolicy.modeForRow(row) === 'deactivate'),
  );

  canActivateSelected = computed(
    () =>
      this.selectionMode() === 'activate' &&
      this.secPolicy.canActivateBulk(this.selectedActivatableRows()),
  );

  canDeactivateSelected = computed(
    () =>
      this.selectionMode() === 'deactivate' &&
      this.secPolicy.canDeactivateBulk(this.selectedDeactivatableRows()),
  );

  selectionModeLabel = computed(() => {
    const mode = this.selectionMode();
    if (mode === 'activate') return this.i18n.tUi('users.selection.mode.activate');
    if (mode === 'deactivate') return this.i18n.tUi('users.selection.mode.deactivate');
    return this.i18n.tUi('users.selection.mode.none');
  });

  protected override readonly advancedActiveFilters = computed<ActiveFilterItem[]>(() => {
    const items: ActiveFilterItem[] = [];

    const statuses = this.status();
    const createdBy = this.createdBy();
    const name = this.name().trim();
    const userName = this.userName().trim();
    const document = this.document().trim();

    if (name) items.push({ label: this.i18n.tUi('users.fields.name'), value: name });
    if (userName) items.push({ label: this.i18n.tUi('users.fields.userName'), value: userName });
    if (document) items.push({ label: this.i18n.tUi('users.fields.document'), value: document });

    if (statuses?.length) {
      const labels = statuses.map((v) => userStatusLabel(v, this.i18n)).join(', ');
      items.push({ label: this.i18n.tUi('users.fields.status'), value: labels });
    }

    if (createdBy?.length) {
      const labels = this.usersOptions()
        .filter((opt) => createdBy.includes(opt.value))
        .map((opt) => opt.label)
        .join(', ');

      items.push({
        label: this.i18n.tUi('users.fields.createdBy'),
        value: labels,
      });
    }

    const createdAtLabel = this.formatActiveFilterPeriodDateValue(
      this.periodCreatedAt(),
      this.createdAt(),
      this.i18n,
    );
    if (createdAtLabel) {
      items.push({ label: this.i18n.tUi('users.fields.createdAt'), value: createdAtLabel });
    }

    const lastLoginAtLabel = this.formatActiveFilterPeriodDateValue(
      this.periodLastLoginAt(),
      this.lastLoginAt(),
      this.i18n,
    );
    if (lastLoginAtLabel) {
      items.push({ label: this.i18n.tUi('users.fields.lastLoginAt'), value: lastLoginAtLabel });
    }

    const blockedUntilLabel = this.formatActiveFilterPeriodDateValue(
      this.periodBlockedUntil(),
      this.blockedUntil(),
      this.i18n,
    );
    if (blockedUntilLabel) {
      items.push({ label: this.i18n.tUi('users.fields.blockedUntil'), value: blockedUntilLabel });
    }

    const passwordExpiresAtLabel = this.formatActiveFilterPeriodDateValue(
      this.periodPasswordExpiresAt(),
      this.passwordExpiresAt(),
      this.i18n,
    );
    if (passwordExpiresAtLabel) {
      items.push({
        label: this.i18n.tUi('users.fields.passwordExpiresAt'),
        value: passwordExpiresAtLabel,
      });
    }

    return items;
  });

  ngOnInit() {
    this.facade.loadUsersOptionsFilter();
    this.initStatefulList();
  }

  clear() {
    this.clearTableAndReload(this.dt);
  }

  onSaved(): void {
    this.refresh();
  }

  isRowCheckboxDisabled(row: UserModel): boolean {
    if (this.isRowSelected(row)) return false;

    const rowMode = this.secPolicy.modeForRow(row);
    const currentMode = this.selectionMode();

    if (!currentMode) {
      return rowMode === null;
    }

    return rowMode !== currentMode;
  }

  isRowSelected(row: UserModel): boolean {
    return this.selectedRows().some((item) => item.id === row.id);
  }

  toggleRowSelection(row: UserModel, checked: boolean): void {
    const current = this.selectedRows();

    if (!checked) {
      this.selectedRows.set(current.filter((item) => item.id !== row.id));
      return;
    }

    const rowMode = this.secPolicy.modeForRow(row);
    if (!rowMode) return;

    if (!current.length) {
      this.selectedRows.set([row]);
      return;
    }

    const currentMode = this.selectionMode();
    if (rowMode !== currentMode) return;

    if (this.isRowSelected(row)) return;

    this.selectedRows.set([...current, row]);
  }

  toggleHeaderSelection(checked: boolean): void {
    const eligible = this.headerEligibleRows();

    if (!eligible.length) return;

    if (!checked) {
      this.clearSelection();
      return;
    }

    this.selectedRows.set([...eligible]);
  }

  activate(row: UserModel): void {
    this.bulk.executeAction(
      this.facade.activate(row.id),
      this.i18n.tUi('users.activate.successSingle'),
    );
  }

  deactivate(row: UserModel): void {
    this.bulk.executeAction(
      this.facade.deactivate(row.id),
      this.i18n.tUi('users.deactivate.successSingle'),
    );
  }

  confirmActivate(row: UserModel): void {
    this.bulk.confirmAction({
      header: this.i18n.tUi('users.activate.header'),
      message: this.i18n.tUi('users.activate.messageSingle', {
        userName: row?.name ?? row?.userName ?? row?.id ?? '',
      }),
      icon: 'pi pi-check-circle',
      accept: () => this.activate(row),
    });
  }

  confirmDeactivate(row: UserModel): void {
    this.bulk.confirmAction({
      header: this.i18n.tUi('users.deactivate.header'),
      message: this.i18n.tUi('users.deactivate.messageSingle', {
        userName: row?.name ?? row?.userName ?? row?.id ?? '',
      }),
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.deactivate(row),
    });
  }

  activateSelected(): void {
    const rows = this.selectedActivatableRows();
    if (!rows.length) return;

    this.bulk.executeAction(
      this.facade.activateBulk(rows.map((row) => row.id)),
      this.i18n.tUi('users.activate.successBulk', { count: rows.length }),
    );
  }

  deactivateSelected(): void {
    const rows = this.selectedDeactivatableRows();
    if (!rows.length) return;

    this.bulk.executeAction(
      this.facade.deactivateBulk(rows.map((row) => row.id)),
      this.i18n.tUi('users.deactivate.successBulk', { count: rows.length }),
    );
  }

  confirmActivateSelected(): void {
    const rows = this.selectedActivatableRows();
    if (!rows.length) return;

    this.bulk.confirmAction({
      header: this.i18n.tUi('users.activate.header'),
      message: this.i18n.tUi('users.activate.messageBulk', { count: rows.length }),
      icon: 'pi pi-check-circle',
      accept: () => this.activateSelected(),
    });
  }

  confirmDeactivateSelected(): void {
    const rows = this.selectedDeactivatableRows();
    if (!rows.length) return;

    this.bulk.confirmAction({
      header: this.i18n.tUi('users.deactivate.header'),
      message: this.i18n.tUi('users.deactivate.messageBulk', { count: rows.length }),
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.deactivateSelected(),
    });
  }

  statusLabel(status: UserStatus | null) {
    return userStatusLabel(status, this.i18n);
  }

  severity(status: UserStatus | null) {
    return userStatusSeverity(status);
  }

  goNew() {
    if (!this.secPolicy.canCreate()) return;
    this.user.set(null);
    this.upsertVisible.set(true);
  }

  edit(row: UserModel) {
    if (!this.secPolicy.canEdit(row)) return;
    this.user.set(row);
    this.upsertVisible.set(true);
  }

  onUpsertVisibleChange(v: boolean) {
    this.upsertVisible.set(v);
    if (!v) {
      this.user.set(null);
    }
  }

  onCreated() {
    this.reloadWithCurrentState();
  }

  protected override tableStateKey(): string {
    return STATE_KEY.NIMBUSFLOW.SECURITY.USERS.TABLE.STATE.V1;
  }

  protected override tableRowsKey(): string {
    return STATE_KEY.NIMBUSFLOW.SECURITY.USERS.TABLE.ROWS.V1;
  }

  protected override filtersKey(): string {
    return STATE_KEY.NIMBUSFLOW.SECURITY.USERS.FILTERS.V1;
  }

  protected override refresh(): void {
    this.reloadWithCurrentState();
  }

  protected loadFirstPage() {
    const tableQuery = { page: 0, size: this.rows };
    const query = buildListQuery<UsersAdvancedFilters>(
      tableQuery as any,
      this.buildAdvancedFilters(),
    );

    this.clearSelection();
    this.facade.loadPage(query);
  }

  /** Vem pré-selecionado com Ativo+Pendente de senha — mesmo padrão do CardSync
   *  (CreditOrderListComponent). O gate que decide SE isso deve ser aplicado (painel inteiro
   *  vazio, não campo a campo) vive na classe base — ver applyDefaultAdvancedFiltersIfEmpty em
   *  StatefulListPage. */
  private defaultStatus(): UserStatus[] {
    return [UserStatus.ACTIVE, UserStatus.PENDING_PASSWORD];
  }

  protected override applyDefaultAdvancedFilters(): void {
    this.status.set(this.defaultStatus());
  }

  protected override resetFilters(): void {
    this.name.set('');
    this.userName.set('');
    this.document.set('');
    this.status.set(null);
    this.createdBy.set(null);
    this.createdAt.set(null);
    this.periodCreatedAt.set(null);
    this.lastLoginAt.set(null);
    this.periodLastLoginAt.set(null);
    this.blockedUntil.set(null);
    this.periodBlockedUntil.set(null);
    this.passwordExpiresAt.set(null);
    this.periodPasswordExpiresAt.set(null);
    this.applyDefaultAdvancedFiltersIfEmpty();
  }

  protected override toFiltersState(): UsersFiltersState {
    return {
      name: this.name(),
      userName: this.userName(),
      document: this.document(),
      status: this.status()?.length ? this.status() : null,
      createdBy: this.createdBy()?.length ? this.createdBy() : null,
      lastLoginAt: this.lastLoginAt(),
      periodLastLoginAt: this.periodLastLoginAt(),
      createdAt: this.createdAt(),
      periodCreatedAt: this.periodCreatedAt(),
      blockedUntil: this.blockedUntil(),
      periodBlockedUntil: this.periodBlockedUntil(),
      passwordExpiresAt: this.passwordExpiresAt(),
      periodPasswordExpiresAt: this.periodPasswordExpiresAt(),
    };
  }

  protected override applyFiltersState(s: UsersFiltersState): void {
    this.name.set(s.name ?? '');
    this.status.set(s.status ?? null);
    this.createdBy.set(s.createdBy ?? null);
    this.userName.set(s.userName ?? '');
    this.document.set(s.document ?? '');

    this.lastLoginAt.set(s.lastLoginAt ?? null);
    this.periodLastLoginAt.set(s.periodLastLoginAt ?? null);

    this.createdAt.set(s.createdAt ?? null);
    this.periodCreatedAt.set(s.periodCreatedAt ?? null);

    this.blockedUntil.set(s.blockedUntil ?? null);
    this.periodBlockedUntil.set(s.periodBlockedUntil ?? null);

    this.passwordExpiresAt.set(s.passwordExpiresAt ?? null);
    this.periodPasswordExpiresAt.set(s.periodPasswordExpiresAt ?? null);

    this.applyDefaultAdvancedFiltersIfEmpty();
  }

  protected override buildAdvancedFilters(): Partial<UsersAdvancedFilters> {
    return {
      name: this.name().trim() || undefined,
      userName: this.userName().trim() || undefined,
      document: onlyDigits(this.document()) || undefined,
      status: this.status()?.length ? this.status() : undefined,
      createdBy: this.createdBy()?.length ? this.createdBy() : undefined,
      lastLoginAt: this.lastLoginAt() ?? undefined,
      periodLastLoginAt: this.periodLastLoginAt() ?? undefined,
      createdAt: this.createdAt() ?? undefined,
      periodCreatedAt: this.periodCreatedAt() ?? undefined,
      blockedUntil: this.blockedUntil() ?? undefined,
      periodBlockedUntil: this.periodBlockedUntil() ?? undefined,
      passwordExpiresAt: this.passwordExpiresAt() ?? undefined,
      periodPasswordExpiresAt: this.periodPasswordExpiresAt() ?? undefined,
    };
  }

  protected override mapTableFiltersToActiveItems(filters: any): ActiveFilterItem[] {
    this.i18n.getAppliedLang();

    const items: ActiveFilterItem[] = [];

    const userName = readSingleFilterValue(filters, 'userName');
    if (userName) {
      items.push({ label: this.i18n.tUi('users.fields.userName'), value: userName });
    }

    const name = readSingleFilterValue(filters, 'name');
    if (name) {
      items.push({ label: this.i18n.tUi('users.fields.name'), value: name });
    }

    const document = readSingleFilterValue(filters, 'document');
    if (document) {
      items.push({ label: this.i18n.tUi('users.fields.document'), value: document });
    }

    const statuses = readArrayFilterValues(filters, 'status');
    if (statuses.length) {
      items.push({
        label: this.i18n.tUi('users.fields.status'),
        value: statuses.map((value) => userStatusLabel(value as UserStatus, this.i18n)).join(', '),
      });
    }

    const lastLoginAt = readDateRangeFilterValue(
      filters,
      'lastLoginAt',
      this.formatDate.bind(this),
    );
    if (lastLoginAt) {
      items.push({ label: this.i18n.tUi('users.fields.lastLoginAt'), value: lastLoginAt });
    }

    const blockedUntil = readDateRangeFilterValue(
      filters,
      'blockedUntil',
      this.formatDate.bind(this),
    );
    if (blockedUntil) {
      items.push({ label: this.i18n.tUi('users.fields.blockedUntil'), value: blockedUntil });
    }

    const passwordExpiresAt = readDateRangeFilterValue(
      filters,
      'passwordExpiresAt',
      this.formatDate.bind(this),
    );
    if (passwordExpiresAt) {
      items.push({
        label: this.i18n.tUi('users.fields.passwordExpiresAt'),
        value: passwordExpiresAt,
      });
    }

    const createdAt = readDateRangeFilterValue(filters, 'createdAt', this.formatDate.bind(this));
    if (createdAt) {
      items.push({ label: this.i18n.tUi('users.fields.createdAt'), value: createdAt });
    }

    const createdByValues = readArrayFilterValues(filters, 'createdBy');
    if (createdByValues.length) {
      const labels = this.usersOptions()
        .filter((option) => createdByValues.includes(option.value))
        .map((option) => option.label);

      items.push({
        label: this.i18n.tUi('users.fields.createdBy'),
        value: (labels.length ? labels : createdByValues).join(', '),
      });
    }

    return items;
  }

  protected override loadPage(
    query: ReturnType<typeof buildListQuery<UsersAdvancedFilters>>,
  ): void {
    this.clearSelection();
    this.facade.loadPage(query);
  }

  protected clearSelection(): void {
    this.selectedRows.set([]);
  }

  protected formatDate(value: Date | string): string {
    const date = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat(this.i18n.getLang(), { dateStyle: 'short' }).format(date);
  }
}

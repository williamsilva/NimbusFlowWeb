import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
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
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { DATA_TABLE_SHELL_IMPORTS } from '@shared/features/data-table-shell/data-table-shell.component';
import { UsersCreateDialogComponent } from '@features/security/users/users-create/users-create-dialog.component';
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
  imports: [
    CommonModule,
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
  status = signal<UserStatus[] | null>(null);
  createdBy = signal<string[] | null>(null);
  createdAtRange = signal<Date[] | null>(null);
  lastLoginAtRange = signal<Date[] | null>(null);
  blockedUntilRange = signal<Date[] | null>(null);
  passwordExpiresAtRange = signal<Date[] | null>(null);

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

    const create = this.createdAtRange();
    const last = this.lastLoginAtRange();
    const blocked = this.blockedUntilRange();
    const expires = this.passwordExpiresAtRange();

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

    if (create?.[0] && create?.[1]) {
      items.push({
        label: this.i18n.tUi('users.fields.createdAt'),
        value: `${this.formatDate(create[0])} – ${this.formatDate(create[1])}`,
      });
    }

    if (last?.[0] && last?.[1]) {
      items.push({
        label: this.i18n.tUi('users.fields.lastLoginAt'),
        value: `${this.formatDate(last[0])} – ${this.formatDate(last[1])}`,
      });
    }

    if (blocked?.[0] && blocked?.[1]) {
      items.push({
        label: this.i18n.tUi('users.fields.blockedUntil'),
        value: `${this.formatDate(blocked[0])} – ${this.formatDate(blocked[1])}`,
      });
    }

    if (expires?.[0] && expires?.[1]) {
      items.push({
        label: this.i18n.tUi('users.fields.passwordExpiresAt'),
        value: `${this.formatDate(expires[0])} – ${this.formatDate(expires[1])}`,
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
    return STATE_KEY.NIMBUSFLOW_SECURITY.SECURITY.USERS.TABLE.STATE.V1;
  }

  protected override tableRowsKey(): string {
    return STATE_KEY.NIMBUSFLOW_SECURITY.SECURITY.USERS.TABLE.ROWS.V1;
  }

  protected override filtersKey(): string {
    return STATE_KEY.NIMBUSFLOW_SECURITY.SECURITY.USERS.FILTERS.V1;
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

  protected override resetFilters(): void {
    this.name.set('');
    this.userName.set('');
    this.document.set('');
    this.status.set(null);
    this.createdBy.set(null);
    this.createdAtRange.set(null);
    this.lastLoginAtRange.set(null);
    this.blockedUntilRange.set(null);
    this.passwordExpiresAtRange.set(null);
  }

  protected override toFiltersState(): UsersFiltersState {
    const create = this.createdAtRange();
    const last = this.lastLoginAtRange();
    const blocked = this.blockedUntilRange();
    const expires = this.passwordExpiresAtRange();

    return {
      name: this.name(),
      userName: this.userName(),
      document: this.document(),
      status: this.status()?.length ? this.status() : null,
      createdBy: this.createdBy()?.length ? this.createdBy() : null,
      lastLoginAtRange:
        last?.[0] && last?.[1] ? [last[0].toISOString(), last[1].toISOString()] : null,
      createdAtRange:
        create?.[0] && create?.[1] ? [create[0].toISOString(), create[1].toISOString()] : null,
      blockedUntilRange:
        blocked?.[0] && blocked?.[1] ? [blocked[0].toISOString(), blocked[1].toISOString()] : null,
      passwordExpiresAtRange:
        expires?.[0] && expires?.[1] ? [expires[0].toISOString(), expires[1].toISOString()] : null,
    };
  }

  protected override applyFiltersState(s: UsersFiltersState): void {
    this.name.set(s.name ?? '');
    this.status.set(s.status ?? null);
    this.createdBy.set(s.createdBy ?? null);
    this.userName.set(s.userName ?? '');
    this.document.set(s.document ?? '');

    this.lastLoginAtRange.set(
      s.lastLoginAtRange?.[0] && s.lastLoginAtRange?.[1]
        ? [new Date(s.lastLoginAtRange[0]), new Date(s.lastLoginAtRange[1])]
        : null,
    );

    this.createdAtRange.set(
      s.createdAtRange?.[0] && s.createdAtRange?.[1]
        ? [new Date(s.createdAtRange[0]), new Date(s.createdAtRange[1])]
        : null,
    );

    this.blockedUntilRange.set(
      s.blockedUntilRange?.[0] && s.blockedUntilRange?.[1]
        ? [new Date(s.blockedUntilRange[0]), new Date(s.blockedUntilRange[1])]
        : null,
    );

    this.passwordExpiresAtRange.set(
      s.passwordExpiresAtRange?.[0] && s.passwordExpiresAtRange?.[1]
        ? [new Date(s.passwordExpiresAtRange[0]), new Date(s.passwordExpiresAtRange[1])]
        : null,
    );
  }

  protected override buildAdvancedFilters(): Partial<UsersAdvancedFilters> {
    const create = this.createdAtRange();
    const last = this.lastLoginAtRange();
    const blocked = this.blockedUntilRange();
    const expires = this.passwordExpiresAtRange();

    const [lastFrom, lastTo] =
      last?.[0] && last?.[1]
        ? [last[0].toISOString(), last[1].toISOString()]
        : [undefined, undefined];

    const [createFrom, createTo] =
      create?.[0] && create?.[1]
        ? [create[0].toISOString(), create[1].toISOString()]
        : [undefined, undefined];

    const [blockedFrom, blockedTo] =
      blocked?.[0] && blocked?.[1]
        ? [blocked[0].toISOString(), blocked[1].toISOString()]
        : [undefined, undefined];

    const [expiresFrom, expiresTo] =
      expires?.[0] && expires?.[1]
        ? [expires[0].toISOString(), expires[1].toISOString()]
        : [undefined, undefined];

    return {
      name: this.name().trim() || undefined,
      userName: this.userName().trim() || undefined,
      document: onlyDigits(this.document()) || undefined,
      status: this.status()?.length ? this.status() : undefined,
      createdBy: this.createdBy()?.length ? this.createdBy() : undefined,
      lastLoginAtTo: lastTo,
      lastLoginAtFrom: lastFrom,
      createdAtTo: createTo,
      createdAtFrom: createFrom,
      blockedUntilTo: blockedTo,
      blockedUntilFrom: blockedFrom,
      passwordExpiresAtTo: expiresTo,
      passwordExpiresAtFrom: expiresFrom,
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

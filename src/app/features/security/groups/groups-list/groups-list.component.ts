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
import { UsersFacade } from '@features/facade/users.facade';
import { GroupsFacade } from '@features/facade/groups.facade';
import { GroupModel, GroupsFiltersState } from '@models/groups.models';
import { GroupsAdvancedFilters } from '@features/filter/groups.filters';
import { STATE_KEY } from '@features/state-key.constants';
import { StatefulListPage } from '@features/list-base/stateful-list-page';
import { BulkActionListPage } from '@features/list-base/bulk-action-list-page';
import { buildListQuery } from '@shared/features/list-query/list-query.builder';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { GroupsPermissionPolicy } from '@features/security/policy/groups-permission.policy';
import { GroupsCreateDialogComponent } from '@features/security/groups/groups-create/groups-create-dialog.component';
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
  selector: 'app-groups-list',
  templateUrl: './groups-list.component.html',
  imports: [
    FloatLabel,
    CsDatePipe,
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
    GroupsCreateDialogComponent
],
})
export class GroupsListComponent extends StatefulListPage<
  GroupsFiltersState,
  GroupsAdvancedFilters
> {
  @ViewChild('dt') private dt?: Table;

  protected override readonly i18n = inject(I18nService);
  readonly facade = inject(GroupsFacade);
  private readonly router = inject(Router);
  readonly userFacade = inject(UsersFacade);
  readonly usersOptions = this.userFacade.options;
  protected readonly toast = inject(MessageService);
  protected readonly confirm = inject(ConfirmationService);
  protected readonly secPolicy = inject(GroupsPermissionPolicy);

  override rows =
    Number(localStorage.getItem(this.tableRowsKey())) || StatefulListPage.DEFAULT_ROWS;

  private readonly bulk = new (class extends BulkActionListPage {
    protected override readonly i18n = inject(I18nService);
    protected override readonly toast = inject(MessageService);
    protected override readonly confirm = inject(ConfirmationService);

    constructor(private readonly host: GroupsListComponent) {
      super();
    }

    protected override clearSelection(): void {}

    confirmDelete(row: GroupModel): void {
      this.confirmAction({
        header: this.i18n.tUi('groups.delete.header' as never),
        message: this.i18n.tUi('groups.delete.message' as never, { groupName: row.name }),
        icon: 'pi pi-exclamation-triangle',
        accept: () =>
          this.executeAction(
            this.host.facade.delete(row.id),
            this.i18n.tUi('groups.delete.success' as never),
          ),
      });
    }
  })(this);

  name = signal('');
  description = signal('');
  upsertVisible = signal(false);
  group = signal<GroupModel | null>(null);
  createdBy = signal<string[] | null>(null);
  createdAtRange = signal<Date[] | null>(null);

  readonly canCreate = computed(() => this.secPolicy.canCreate());
  readonly totalRecords = computed(() => this.facade.totalRecords());
  readonly groups = computed<GroupModel[]>(() => this.facade.groups());

  protected override readonly advancedActiveFilters = computed<ActiveFilterItem[]>(() => {
    const items: ActiveFilterItem[] = [];

    const name = this.name().trim();
    const description = this.description().trim();
    const createdBy = this.createdBy();
    const createdAtRange = this.createdAtRange();

    if (name) {
      items.push({ label: this.i18n.tUi('groups.fields.name'), value: name });
    }

    if (description) {
      items.push({ label: this.i18n.tUi('groups.fields.description'), value: description });
    }

    if (createdBy?.length) {
      const labels = this.usersOptions()
        .filter((opt) => createdBy.includes(opt.value))
        .map((opt) => opt.label)
        .join(', ');

      items.push({ label: this.i18n.tUi('groups.fields.createdBy'), value: labels });
    }

    if (createdAtRange?.[0] && createdAtRange?.[1]) {
      items.push({
        label: this.i18n.tUi('groups.fields.createdAt'),
        value: `${this.formatDate(createdAtRange[0])} – ${this.formatDate(createdAtRange[1])}`,
      });
    }

    return items;
  });

  ngOnInit() {
    this.userFacade.loadUsersOptionsFilter();
    this.initStatefulList();
  }

  goNew() {
    if (!this.secPolicy.canCreate()) return;
    this.group.set(null);
    this.upsertVisible.set(true);
  }

  view(row: GroupModel) {
    this.router.navigate(['/security/groups', row.id]);
  }

  edit(row: GroupModel) {
    if (!this.secPolicy.canEdit(row)) return;
    this.group.set(row);
    this.upsertVisible.set(true);
  }

  confirmDelete(row: GroupModel) {
    if (!this.secPolicy.canDelete(row)) return;
    this.bulk.confirmDelete(row);
  }

  onSaved(): void {
    this.refresh();
  }

  onUpsertVisibleChange(v: boolean) {
    this.upsertVisible.set(v);
    if (!v) {
      this.group.set(null);
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
    return STATE_KEY.NIMBUSFLOW_SECURITY.SECURITY.GROUPS.TABLE.STATE.V1;
  }

  protected override tableRowsKey(): string {
    return STATE_KEY.NIMBUSFLOW_SECURITY.SECURITY.GROUPS.TABLE.ROWS.V1;
  }

  protected override filtersKey(): string {
    return STATE_KEY.NIMBUSFLOW_SECURITY.SECURITY.GROUPS.FILTERS.V1;
  }

  protected override refresh(): void {
    this.reloadWithCurrentState();
  }

  protected override resetFilters(): void {
    this.name.set('');
    this.description.set('');
    this.createdBy.set(null);
    this.createdAtRange.set(null);
  }

  protected override toFiltersState(): GroupsFiltersState {
    const createdAtRange = this.createdAtRange();

    return {
      name: this.name(),
      description: this.description(),
      createdBy: this.createdBy()?.length ? this.createdBy() : null,
      createdAtRange:
        createdAtRange?.[0] && createdAtRange?.[1]
          ? [createdAtRange[0].toISOString(), createdAtRange[1].toISOString()]
          : null,
    };
  }

  protected override applyFiltersState(state: GroupsFiltersState): void {
    this.name.set(state.name ?? '');
    this.description.set(state.description ?? '');
    this.createdBy.set(state.createdBy ?? null);
    this.createdAtRange.set(
      state.createdAtRange?.[0] && state.createdAtRange?.[1]
        ? [new Date(state.createdAtRange[0]), new Date(state.createdAtRange[1])]
        : null,
    );
  }

  protected override buildAdvancedFilters(): Partial<GroupsAdvancedFilters> {
    const createdAtRange = this.createdAtRange();
    const [createdAtFrom, createdAtTo] =
      createdAtRange?.[0] && createdAtRange?.[1]
        ? [createdAtRange[0].toISOString(), createdAtRange[1].toISOString()]
        : [undefined, undefined];

    return {
      name: this.name().trim() || undefined,
      description: this.description().trim() || undefined,
      createdBy: this.createdBy()?.length ? this.createdBy() : undefined,
      createdAtFrom,
      createdAtTo,
    };
  }

  protected override mapTableFiltersToActiveItems(filters: any): ActiveFilterItem[] {
    this.i18n.getAppliedLang();

    const items: ActiveFilterItem[] = [];

    const name = readSingleFilterValue(filters, 'name');
    if (name) {
      items.push({ label: this.i18n.tUi('groups.fields.name'), value: name });
    }

    const description = readSingleFilterValue(filters, 'description');
    if (description) {
      items.push({ label: this.i18n.tUi('groups.fields.description'), value: description });
    }

    const createdAt = readDateRangeFilterValue(filters, 'createdAt', this.formatDate.bind(this));
    if (createdAt) {
      items.push({ label: this.i18n.tUi('groups.fields.createdAt'), value: createdAt });
    }

    const createdByValues = readArrayFilterValues(filters, 'createdBy');
    if (createdByValues.length) {
      const labels = this.usersOptions()
        .filter((option) => createdByValues.includes(option.value))
        .map((option) => option.label);

      items.push({
        label: this.i18n.tUi('groups.fields.createdBy'),
        value: (labels.length ? labels : createdByValues).join(', '),
      });
    }

    return items;
  }

  protected override loadPage(
    query: ReturnType<typeof buildListQuery<GroupsAdvancedFilters>>,
  ): void {
    this.facade.loadPage(query);
  }

  protected override loadFirstPage(): void {}
}

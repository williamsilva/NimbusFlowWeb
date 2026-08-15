
import { FormsModule } from '@angular/forms';
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, ViewChild, computed, inject, signal } from '@angular/core';

import { Table } from 'primeng/table';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { FloatLabel } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { TranslateModule } from '@ngx-translate/core';
import { MultiSelectModule } from 'primeng/multiselect';
import { MessageService } from 'primeng/api';

import { I18nService } from '@core/i18n/i18n.service';
import { CsDatePipe } from '@shared/pipes/cs-date.pipe';
import { STATE_KEY } from '@features/state-key.constants';
import { UsersFacade } from '@features/facade/users.facade';
import { PermissionService } from '@core/auth/permission.service';
import { TasksGlobalFacade } from '@features/facade/tasks-global.facade';
import { StatefulListPage } from '@features/list-base/stateful-list-page';
import { buildListQuery } from '@shared/features/list-query/list-query.builder';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { TasksAdvancedFilters } from '@features/filter/tasks.filters';
import { TasksPermissionPolicy } from '@features/tasks/tasks-permission.policy';
import { StatusBadgeComponent } from '@shared/features/status-badge/status-badge.component';
import {
  TASK_STATUS_VALUES,
  TaskStatusEnum,
  taskStatusTone,
  nextForwardTaskStatus,
} from '@models/enums/task-status.enum';
import { TaskWithActionPlanModel, TasksFiltersState } from '@models/tasks.models';
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

@Component({
  standalone: true,
  selector: 'app-all-tasks-list',
  templateUrl: './all-tasks-list.component.html',
  styleUrl: './all-tasks-list.component.scss',
  imports: [
    CsDatePipe,
    FloatLabel,
    FormsModule,
    SelectModule,
    TableModule,
    ButtonModule,
    TooltipModule,
    InputTextModule,
    TranslateModule,
    DatePickerModule,
    MultiSelectModule,
    PageHeaderComponent,
    FiltersPanelComponent,
    StatusBadgeComponent,
    CsAdvancedPeriodDateFilterComponent,
  ],
})
export class AllTasksListComponent extends StatefulListPage<TasksFiltersState, TasksAdvancedFilters> {
  @ViewChild('dt') private dt?: Table;

  protected override readonly i18n = inject(I18nService);
  readonly facade = inject(TasksGlobalFacade);
  readonly usersFacade = inject(UsersFacade);
  protected readonly toast = inject(MessageService);
  protected readonly policy = inject(TasksPermissionPolicy);
  private readonly perms = inject(PermissionService);
  private readonly destroyRef = inject(DestroyRef);

  override rows =
    Number(localStorage.getItem(this.tableRowsKey())) || StatefulListPage.DEFAULT_ROWS;

  title = signal('');
  status = signal<string[] | null>(null);
  assigneeIds = signal<string[] | null>(null);
  createdAt = signal<string | string[] | null>(null);
  periodCreatedAt = signal<PeriodEnum | null>(null);

  readonly statusOptions = TASK_STATUS_VALUES.map((value) => ({
    value,
    label: this.i18n.tUi(`tasks.status.${value}` as never),
  }));

  readonly periodEnumOptions = computed(() => {
    this.i18n.getAppliedLang();
    return allPeriodEnum().map((value) => ({ label: periodEnumLabel(value, this.i18n), value }));
  });

  readonly assigneeOptions = this.usersFacade.options;
  readonly totalRecords = computed(() => this.facade.totalRecords());
  readonly tasks = computed<TaskWithActionPlanModel[]>(() => this.facade.tasks());

  protected override readonly advancedActiveFilters = computed<ActiveFilterItem[]>(() => {
    const items: ActiveFilterItem[] = [];

    const title = this.title().trim();
    const status = this.status();
    const assigneeIds = this.assigneeIds();

    if (title) {
      items.push({ label: this.i18n.tUi('tasks.fields.title'), value: title });
    }
    if (status?.length) {
      const labels = this.statusOptions
        .filter((opt) => status.includes(opt.value))
        .map((opt) => opt.label)
        .join(', ');
      items.push({ label: this.i18n.tUi('tasks.fields.status'), value: labels });
    }
    if (assigneeIds?.length) {
      const labels = this.assigneeOptions()
        .filter((opt) => assigneeIds.includes(opt.value))
        .map((opt) => opt.label)
        .join(', ');
      items.push({
        label: this.i18n.tUi('tasks.fields.assignee'),
        value: labels || assigneeIds.join(', '),
      });
    }
    const createdAtLabel = this.formatActiveFilterPeriodDateValue(
      this.periodCreatedAt(),
      this.createdAt(),
      this.i18n,
    );
    if (createdAtLabel) {
      items.push({ label: this.i18n.tUi('tasks.fields.createdAt'), value: createdAtLabel });
    }

    return items;
  });

  ngOnInit() {
    this.usersFacade.loadUsersOptions();
    this.initStatefulList();
  }

  tone(status: string): ReturnType<typeof taskStatusTone> {
    return taskStatusTone(status);
  }

  /** Atalho "Minhas tarefas" - reaproveita o filtro de assignee já existente em vez de um modo à
   *  parte, então continua dentro do mesmo fluxo paginado/persistido de sempre. */
  goMine(): void {
    const userId = this.perms.currentUserId();
    if (!userId) return;

    this.assigneeIds.set([userId]);
    this.search();
  }

  /** Mesma regra de TasksListComponent#isDependencySatisfied - quem só executa fica travado
   *  enquanto a dependência não estiver DONE, quem gerencia ignora essa trava. */
  isDependencySatisfied(row: TaskWithActionPlanModel): boolean {
    return !row.dependsOnTaskId || row.dependsOnTaskStatus === TaskStatusEnum.DONE;
  }

  canAdvance(row: TaskWithActionPlanModel): boolean {
    if (!this.policy.canExecuteOwn(row) || nextForwardTaskStatus(row.status) === null) {
      return false;
    }
    return this.policy.canManage() || this.isDependencySatisfied(row);
  }

  advanceLabel(row: TaskWithActionPlanModel): string {
    if (!this.isDependencySatisfied(row)) {
      return this.i18n.tUi('tasks.action.blockedByDependency' as never, { title: row.dependsOnTaskTitle });
    }
    const next = nextForwardTaskStatus(row.status);
    return next ? this.i18n.tUi(`tasks.action.advanceTo.${next}` as never) : '';
  }

  advance(row: TaskWithActionPlanModel): void {
    const next = nextForwardTaskStatus(row.status);
    if (!next) return;

    this.facade
      .updateStatus(row.id, { status: next })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () =>
          this.toast.add({
            severity: 'success',
            summary: this.i18n.tUi('common.success'),
            detail: this.i18n.tUi('tasks.status.updated' as never),
          }),
        error: () =>
          this.toast.add({
            severity: 'error',
            summary: this.i18n.tUi('common.error'),
            detail: this.i18n.tUi('tasks.status.updateError' as never),
          }),
      });
  }

  clear() {
    this.clearTableAndReload(this.dt);
  }

  protected formatDate(value: Date | string): string {
    const date = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat(this.i18n.getLang(), { dateStyle: 'short' }).format(date);
  }

  protected override tableStateKey(): string {
    return STATE_KEY.NIMBUSFLOW.WORKS.ALL_TASKS.TABLE.STATE.V1;
  }

  protected override tableRowsKey(): string {
    return STATE_KEY.NIMBUSFLOW.WORKS.ALL_TASKS.TABLE.ROWS.V1;
  }

  protected override filtersKey(): string {
    return STATE_KEY.NIMBUSFLOW.WORKS.ALL_TASKS.FILTERS.V1;
  }

  protected override refresh(): void {
    this.reloadWithCurrentState();
  }

  protected override resetFilters(): void {
    this.title.set('');
    this.status.set(null);
    this.assigneeIds.set(null);
    this.createdAt.set(null);
    this.periodCreatedAt.set(null);
  }

  protected override toFiltersState(): TasksFiltersState {
    return {
      title: this.title(),
      status: this.status()?.length ? this.status() : null,
      assigneeIds: this.assigneeIds()?.length ? this.assigneeIds() : null,
      actionPlanIds: null,
      createdAt: this.createdAt(),
      periodCreatedAt: this.periodCreatedAt(),
    };
  }

  protected override applyFiltersState(state: TasksFiltersState): void {
    this.title.set(state.title ?? '');
    this.status.set(state.status ?? null);
    this.assigneeIds.set(state.assigneeIds ?? null);
    this.createdAt.set(state.createdAt ?? null);
    this.periodCreatedAt.set(state.periodCreatedAt ?? null);
  }

  protected override buildAdvancedFilters(): Partial<TasksAdvancedFilters> {
    return {
      title: this.title().trim() || undefined,
      status: this.status()?.length ? this.status() : undefined,
      assigneeIds: this.assigneeIds()?.length ? this.assigneeIds() : undefined,
      createdAt: this.createdAt() ?? undefined,
      periodCreatedAt: this.periodCreatedAt() ?? undefined,
    };
  }

  protected override mapTableFiltersToActiveItems(filters: any): ActiveFilterItem[] {
    this.i18n.getAppliedLang();

    const items: ActiveFilterItem[] = [];

    const title = readSingleFilterValue(filters, 'title');
    if (title) {
      items.push({ label: this.i18n.tUi('tasks.fields.title'), value: title });
    }

    const statusValues = readArrayFilterValues(filters, 'status');
    if (statusValues.length) {
      const labels = this.statusOptions
        .filter((option) => statusValues.includes(option.value))
        .map((option) => option.label);
      items.push({
        label: this.i18n.tUi('tasks.fields.status'),
        value: (labels.length ? labels : statusValues).join(', '),
      });
    }

    const createdAt = readDateRangeFilterValue(filters, 'createdAt', this.formatDate.bind(this));
    if (createdAt) {
      items.push({ label: this.i18n.tUi('tasks.fields.createdAt'), value: createdAt });
    }

    return items;
  }

  protected override loadPage(query: ReturnType<typeof buildListQuery<TasksAdvancedFilters>>): void {
    this.facade.loadPage(query);
  }

  protected override loadFirstPage(): void {}
}

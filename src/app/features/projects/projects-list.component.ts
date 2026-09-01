import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DestroyRef, Component, ViewChild, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Table } from 'primeng/table';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { FloatLabel } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { TranslateModule } from '@ngx-translate/core';
import { MultiSelectModule } from 'primeng/multiselect';
import { ProgressBarModule } from 'primeng/progressbar';
import { ConfirmationService, MessageService } from 'primeng/api';

import { I18nService } from '@core/i18n/i18n.service';
import { STATE_KEY } from '@features/state-key.constants';
import { CsCurrencyPipe } from '@shared/pipes/cs-currency.pipe';
import { ProjectsFacade } from '@features/facade/projects.facade';
import { ProjectsAdvancedFilters } from '@features/filter/projects.filters';
import { StatefulListPage } from '@features/list-base/stateful-list-page';
import { buildListQuery } from '@shared/features/list-query/list-query.builder';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { ProjectsPermissionPolicy } from '@features/projects/projects-permission.policy';
import { StatusBadgeComponent } from '@shared/features/status-badge/status-badge.component';
import {
  currencyRangeLabel,
  decimalRangeLabel,
  percentRangeLabel,
  CsCurrencyRangeFilterComponent,
} from '@features/list-base/cs-currency-range-filter.component';
import { ProjectModel, ProjectsFiltersState } from '@models/projects.models';
import {
  PROJECT_STATUS_VALUES,
  ProjectStatusEnum,
  projectStatusTone,
} from '@models/enums/project-status.enum';
import { ProjectsUpsertDialogComponent } from '@features/projects/projects-upsert-dialog.component';
import {
  ActiveFilterItem,
  FiltersPanelComponent,
} from '@shared/features/filters-panel/filters-panel.component';
import { readSingleFilterValue, readArrayFilterValues } from '@features/list-base/table-filter-readers';

@Component({
  standalone: true,
  selector: 'app-projects-list',
  templateUrl: './projects-list.component.html',
  styleUrl: './projects-list.component.scss',
  imports: [
    DecimalPipe,
    FloatLabel,
    FormsModule,
    TableModule,
    ButtonModule,
    ProgressBarModule,
    CsCurrencyPipe,
    TooltipModule,
    InputTextModule,
    TranslateModule,
    MultiSelectModule,
    PageHeaderComponent,
    StatusBadgeComponent,
    FiltersPanelComponent,
    ProjectsUpsertDialogComponent,
    CsCurrencyRangeFilterComponent,
  ],
})
export class ProjectsListComponent extends StatefulListPage<
  ProjectsFiltersState,
  ProjectsAdvancedFilters
> {
  @ViewChild('dt') private dt?: Table;

  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(MessageService);
  private readonly confirm = inject(ConfirmationService);

  protected override readonly i18n = inject(I18nService);
  readonly facade = inject(ProjectsFacade);
  readonly policy = inject(ProjectsPermissionPolicy);

  override rows =
    Number(localStorage.getItem(this.tableRowsKey())) || StatefulListPage.DEFAULT_ROWS;

  name = signal('');
  status = signal<string[] | null>(null);
  serviceFrontsCountFrom = signal<number | null>(null);
  serviceFrontsCountTo = signal<number | null>(null);
  totalContractedAmountFrom = signal<number | null>(null);
  totalContractedAmountTo = signal<number | null>(null);
  totalPaidAmountFrom = signal<number | null>(null);
  totalPaidAmountTo = signal<number | null>(null);
  remainingAmountFrom = signal<number | null>(null);
  remainingAmountTo = signal<number | null>(null);
  progressPercentageFrom = signal<number | null>(null);
  progressPercentageTo = signal<number | null>(null);

  readonly upsertVisible = signal(false);
  readonly selectedProject = signal<ProjectModel | null>(null);

  readonly totalRecords = computed(() => this.facade.totalRecords());
  readonly items = computed<ProjectModel[]>(() => this.facade.projects());
  readonly loading = computed(() => this.facade.projectsLoading());
  readonly loadedOnce = computed(() => this.facade.projectsLoadedOnce());

  readonly statusOptions = computed(() => {
    this.i18n.getAppliedLang();
    return PROJECT_STATUS_VALUES.map((value) => ({
      value,
      label: this.i18n.tUi(`projects.status.${value}` as never),
    }));
  });

  protected override readonly advancedActiveFilters = computed<ActiveFilterItem[]>(() => {
    const items: ActiveFilterItem[] = [];

    const name = this.name().trim();
    const status = this.status();

    if (name) {
      items.push({ label: this.i18n.tUi('projects.fields.name'), value: name });
    }
    if (status?.length) {
      const labels = this.statusOptions()
        .filter((opt) => status.includes(opt.value))
        .map((opt) => opt.label)
        .join(', ');
      items.push({ label: this.i18n.tUi('projects.fields.status'), value: labels });
    }
    const totalContractedLabel = currencyRangeLabel(
      this.i18n,
      this.totalContractedAmountFrom(),
      this.totalContractedAmountTo(),
    );
    if (totalContractedLabel) {
      items.push({
        label: this.i18n.tUi('projects.fields.totalContractedAmount'),
        value: totalContractedLabel,
      });
    }

    return items;
  });

  ngOnInit() {
    this.initStatefulList();
  }

  tone(status: string): ReturnType<typeof projectStatusTone> {
    return projectStatusTone(status);
  }

  goNew(): void {
    if (!this.policy.canManage()) return;
    this.selectedProject.set(null);
    this.upsertVisible.set(true);
  }

  edit(row: ProjectModel): void {
    if (!this.policy.canManage()) return;
    this.selectedProject.set(row);
    this.upsertVisible.set(true);
  }

  onUpsertVisibleChange(v: boolean): void {
    this.upsertVisible.set(v);
    if (!v) this.selectedProject.set(null);
  }

  canMarkInProgress(row: ProjectModel): boolean {
    return row.status !== ProjectStatusEnum.IN_PROGRESS && this.policy.canManage();
  }

  markInProgressDisabledReason(row: ProjectModel): string {
    if (row.status === ProjectStatusEnum.IN_PROGRESS) {
      return 'projects.action.alreadyInProgress';
    }
    return this.policy.editDisabledReason() ?? 'projects.action.noPermission';
  }

  canMarkPaused(row: ProjectModel): boolean {
    return row.status !== ProjectStatusEnum.PAUSED && this.policy.canManage();
  }

  markPausedDisabledReason(row: ProjectModel): string {
    if (row.status === ProjectStatusEnum.PAUSED) {
      return 'projects.action.alreadyPaused';
    }
    return this.policy.editDisabledReason() ?? 'projects.action.noPermission';
  }

  canMarkCompleted(row: ProjectModel): boolean {
    return row.status !== ProjectStatusEnum.COMPLETED && this.policy.canManage();
  }

  markCompletedDisabledReason(row: ProjectModel): string {
    if (row.status === ProjectStatusEnum.COMPLETED) {
      return 'projects.action.alreadyCompleted';
    }
    return this.policy.editDisabledReason() ?? 'projects.action.noPermission';
  }

  confirmMarkInProgress(row: ProjectModel): void {
    if (!this.canMarkInProgress(row)) return;

    this.confirm.confirm({
      header: this.i18n.tUi('projects.markInProgressConfirm.header' as never),
      message: this.i18n.tUi('projects.markInProgressConfirm.message' as never, {
        name: row.name,
      }),
      icon: 'pi pi-question-circle',
      accept: () => this.changeStatus(row, ProjectStatusEnum.IN_PROGRESS, 'projects.markInProgressConfirm.success'),
    });
  }

  confirmMarkPaused(row: ProjectModel): void {
    if (!this.canMarkPaused(row)) return;

    this.confirm.confirm({
      header: this.i18n.tUi('projects.markPausedConfirm.header' as never),
      message: this.i18n.tUi('projects.markPausedConfirm.message' as never, {
        name: row.name,
      }),
      icon: 'pi pi-question-circle',
      accept: () => this.changeStatus(row, ProjectStatusEnum.PAUSED, 'projects.markPausedConfirm.success'),
    });
  }

  confirmMarkCompleted(row: ProjectModel): void {
    if (!this.canMarkCompleted(row)) return;

    this.confirm.confirm({
      header: this.i18n.tUi('projects.markCompletedConfirm.header' as never),
      message: this.i18n.tUi('projects.markCompletedConfirm.message' as never, {
        name: row.name,
      }),
      icon: 'pi pi-question-circle',
      accept: () => this.changeStatus(row, ProjectStatusEnum.COMPLETED, 'projects.markCompletedConfirm.success'),
    });
  }

  private changeStatus(row: ProjectModel, status: ProjectStatusEnum, successKey: string): void {
    this.facade
      .changeStatus(row.id, status)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () =>
          this.toast.add({
            severity: 'success',
            summary: this.i18n.tUi('common.success'),
            detail: this.i18n.tUi(successKey as never),
          }),
        error: () =>
          this.toast.add({
            severity: 'error',
            summary: this.i18n.tUi('common.error'),
            detail: this.i18n.tUi('projects.form.saveError'),
          }),
      });
  }

  clear() {
    this.clearTableAndReload(this.dt);
  }

  protected override tableStateKey(): string {
    return STATE_KEY.NIMBUSFLOW.WORKS.PROJECTS.TABLE.STATE.V1;
  }

  protected override tableRowsKey(): string {
    return STATE_KEY.NIMBUSFLOW.WORKS.PROJECTS.TABLE.ROWS.V1;
  }

  protected override filtersKey(): string {
    return STATE_KEY.NIMBUSFLOW.WORKS.PROJECTS.FILTERS.V1;
  }

  protected override refresh(): void {
    this.reloadWithCurrentState();
  }

  protected override resetFilters(): void {
    this.name.set('');
    this.status.set(null);
    this.serviceFrontsCountFrom.set(null);
    this.serviceFrontsCountTo.set(null);
    this.totalContractedAmountFrom.set(null);
    this.totalContractedAmountTo.set(null);
    this.totalPaidAmountFrom.set(null);
    this.totalPaidAmountTo.set(null);
    this.remainingAmountFrom.set(null);
    this.remainingAmountTo.set(null);
    this.progressPercentageFrom.set(null);
    this.progressPercentageTo.set(null);
  }

  protected override toFiltersState(): ProjectsFiltersState {
    return {
      name: this.name(),
      status: this.status()?.length ? this.status() : null,
      serviceFrontsCountFrom: this.serviceFrontsCountFrom(),
      serviceFrontsCountTo: this.serviceFrontsCountTo(),
      totalContractedAmountFrom: this.totalContractedAmountFrom(),
      totalContractedAmountTo: this.totalContractedAmountTo(),
      totalPaidAmountFrom: this.totalPaidAmountFrom(),
      totalPaidAmountTo: this.totalPaidAmountTo(),
      remainingAmountFrom: this.remainingAmountFrom(),
      remainingAmountTo: this.remainingAmountTo(),
      progressPercentageFrom: this.progressPercentageFrom(),
      progressPercentageTo: this.progressPercentageTo(),
    };
  }

  protected override applyFiltersState(state: ProjectsFiltersState): void {
    this.name.set(state.name ?? '');
    this.status.set(state.status ?? null);
    this.serviceFrontsCountFrom.set(state.serviceFrontsCountFrom ?? null);
    this.serviceFrontsCountTo.set(state.serviceFrontsCountTo ?? null);
    this.totalContractedAmountFrom.set(state.totalContractedAmountFrom ?? null);
    this.totalContractedAmountTo.set(state.totalContractedAmountTo ?? null);
    this.totalPaidAmountFrom.set(state.totalPaidAmountFrom ?? null);
    this.totalPaidAmountTo.set(state.totalPaidAmountTo ?? null);
    this.remainingAmountFrom.set(state.remainingAmountFrom ?? null);
    this.remainingAmountTo.set(state.remainingAmountTo ?? null);
    this.progressPercentageFrom.set(state.progressPercentageFrom ?? null);
    this.progressPercentageTo.set(state.progressPercentageTo ?? null);
  }

  protected override buildAdvancedFilters(): Partial<ProjectsAdvancedFilters> {
    return {
      name: this.name().trim() || undefined,
      status: this.status()?.length ? this.status() : undefined,
      serviceFrontsCountFrom: this.serviceFrontsCountFrom() ?? undefined,
      serviceFrontsCountTo: this.serviceFrontsCountTo() ?? undefined,
      totalContractedAmountFrom: this.totalContractedAmountFrom() ?? undefined,
      totalContractedAmountTo: this.totalContractedAmountTo() ?? undefined,
      totalPaidAmountFrom: this.totalPaidAmountFrom() ?? undefined,
      totalPaidAmountTo: this.totalPaidAmountTo() ?? undefined,
      remainingAmountFrom: this.remainingAmountFrom() ?? undefined,
      remainingAmountTo: this.remainingAmountTo() ?? undefined,
      progressPercentageFrom: this.progressPercentageFrom() ?? undefined,
      progressPercentageTo: this.progressPercentageTo() ?? undefined,
    };
  }

  protected override mapTableFiltersToActiveItems(filters: any): ActiveFilterItem[] {
    this.i18n.getAppliedLang();

    const items: ActiveFilterItem[] = [];

    const name = readSingleFilterValue(filters, 'name');
    if (name) {
      items.push({ label: this.i18n.tUi('projects.fields.name'), value: name });
    }

    const statusValues = readArrayFilterValues(filters, 'status');
    if (statusValues.length) {
      const labels = this.statusOptions()
        .filter((option) => statusValues.includes(option.value))
        .map((option) => option.label);
      items.push({
        label: this.i18n.tUi('projects.fields.status'),
        value: (labels.length ? labels : statusValues).join(', '),
      });
    }

    const serviceFrontsCountRange =
      filters?.['serviceFrontsCount']?.value ?? filters?.['serviceFrontsCount']?.[0]?.value;
    if (
      Array.isArray(serviceFrontsCountRange) &&
      (serviceFrontsCountRange[0] != null || serviceFrontsCountRange[1] != null)
    ) {
      const label = decimalRangeLabel(this.i18n, serviceFrontsCountRange[0], serviceFrontsCountRange[1]);
      if (label) {
        items.push({ label: this.i18n.tUi('projects.fields.serviceFrontsCount'), value: label });
      }
    }

    const totalContractedRange =
      filters?.['totalContractedAmount']?.value ?? filters?.['totalContractedAmount']?.[0]?.value;
    if (
      Array.isArray(totalContractedRange) &&
      (totalContractedRange[0] != null || totalContractedRange[1] != null)
    ) {
      const label = currencyRangeLabel(this.i18n, totalContractedRange[0], totalContractedRange[1]);
      if (label) {
        items.push({ label: this.i18n.tUi('projects.fields.totalContractedAmount'), value: label });
      }
    }

    const totalPaidRange =
      filters?.['totalPaidAmount']?.value ?? filters?.['totalPaidAmount']?.[0]?.value;
    if (Array.isArray(totalPaidRange) && (totalPaidRange[0] != null || totalPaidRange[1] != null)) {
      const label = currencyRangeLabel(this.i18n, totalPaidRange[0], totalPaidRange[1]);
      if (label) {
        items.push({ label: this.i18n.tUi('projects.fields.totalPaidAmount'), value: label });
      }
    }

    const remainingRange =
      filters?.['remainingAmount']?.value ?? filters?.['remainingAmount']?.[0]?.value;
    if (Array.isArray(remainingRange) && (remainingRange[0] != null || remainingRange[1] != null)) {
      const label = currencyRangeLabel(this.i18n, remainingRange[0], remainingRange[1]);
      if (label) {
        items.push({ label: this.i18n.tUi('projects.fields.remainingAmount'), value: label });
      }
    }

    const progressRange =
      filters?.['progressPercentage']?.value ?? filters?.['progressPercentage']?.[0]?.value;
    if (Array.isArray(progressRange) && (progressRange[0] != null || progressRange[1] != null)) {
      const label = percentRangeLabel(this.i18n, progressRange[0], progressRange[1]);
      if (label) {
        items.push({ label: this.i18n.tUi('projects.fields.progress'), value: label });
      }
    }

    return items;
  }

  protected override loadPage(
    query: ReturnType<typeof buildListQuery<ProjectsAdvancedFilters>>,
  ): void {
    this.facade.loadPage(query);
  }

  protected override loadFirstPage(): void {}
}

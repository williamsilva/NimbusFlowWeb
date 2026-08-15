
import { Router } from '@angular/router';
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
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { I18nService } from '@core/i18n/i18n.service';
import { CsDatePipe } from '@shared/pipes/cs-date.pipe';
import { STATE_KEY } from '@features/state-key.constants';
import { WorkModel } from '@models/works.models';
import { WorksFacade } from '@features/facade/works.facade';
import { ProjectModel } from '@models/projects.models';
import { ActionPlansFacade } from '@features/facade/action-plans.facade';
import { StatefulListPage } from '@features/list-base/stateful-list-page';
import { buildListQuery } from '@shared/features/list-query/list-query.builder';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { ActionPlansAdvancedFilters } from '@features/filter/action-plans.filters';
import { ActionPlansPermissionPolicy } from '@features/action-plans/action-plans-permission.policy';
import { StatusBadgeComponent } from '@shared/features/status-badge/status-badge.component';
import {
  ACTION_PLAN_STATUS_VALUES,
  ActionPlanStatusEnum,
  actionPlanStatusTone,
} from '@models/enums/action-plan-status.enum';
import { ActionPlanModel, ActionPlansFiltersState } from '@models/action-plans.models';
import { ActionPlansCreateDialogComponent } from '@features/action-plans/action-plans-create/action-plans-create-dialog.component';
import { WorksCreateDialogComponent } from '@features/works/works-create/works-create-dialog.component';
import { ProjectsUpsertDialogComponent } from '@features/projects/projects-upsert-dialog.component';
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
  selector: 'app-action-plans-list',
  templateUrl: './action-plans-list.component.html',
  styleUrl: './action-plans-list.component.scss',
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
    ConfirmDialogModule,
    PageHeaderComponent,
    FiltersPanelComponent,
    StatusBadgeComponent,
    ActionPlansCreateDialogComponent,
    WorksCreateDialogComponent,
    ProjectsUpsertDialogComponent,
    CsAdvancedPeriodDateFilterComponent,
  ],
})
export class ActionPlansListComponent extends StatefulListPage<
  ActionPlansFiltersState,
  ActionPlansAdvancedFilters
> {
  @ViewChild('dt') private dt?: Table;

  protected override readonly i18n = inject(I18nService);
  readonly facade = inject(ActionPlansFacade);
  readonly worksFacade = inject(WorksFacade);
  protected readonly toast = inject(MessageService);
  protected readonly confirm = inject(ConfirmationService);
  protected readonly policy = inject(ActionPlansPermissionPolicy);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  override rows =
    Number(localStorage.getItem(this.tableRowsKey())) || StatefulListPage.DEFAULT_ROWS;

  title = signal('');
  status = signal<string[] | null>(null);
  workIds = signal<string[] | null>(null);
  createdAt = signal<string | string[] | null>(null);
  periodCreatedAt = signal<PeriodEnum | null>(null);

  newVisible = signal(false);
  editingPlan = signal<ActionPlanModel | null>(null);

  /** Plano em uso nos fluxos "cadastrar novo Projeto"/"criar nova Frente de Serviço" - sempre
   *  cria um registro novo (nunca reaproveita existente, mesmo padrão já adotado em Chamados). */
  linkTargetPlanId = signal<string | null>(null);
  createProjectVisible = signal(false);
  createWorkVisible = signal(false);

  readonly statusOptions = ACTION_PLAN_STATUS_VALUES.map((value) => ({
    value,
    label: this.i18n.tUi(`actionPlans.status.${value}` as never),
  }));

  readonly periodEnumOptions = computed(() => {
    this.i18n.getAppliedLang();
    return allPeriodEnum().map((value) => ({ label: periodEnumLabel(value, this.i18n), value }));
  });

  readonly workOptions = this.worksFacade.options;
  readonly canManage = computed(() => this.policy.canManage());
  readonly totalRecords = computed(() => this.facade.totalRecords());
  readonly actionPlans = computed<ActionPlanModel[]>(() => this.facade.actionPlans());

  /** Pré-preenche o nome da Frente/Projeto ao criar um novo a partir do plano (ver
   *  WorksCreateDialogComponent#initialName/ProjectsUpsertDialogComponent#initialName) - deriva
   *  do id compartilhado em vez de um signal próprio. */
  readonly linkTargetPlanTitle = computed(() => {
    const id = this.linkTargetPlanId();
    if (!id) return null;
    return this.actionPlans().find((p) => p.id === id)?.title ?? null;
  });

  protected override readonly advancedActiveFilters = computed<ActiveFilterItem[]>(() => {
    const items: ActiveFilterItem[] = [];

    const title = this.title().trim();
    const status = this.status();
    const workIds = this.workIds();

    if (title) {
      items.push({ label: this.i18n.tUi('actionPlans.fields.title'), value: title });
    }
    if (status?.length) {
      const labels = this.statusOptions
        .filter((opt) => status.includes(opt.value))
        .map((opt) => opt.label)
        .join(', ');
      items.push({ label: this.i18n.tUi('actionPlans.fields.status'), value: labels });
    }
    if (workIds?.length) {
      const labels = this.workOptions()
        .filter((opt) => workIds.includes(opt.value))
        .map((opt) => opt.label)
        .join(', ');
      items.push({
        label: this.i18n.tUi('actionPlans.fields.work'),
        value: labels || workIds.join(', '),
      });
    }
    const createdAtLabel = this.formatActiveFilterPeriodDateValue(
      this.periodCreatedAt(),
      this.createdAt(),
      this.i18n,
    );
    if (createdAtLabel) {
      items.push({ label: this.i18n.tUi('actionPlans.fields.createdAt'), value: createdAtLabel });
    }

    return items;
  });

  ngOnInit() {
    this.worksFacade.loadOptions();
    this.initStatefulList();
  }

  tone(status: string): ReturnType<typeof actionPlanStatusTone> {
    return actionPlanStatusTone(status);
  }

  goNew(): void {
    this.editingPlan.set(null);
    this.newVisible.set(true);
  }

  goEdit(row: ActionPlanModel): void {
    this.editingPlan.set(row);
    this.newVisible.set(true);
  }

  goTasks(row: ActionPlanModel): void {
    this.router.navigate(['/action-plans', row.id, 'tasks']);
  }

  onSaved(): void {
    this.refresh();
  }

  onNewVisibleChange(v: boolean): void {
    this.newVisible.set(v);
    if (!v) this.editingPlan.set(null);
  }

  canEdit(row: ActionPlanModel): boolean {
    return (
      this.canManage() &&
      (row.status === ActionPlanStatusEnum.DRAFT || row.status === ActionPlanStatusEnum.IN_PROGRESS)
    );
  }

  canStart(row: ActionPlanModel): boolean {
    return this.canManage() && row.status === ActionPlanStatusEnum.DRAFT;
  }

  canComplete(row: ActionPlanModel): boolean {
    return (
      this.canManage() &&
      row.status === ActionPlanStatusEnum.IN_PROGRESS &&
      row.pendingTasksCount === 0
    );
  }

  /** Mesmo racional de tasks-list#advanceLabel: quando o motivo de estar desabilitado não é óbvio
   *  (status errado / sem permissão), explica no tooltip por que ainda há tarefas pendentes. */
  completeTooltip(row: ActionPlanModel): string {
    if (
      this.canManage() &&
      row.status === ActionPlanStatusEnum.IN_PROGRESS &&
      row.pendingTasksCount > 0
    ) {
      return this.i18n.tUi('actionPlans.action.hasOpenTasks' as never);
    }
    return this.i18n.tUi('actionPlans.action.complete' as never);
  }

  canCancel(row: ActionPlanModel): boolean {
    return (
      this.canManage() &&
      (row.status === ActionPlanStatusEnum.DRAFT || row.status === ActionPlanStatusEnum.IN_PROGRESS)
    );
  }

  /** projectId==null pra impedir cadastrar de novo pela UI (mesma restrição já adotada em
   *  Chamados) - status editável, mesma elegibilidade de canEdit/canCancel. */
  canCreateProject(row: ActionPlanModel): boolean {
    return (
      this.canManage() &&
      row.projectId == null &&
      (row.status === ActionPlanStatusEnum.DRAFT || row.status === ActionPlanStatusEnum.IN_PROGRESS)
    );
  }

  canCreateWork(row: ActionPlanModel): boolean {
    return (
      this.canManage() &&
      row.workId == null &&
      (row.status === ActionPlanStatusEnum.DRAFT || row.status === ActionPlanStatusEnum.IN_PROGRESS)
    );
  }

  goCreateProject(row: ActionPlanModel): void {
    this.linkTargetPlanId.set(row.id);
    this.createProjectVisible.set(true);
  }

  goCreateWork(row: ActionPlanModel): void {
    this.linkTargetPlanId.set(row.id);
    this.createWorkVisible.set(true);
  }

  onCreateProjectVisibleChange(v: boolean): void {
    this.createProjectVisible.set(v);
    if (!v) this.linkTargetPlanId.set(null);
  }

  onCreateWorkVisibleChange(v: boolean): void {
    this.createWorkVisible.set(v);
    if (!v) this.linkTargetPlanId.set(null);
  }

  /** O Projeto acabou de ser criado (ProjectsUpsertDialogComponent) - vincula ele ao plano que
   *  disparou o fluxo. linkTargetPlanId ainda está setado aqui: (created) emite antes de
   *  (visibleChange), que só zera o id (ver onCreateProjectVisibleChange). */
  onProjectCreated(project: ProjectModel): void {
    const planId = this.linkTargetPlanId();
    if (!planId) return;

    this.facade
      .linkProject(planId, { projectId: project.id })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.add({
            severity: 'success',
            summary: this.i18n.tUi('common.success'),
            detail: this.i18n.tUi('actionPlans.action.projectLinked' as never),
          });
          this.refresh();
        },
        error: () =>
          this.toast.add({
            severity: 'error',
            summary: this.i18n.tUi('common.error'),
            detail: this.i18n.tUi('actionPlans.action.projectLinkError' as never),
          }),
      });
  }

  /** Mesmo racional de onProjectCreated, pra Frente de Serviço (WorksCreateDialogComponent). */
  onWorkCreated(work: WorkModel): void {
    const planId = this.linkTargetPlanId();
    if (!planId) return;

    this.facade
      .linkWork(planId, { workId: work.id })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.add({
            severity: 'success',
            summary: this.i18n.tUi('common.success'),
            detail: this.i18n.tUi('actionPlans.action.workLinked' as never),
          });
          this.refresh();
        },
        error: () =>
          this.toast.add({
            severity: 'error',
            summary: this.i18n.tUi('common.error'),
            detail: this.i18n.tUi('actionPlans.action.workLinkError' as never),
          }),
      });
  }

  confirmStart(row: ActionPlanModel): void {
    if (!this.canStart(row)) return;
    this.runAction(this.facade.start(row.id), 'actionPlans.startConfirm.success', 'actionPlans.form.saveError');
  }

  confirmComplete(row: ActionPlanModel): void {
    if (!this.canComplete(row)) return;

    this.confirm.confirm({
      key: 'actionPlans',
      header: this.i18n.tUi('actionPlans.completeConfirm.header'),
      message: this.i18n.tUi('actionPlans.completeConfirm.message'),
      icon: 'pi pi-question-circle',
      accept: () =>
        this.runAction(
          this.facade.complete(row.id),
          'actionPlans.completeConfirm.success',
          'actionPlans.action.hasOpenTasks',
        ),
    });
  }

  confirmCancel(row: ActionPlanModel): void {
    if (!this.canCancel(row)) return;

    this.confirm.confirm({
      key: 'actionPlans',
      header: this.i18n.tUi('actionPlans.cancelConfirm.header'),
      message: this.i18n.tUi('actionPlans.cancelConfirm.message'),
      icon: 'pi pi-exclamation-triangle',
      accept: () =>
        this.runAction(
          this.facade.cancel(row.id),
          'actionPlans.cancelConfirm.success',
          'actionPlans.form.saveError',
        ),
    });
  }

  private runAction(
    request: ReturnType<ActionPlansFacade['start']>,
    successKey: string,
    errorKey: string,
  ): void {
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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
          detail: this.i18n.tUi(errorKey as never),
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
    return STATE_KEY.NIMBUSFLOW.WORKS.ACTION_PLANS.TABLE.STATE.V1;
  }

  protected override tableRowsKey(): string {
    return STATE_KEY.NIMBUSFLOW.WORKS.ACTION_PLANS.TABLE.ROWS.V1;
  }

  protected override filtersKey(): string {
    return STATE_KEY.NIMBUSFLOW.WORKS.ACTION_PLANS.FILTERS.V1;
  }

  protected override refresh(): void {
    this.reloadWithCurrentState();
  }

  protected override resetFilters(): void {
    this.title.set('');
    this.status.set(null);
    this.workIds.set(null);
    this.createdAt.set(null);
    this.periodCreatedAt.set(null);
  }

  protected override toFiltersState(): ActionPlansFiltersState {
    return {
      title: this.title(),
      status: this.status()?.length ? this.status() : null,
      workIds: this.workIds()?.length ? this.workIds() : null,
      createdAt: this.createdAt(),
      periodCreatedAt: this.periodCreatedAt(),
    };
  }

  protected override applyFiltersState(state: ActionPlansFiltersState): void {
    this.title.set(state.title ?? '');
    this.status.set(state.status ?? null);
    this.workIds.set(state.workIds ?? null);
    this.createdAt.set(state.createdAt ?? null);
    this.periodCreatedAt.set(state.periodCreatedAt ?? null);
  }

  protected override buildAdvancedFilters(): Partial<ActionPlansAdvancedFilters> {
    return {
      title: this.title().trim() || undefined,
      status: this.status()?.length ? this.status() : undefined,
      workIds: this.workIds()?.length ? this.workIds() : undefined,
      createdAt: this.createdAt() ?? undefined,
      periodCreatedAt: this.periodCreatedAt() ?? undefined,
    };
  }

  protected override mapTableFiltersToActiveItems(filters: any): ActiveFilterItem[] {
    this.i18n.getAppliedLang();

    const items: ActiveFilterItem[] = [];

    const title = readSingleFilterValue(filters, 'title');
    if (title) {
      items.push({ label: this.i18n.tUi('actionPlans.fields.title'), value: title });
    }

    const statusValues = readArrayFilterValues(filters, 'status');
    if (statusValues.length) {
      const labels = this.statusOptions
        .filter((option) => statusValues.includes(option.value))
        .map((option) => option.label);
      items.push({
        label: this.i18n.tUi('actionPlans.fields.status'),
        value: (labels.length ? labels : statusValues).join(', '),
      });
    }

    const createdAt = readDateRangeFilterValue(filters, 'createdAt', this.formatDate.bind(this));
    if (createdAt) {
      items.push({ label: this.i18n.tUi('actionPlans.fields.createdAt'), value: createdAt });
    }

    return items;
  }

  protected override loadPage(
    query: ReturnType<typeof buildListQuery<ActionPlansAdvancedFilters>>,
  ): void {
    this.facade.loadPage(query);
  }

  protected override loadFirstPage(): void {}
}

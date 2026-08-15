
import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';

import { I18nService } from '@core/i18n/i18n.service';
import { CsDatePipe } from '@shared/pipes/cs-date.pipe';
import { TasksFacade } from '@features/facade/tasks.facade';
import { ActionPlansFacade } from '@features/facade/action-plans.facade';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { TasksPermissionPolicy } from '@features/tasks/tasks-permission.policy';
import { StatusBadgeComponent } from '@shared/features/status-badge/status-badge.component';
import { TaskModel } from '@models/tasks.models';
import { ActionPlanModel } from '@models/action-plans.models';
import {
  TaskStatusEnum,
  taskStatusTone,
  nextForwardTaskStatus,
} from '@models/enums/task-status.enum';
import { TasksCreateDialogComponent } from '@features/tasks/tasks-create/tasks-create-dialog.component';

@Component({
  standalone: true,
  selector: 'app-tasks-list',
  templateUrl: './tasks-list.component.html',
  styleUrl: './tasks-list.component.scss',
  imports: [
    CsDatePipe,
    TableModule,
    ButtonModule,
    TooltipModule,
    TranslateModule,
    PageHeaderComponent,
    StatusBadgeComponent,
    TasksCreateDialogComponent,
  ],
})
export class TasksListComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly i18n = inject(I18nService);
  readonly facade = inject(TasksFacade);
  readonly policy = inject(TasksPermissionPolicy);
  private readonly actionPlansFacade = inject(ActionPlansFacade);
  private readonly toast = inject(MessageService);

  readonly actionPlanId = signal('');
  readonly actionPlan = signal<ActionPlanModel | null>(null);
  readonly upsertVisible = signal(false);
  readonly editingTask = signal<TaskModel | null>(null);

  readonly items = computed<TaskModel[]>(() => this.facade.items());
  readonly loading = computed(() => this.facade.loading());
  readonly loadedOnce = computed(() => this.facade.loadedOnce());
  readonly canManage = computed(() => this.policy.canManage());

  ngOnInit(): void {
    const actionPlanId = this.route.snapshot.paramMap.get('actionPlanId');
    if (!actionPlanId) {
      this.router.navigate(['/action-plans']);
      return;
    }

    this.actionPlanId.set(actionPlanId);
    this.actionPlansFacade
      .getById(actionPlanId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (plan) => this.actionPlan.set(plan),
        error: () => this.router.navigate(['/action-plans']),
      });

    this.facade.loadByActionPlan(actionPlanId);
  }

  tone(status: string): ReturnType<typeof taskStatusTone> {
    return taskStatusTone(status);
  }

  refresh(): void {
    this.facade.loadByActionPlan(this.actionPlanId());
  }

  goNew(): void {
    this.editingTask.set(null);
    this.upsertVisible.set(true);
  }

  goEdit(row: TaskModel): void {
    this.editingTask.set(row);
    this.upsertVisible.set(true);
  }

  onUpsertVisibleChange(v: boolean): void {
    this.upsertVisible.set(v);
    if (!v) this.editingTask.set(null);
  }

  canEdit(row: TaskModel): boolean {
    return this.canManage() && row.status !== TaskStatusEnum.DONE && row.status !== TaskStatusEnum.CANCELLED;
  }

  canAdvance(row: TaskModel): boolean {
    return this.policy.canExecuteOwn(row) && nextForwardTaskStatus(row.status) !== null;
  }

  advanceLabel(row: TaskModel): string {
    const next = nextForwardTaskStatus(row.status);
    return next ? this.i18n.tUi(`tasks.action.advanceTo.${next}` as never) : '';
  }

  advance(row: TaskModel): void {
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
}

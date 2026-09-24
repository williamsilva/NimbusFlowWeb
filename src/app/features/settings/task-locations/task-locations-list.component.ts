import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { ConfirmationService, MessageService } from 'primeng/api';

import { I18nService } from '@core/i18n/i18n.service';
import { PERMISSIONS } from '@core/auth/permissions.constants';
import { PermissionService } from '@core/auth/permission.service';
import { TaskLocationModel } from '@models/task-locations.models';
import { TaskLocationsFacade } from '@features/facade/task-locations.facade';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { TaskLocationFormDialogComponent } from '@features/settings/task-locations/task-location-form-dialog.component';

@Component({
  standalone: true,
  selector: 'app-task-locations-list',
  templateUrl: './task-locations-list.component.html',
  styleUrl: './task-locations-list.component.scss',
  imports: [
    TableModule,
    ButtonModule,
    TooltipModule,
    TranslateModule,
    PageHeaderComponent,
    TaskLocationFormDialogComponent,
  ],
})
export class TaskLocationsListComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(MessageService);
  private readonly confirm = inject(ConfirmationService);

  readonly i18n = inject(I18nService);
  readonly facade = inject(TaskLocationsFacade);
  private readonly perms = inject(PermissionService);

  readonly items = computed(() => this.facade.items());
  readonly loading = computed(() => this.facade.loading());
  readonly loadedOnce = computed(() => this.facade.loadedOnce());

  readonly formVisible = signal(false);
  readonly editing = signal<TaskLocationModel | null>(null);

  readonly canChange = computed(() => this.perms.hasSupportOr(PERMISSIONS.SETTINGS.TASK_LOCATION_CHANGE));

  ngOnInit(): void {
    this.facade.load();
  }

  goNew(): void {
    if (!this.canChange()) return;
    this.editing.set(null);
    this.formVisible.set(true);
  }

  goEdit(row: TaskLocationModel): void {
    if (!this.canChange()) return;
    this.editing.set(row);
    this.formVisible.set(true);
  }

  onFormVisibleChange(v: boolean): void {
    this.formVisible.set(v);
  }

  confirmDelete(row: TaskLocationModel): void {
    if (!this.canChange()) return;

    this.confirm.confirm({
      header: this.i18n.tUi('taskLocations.deleteConfirm.header'),
      message: this.i18n.tUi('taskLocations.deleteConfirm.message'),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.facade
          .delete(row.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () =>
              this.toast.add({
                severity: 'success',
                summary: this.i18n.tUi('common.success'),
                detail: this.i18n.tUi('taskLocations.deleteConfirm.success'),
              }),
            error: () =>
              this.toast.add({
                severity: 'error',
                summary: this.i18n.tUi('common.error'),
                detail: this.i18n.tUi('taskLocations.deleteConfirm.error'),
              }),
          });
      },
    });
  }
}

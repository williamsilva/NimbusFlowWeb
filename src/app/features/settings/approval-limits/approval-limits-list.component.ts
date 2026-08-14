import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { ConfirmationService, MessageService } from 'primeng/api';

import { I18nService } from '@core/i18n/i18n.service';
import { PERMISSIONS } from '@core/auth/permissions.constants';
import { PermissionService } from '@core/auth/permission.service';
import { CsCurrencyPipe } from '@shared/pipes/cs-currency.pipe';
import { UsersApiService } from '@features/service/users.api.service';
import { UserOptionModel } from '@models/groups.models';
import { ApprovalLimitModel } from '@models/approval-limits.models';
import { ApprovalLimitsFacade } from '@features/facade/approval-limits.facade';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { ApprovalLimitFormDialogComponent } from '@features/settings/approval-limits/approval-limit-form-dialog.component';

@Component({
  standalone: true,
  selector: 'app-approval-limits-list',
  templateUrl: './approval-limits-list.component.html',
  styleUrl: './approval-limits-list.component.scss',
  imports: [
    TableModule,
    ButtonModule,
    CsCurrencyPipe,
    TooltipModule,
    TranslateModule,
    PageHeaderComponent,
    ApprovalLimitFormDialogComponent,
  ],
})
export class ApprovalLimitsListComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(MessageService);
  private readonly confirm = inject(ConfirmationService);
  private readonly usersApi = inject(UsersApiService);

  readonly i18n = inject(I18nService);
  readonly facade = inject(ApprovalLimitsFacade);
  private readonly perms = inject(PermissionService);

  readonly items = computed(() => this.facade.items());
  readonly loading = computed(() => this.facade.loading());
  readonly loadedOnce = computed(() => this.facade.loadedOnce());

  readonly userOptions = signal<UserOptionModel[]>([]);
  readonly formVisible = signal(false);
  readonly editing = signal<ApprovalLimitModel | null>(null);

  readonly canChange = computed(() => this.perms.hasSupportOr(PERMISSIONS.SETTINGS.ALCADA_CHANGE));

  ngOnInit(): void {
    this.facade.load();
    this.usersApi
      .getOptions()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => this.userOptions.set(items ?? []),
        error: () => this.userOptions.set([]),
      });
  }

  userNames(userIds: string[]): string {
    const byId = new Map(this.userOptions().map((u) => [u.id, u.name]));
    return userIds.map((id) => byId.get(id) ?? id).join(', ');
  }

  goNew(): void {
    if (!this.canChange()) return;
    this.editing.set(null);
    this.formVisible.set(true);
  }

  goEdit(row: ApprovalLimitModel): void {
    if (!this.canChange()) return;
    this.editing.set(row);
    this.formVisible.set(true);
  }

  onFormVisibleChange(v: boolean): void {
    this.formVisible.set(v);
  }

  confirmDelete(row: ApprovalLimitModel): void {
    if (!this.canChange()) return;

    this.confirm.confirm({
      header: this.i18n.tUi('approvalLimits.deleteConfirm.header'),
      message: this.i18n.tUi('approvalLimits.deleteConfirm.message'),
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
                detail: this.i18n.tUi('approvalLimits.deleteConfirm.success'),
              }),
            error: () =>
              this.toast.add({
                severity: 'error',
                summary: this.i18n.tUi('common.error'),
                detail: this.i18n.tUi('approvalLimits.deleteConfirm.error'),
              }),
          });
      },
    });
  }
}

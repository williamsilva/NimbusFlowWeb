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
import { UsersApiService } from '@features/service/users.api.service';
import { UserOptionModel } from '@models/groups.models';
import { UserMinimalModel } from '@models/user-minimal.models';
import { CargoModel } from '@models/cargos.models';
import { CargosFacade } from '@features/facade/cargos.facade';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { CargoFormDialogComponent } from '@features/settings/cargos/cargo-form-dialog.component';

@Component({
  standalone: true,
  selector: 'app-cargos-list',
  templateUrl: './cargos-list.component.html',
  styleUrl: './cargos-list.component.scss',
  imports: [
    TableModule,
    ButtonModule,
    TooltipModule,
    TranslateModule,
    PageHeaderComponent,
    CargoFormDialogComponent,
  ],
})
export class CargosListComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(MessageService);
  private readonly confirm = inject(ConfirmationService);
  private readonly usersApi = inject(UsersApiService);

  readonly i18n = inject(I18nService);
  readonly facade = inject(CargosFacade);
  private readonly perms = inject(PermissionService);

  readonly items = computed(() => this.facade.items());
  readonly loading = computed(() => this.facade.loading());
  readonly loadedOnce = computed(() => this.facade.loadedOnce());

  readonly userOptions = signal<UserOptionModel[]>([]);
  readonly formVisible = signal(false);
  readonly editing = signal<CargoModel | null>(null);

  readonly canChange = computed(() => this.perms.hasSupportOr(PERMISSIONS.SETTINGS.CARGO_CHANGE));

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

  userNames(users: UserMinimalModel[]): string {
    return users.map((u) => u.name).join(', ');
  }

  goNew(): void {
    if (!this.canChange()) return;
    this.editing.set(null);
    this.formVisible.set(true);
  }

  goEdit(row: CargoModel): void {
    if (!this.canChange()) return;
    this.editing.set(row);
    this.formVisible.set(true);
  }

  onFormVisibleChange(v: boolean): void {
    this.formVisible.set(v);
  }

  confirmDelete(row: CargoModel): void {
    if (!this.canChange()) return;

    this.confirm.confirm({
      header: this.i18n.tUi('cargos.deleteConfirm.header'),
      message: this.i18n.tUi('cargos.deleteConfirm.message'),
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
                detail: this.i18n.tUi('cargos.deleteConfirm.success'),
              }),
            error: () =>
              this.toast.add({
                severity: 'error',
                summary: this.i18n.tUi('common.error'),
                detail: this.i18n.tUi('cargos.deleteConfirm.error'),
              }),
          });
      },
    });
  }
}

import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { ConfirmationService, MessageService } from 'primeng/api';

import { I18nService } from '@core/i18n/i18n.service';
import { CsDatePipe } from '@shared/pipes/cs-date.pipe';
import { CsCurrencyPipe } from '@shared/pipes/cs-currency.pipe';
import { ManutencaoModel } from '@models/manutencoes.models';
import { ManutencoesFacade } from '@features/facade/manutencoes.facade';
import { statusManutencaoTone } from '@models/patrimonio-enums';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { StatusBadgeComponent, StatusTone } from '@shared/features/status-badge/status-badge.component';
import { PatrimonioPermissionPolicy } from '@features/patrimonio/patrimonio-permission.policy';
import { ManutencaoFormDialogComponent } from '@features/patrimonio/manutencoes/manutencao-form-dialog.component';

@Component({
  standalone: true,
  selector: 'app-manutencoes-list',
  templateUrl: './manutencoes-list.component.html',
  imports: [
    CsDatePipe,
    CsCurrencyPipe,
    TableModule,
    ButtonModule,
    TooltipModule,
    TranslateModule,
    PageHeaderComponent,
    StatusBadgeComponent,
    ManutencaoFormDialogComponent,
  ],
})
export class ManutencoesListComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(MessageService);
  private readonly confirm = inject(ConfirmationService);

  readonly i18n = inject(I18nService);
  readonly facade = inject(ManutencoesFacade);
  readonly policy = inject(PatrimonioPermissionPolicy);

  readonly items = computed(() => this.facade.items());
  readonly loading = computed(() => this.facade.loading());
  readonly loadedOnce = computed(() => this.facade.loadedOnce());

  readonly formVisible = signal(false);
  readonly editing = signal<ManutencaoModel | null>(null);

  readonly canManage = computed(() => this.policy.canManageManutencoes());

  ngOnInit(): void {
    this.facade.load();
  }

  statusTone(status: string): StatusTone {
    return statusManutencaoTone(status);
  }

  canDelete(row: ManutencaoModel): boolean {
    return this.canManage() && row.status !== 'RECEBIDA' && row.status !== 'CONCERTADA';
  }

  goNew(): void {
    if (!this.canManage()) return;
    this.editing.set(null);
    this.formVisible.set(true);
  }

  goEdit(row: ManutencaoModel): void {
    if (!this.canManage()) return;
    this.editing.set(row);
    this.formVisible.set(true);
  }

  onFormVisibleChange(v: boolean): void {
    this.formVisible.set(v);
  }

  confirmDelete(row: ManutencaoModel): void {
    if (!this.canDelete(row)) return;

    this.confirm.confirm({
      header: this.i18n.tUi('manutencoes.deleteConfirm.header' as never),
      message: this.i18n.tUi('manutencoes.deleteConfirm.message' as never),
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
                detail: this.i18n.tUi('manutencoes.deleteConfirm.success' as never),
              }),
            error: (err) =>
              this.toast.add({
                severity: 'error',
                summary: this.i18n.tUi('common.error'),
                detail: err?.error?.message ?? this.i18n.tUi('manutencoes.deleteConfirm.error' as never),
              }),
          });
      },
    });
  }
}

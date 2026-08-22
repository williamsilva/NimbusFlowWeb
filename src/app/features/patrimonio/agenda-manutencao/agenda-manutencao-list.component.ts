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
import { AgendaManutencaoModel } from '@models/agenda-manutencao.models';
import { AgendaManutencaoFacade } from '@features/facade/agenda-manutencao.facade';
import { statusAgendaManutencaoTone } from '@models/patrimonio-enums';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { StatusBadgeComponent, StatusTone } from '@shared/features/status-badge/status-badge.component';
import { PatrimonioPermissionPolicy } from '@features/patrimonio/patrimonio-permission.policy';
import { AgendaManutencaoFormDialogComponent } from '@features/patrimonio/agenda-manutencao/agenda-manutencao-form-dialog.component';

@Component({
  standalone: true,
  selector: 'app-agenda-manutencao-list',
  templateUrl: './agenda-manutencao-list.component.html',
  imports: [
    CsDatePipe,
    TableModule,
    ButtonModule,
    TooltipModule,
    TranslateModule,
    PageHeaderComponent,
    StatusBadgeComponent,
    AgendaManutencaoFormDialogComponent,
  ],
})
export class AgendaManutencaoListComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(MessageService);
  private readonly confirm = inject(ConfirmationService);

  readonly i18n = inject(I18nService);
  readonly facade = inject(AgendaManutencaoFacade);
  readonly policy = inject(PatrimonioPermissionPolicy);

  readonly items = computed(() => this.facade.items());
  readonly loading = computed(() => this.facade.loading());
  readonly loadedOnce = computed(() => this.facade.loadedOnce());

  readonly formVisible = signal(false);
  readonly editing = signal<AgendaManutencaoModel | null>(null);

  readonly canManage = computed(() => this.policy.canManageAgendaManutencao());

  ngOnInit(): void {
    this.facade.load();
  }

  statusTone(status: string): StatusTone {
    return statusAgendaManutencaoTone(status);
  }

  goNew(): void {
    if (!this.canManage()) return;
    this.editing.set(null);
    this.formVisible.set(true);
  }

  goEdit(row: AgendaManutencaoModel): void {
    if (!this.canManage()) return;
    this.editing.set(row);
    this.formVisible.set(true);
  }

  onFormVisibleChange(v: boolean): void {
    this.formVisible.set(v);
  }

  confirmDelete(row: AgendaManutencaoModel): void {
    if (!this.canManage()) return;

    this.confirm.confirm({
      header: this.i18n.tUi('agendaManutencao.deleteConfirm.header' as never),
      message: this.i18n.tUi('agendaManutencao.deleteConfirm.message' as never),
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
                detail: this.i18n.tUi('agendaManutencao.deleteConfirm.success' as never),
              }),
            error: () =>
              this.toast.add({
                severity: 'error',
                summary: this.i18n.tUi('common.error'),
                detail: this.i18n.tUi('agendaManutencao.deleteConfirm.error' as never),
              }),
          });
      },
    });
  }
}

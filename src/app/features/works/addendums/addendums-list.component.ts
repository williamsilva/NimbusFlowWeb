import { NgIf } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
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
import { WorksFacade } from '@features/facade/works.facade';
import { AddendumsFacade } from '@features/facade/addendums.facade';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { AddendumsPermissionPolicy } from '@features/works/addendums-permission.policy';
import { StatusBadgeComponent } from '@shared/features/status-badge/status-badge.component';
import { AddendumModel } from '@models/addendums.models';
import { WorkModel } from '@models/works.models';
import { AddendumStatusEnum, addendumStatusTone } from '@models/enums/addendum-status.enum';
import { AddendumsCreateDialogComponent } from '@features/works/addendums/addendums-create-dialog.component';
import { translateWorksErrorDetail } from '@features/works/works-error.util';

@Component({
  standalone: true,
  selector: 'app-addendums-list',
  templateUrl: './addendums-list.component.html',
  imports: [
    NgIf,
    TableModule,
    ButtonModule,
    CsDatePipe,
    CsCurrencyPipe,
    TooltipModule,
    TranslateModule,
    PageHeaderComponent,
    StatusBadgeComponent,
    AddendumsCreateDialogComponent,
  ],
})
export class AddendumsListComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly i18n = inject(I18nService);
  readonly facade = inject(AddendumsFacade);
  readonly policy = inject(AddendumsPermissionPolicy);
  private readonly worksFacade = inject(WorksFacade);
  private readonly toast = inject(MessageService);
  private readonly confirm = inject(ConfirmationService);

  readonly workId = signal('');
  readonly work = signal<WorkModel | null>(null);
  readonly upsertVisible = signal(false);

  readonly items = computed<AddendumModel[]>(() => this.facade.items());
  readonly loading = computed(() => this.facade.loading());

  ngOnInit(): void {
    const workId = this.route.snapshot.paramMap.get('workId');
    if (!workId) {
      this.router.navigate(['/works']);
      return;
    }

    this.workId.set(workId);
    this.worksFacade
      .getById(workId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (work) => this.work.set(work),
        error: () => this.router.navigate(['/works']),
      });

    this.facade.loadByWork(workId);
  }

  tone(status: string): ReturnType<typeof addendumStatusTone> {
    return addendumStatusTone(status);
  }

  isPending(row: AddendumModel): boolean {
    return row.status === AddendumStatusEnum.PENDING;
  }

  goNew(): void {
    if (!this.policy.canCreate()) return;
    this.upsertVisible.set(true);
  }

  onUpsertVisibleChange(v: boolean): void {
    this.upsertVisible.set(v);
  }

  confirmApprove(row: AddendumModel): void {
    if (!this.policy.canDecide(row.requiredTier)) return;

    this.confirm.confirm({
      header: this.i18n.tUi('addendums.approveConfirm.header'),
      message: this.i18n.tUi('addendums.approveConfirm.message', {
        amount: this.i18n.formatBrlCurrency(row.amount),
      }),
      icon: 'pi pi-question-circle',
      accept: () => {
        this.facade
          .approve(row.id, { decisionNote: null })
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () =>
              this.toast.add({
                severity: 'success',
                summary: this.i18n.tUi('common.success'),
                detail: this.i18n.tUi('addendums.approveConfirm.success'),
              }),
            error: (err) =>
              this.toast.add({
                severity: 'error',
                summary: this.i18n.tUi('common.error'),
                detail:
                  translateWorksErrorDetail(err, this.i18n) ??
                  this.i18n.tUi('addendums.form.saveError'),
              }),
          });
      },
    });
  }

  confirmReject(row: AddendumModel): void {
    if (!this.policy.canDecide(row.requiredTier)) return;

    this.confirm.confirm({
      header: this.i18n.tUi('addendums.rejectConfirm.header'),
      message: this.i18n.tUi('addendums.rejectConfirm.message', {
        amount: this.i18n.formatBrlCurrency(row.amount),
      }),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.facade
          .reject(row.id, { decisionNote: null })
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () =>
              this.toast.add({
                severity: 'success',
                summary: this.i18n.tUi('common.success'),
                detail: this.i18n.tUi('addendums.rejectConfirm.success'),
              }),
            error: (err) =>
              this.toast.add({
                severity: 'error',
                summary: this.i18n.tUi('common.error'),
                detail:
                  translateWorksErrorDetail(err, this.i18n) ??
                  this.i18n.tUi('addendums.form.saveError'),
              }),
          });
      },
    });
  }
}

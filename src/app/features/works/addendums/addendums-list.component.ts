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

import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { MultiSelectModule } from 'primeng/multiselect';

import { I18nService } from '@core/i18n/i18n.service';
import { CsDatePipe } from '@shared/pipes/cs-date.pipe';
import { CsCurrencyPipe } from '@shared/pipes/cs-currency.pipe';
import { STATE_KEY } from '@features/state-key.constants';
import { WorksFacade } from '@features/facade/works.facade';
import { AddendumsFacade } from '@features/facade/addendums.facade';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { AddendumsPermissionPolicy } from '@features/works/addendums-permission.policy';
import { StatusBadgeComponent } from '@shared/features/status-badge/status-badge.component';
import { CsCurrencyRangeFilterComponent } from '@features/list-base/cs-currency-range-filter.component';
import { AddendumModel } from '@models/addendums.models';
import { WorkModel } from '@models/works.models';
import { ADDENDUM_STATUS_VALUES, AddendumStatusEnum, addendumStatusTone } from '@models/enums/addendum-status.enum';
import { AddendumsCreateDialogComponent } from '@features/works/addendums/addendums-create-dialog.component';
import { formatApprovalRanges } from '@features/works/addendums/addendums-approval-range.util';
import { translateWorksErrorDetail } from '@features/works/works-error.util';

@Component({
  standalone: true,
  selector: 'app-addendums-list',
  templateUrl: './addendums-list.component.html',
  imports: [
    NgIf,
    FormsModule,
    TableModule,
    ButtonModule,
    CsDatePipe,
    CsCurrencyPipe,
    TooltipModule,
    InputTextModule,
    TranslateModule,
    DatePickerModule,
    MultiSelectModule,
    PageHeaderComponent,
    StatusBadgeComponent,
    AddendumsCreateDialogComponent,
    CsCurrencyRangeFilterComponent,
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
  readonly loadedOnce = computed(() => this.facade.loadedOnce());

  readonly statusOptions = computed(() => {
    this.i18n.getAppliedLang();
    return ADDENDUM_STATUS_VALUES.map((value) => ({
      value,
      label: this.i18n.tUi(`addendums.status.${value}` as never),
    }));
  });

  tableStateKey(): string {
    return STATE_KEY.NIMBUSFLOW.WORKS.ADDENDUMS.TABLE.STATE.V1;
  }

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

  approvalRangeLabel(row: AddendumModel): string {
    return formatApprovalRanges(this.i18n, row.approvalRanges);
  }

  goNew(): void {
    if (!this.policy.canCreate()) return;
    this.upsertVisible.set(true);
  }

  onUpsertVisibleChange(v: boolean): void {
    this.upsertVisible.set(v);
  }

  confirmApprove(row: AddendumModel): void {
    if (!row.canDecide) return;

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
    if (!row.canDecide) return;

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

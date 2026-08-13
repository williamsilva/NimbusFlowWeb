import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { DatePickerModule } from 'primeng/datepicker';
import { MultiSelectModule } from 'primeng/multiselect';
import { TranslateModule } from '@ngx-translate/core';
import { ConfirmationService, MessageService } from 'primeng/api';

import { I18nService } from '@core/i18n/i18n.service';
import { CsDatePipe } from '@shared/pipes/cs-date.pipe';
import { CsCurrencyPipe } from '@shared/pipes/cs-currency.pipe';
import { STATE_KEY } from '@features/state-key.constants';
import { WorksFacade } from '@features/facade/works.facade';
import { InstallmentsFacade } from '@features/facade/installments.facade';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { InstallmentsPermissionPolicy } from '@features/works/installments-permission.policy';
import { StatusBadgeComponent } from '@shared/features/status-badge/status-badge.component';
import { CsCurrencyRangeFilterComponent } from '@features/list-base/cs-currency-range-filter.component';
import { InstallmentModel } from '@models/installments.models';
import { WorkModel } from '@models/works.models';
import {
  INSTALLMENT_STATUS_VALUES,
  InstallmentStatusEnum,
  installmentStatusTone,
} from '@models/enums/installment-status.enum';
import { translateWorksErrorDetail } from '@features/works/works-error.util';

@Component({
  standalone: true,
  selector: 'app-installments-list',
  templateUrl: './installments-list.component.html',
  imports: [
    FormsModule,
    TableModule,
    ButtonModule,
    CsDatePipe,
    CsCurrencyPipe,
    TooltipModule,
    TranslateModule,
    DatePickerModule,
    MultiSelectModule,
    PageHeaderComponent,
    StatusBadgeComponent,
    CsCurrencyRangeFilterComponent,
  ],
})
export class InstallmentsListComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly i18n = inject(I18nService);
  readonly facade = inject(InstallmentsFacade);
  readonly policy = inject(InstallmentsPermissionPolicy);
  private readonly worksFacade = inject(WorksFacade);
  private readonly toast = inject(MessageService);
  private readonly confirm = inject(ConfirmationService);

  readonly workId = signal('');
  readonly work = signal<WorkModel | null>(null);

  readonly items = computed<InstallmentModel[]>(() => this.facade.items());
  readonly loading = computed(() => this.facade.loading());
  readonly loadedOnce = computed(() => this.facade.loadedOnce());

  readonly statusOptions = computed(() => {
    this.i18n.getAppliedLang();
    return INSTALLMENT_STATUS_VALUES.map((value) => ({
      value,
      label: this.i18n.tUi(`installments.status.${value}` as never),
    }));
  });

  tableStateKey(): string {
    return STATE_KEY.NIMBUSFLOW.WORKS.INSTALLMENTS.TABLE.STATE.V1;
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

  tone(status: string): ReturnType<typeof installmentStatusTone> {
    return installmentStatusTone(status);
  }

  refresh(): void {
    this.facade.loadByWork(this.workId());
  }

  canRelease(row: InstallmentModel): boolean {
    return row.status === InstallmentStatusEnum.MEASUREMENT_APPROVED && this.policy.canRelease();
  }

  releaseDisabledReason(row: InstallmentModel): string {
    if (row.status !== InstallmentStatusEnum.MEASUREMENT_APPROVED) {
      return 'installments.action.requiresMeasurementApproved';
    }
    return this.policy.releaseDisabledReason() ?? 'installments.action.noPermission';
  }

  canMarkPaid(row: InstallmentModel): boolean {
    return row.status === InstallmentStatusEnum.RELEASED && this.policy.canMarkPaid();
  }

  markPaidDisabledReason(row: InstallmentModel): string {
    if (row.status !== InstallmentStatusEnum.RELEASED) {
      return 'installments.action.requiresReleased';
    }
    return this.policy.markPaidDisabledReason() ?? 'installments.action.noPermission';
  }

  canResendNotification(row: InstallmentModel): boolean {
    return (
      (row.status === InstallmentStatusEnum.RELEASED || row.status === InstallmentStatusEnum.PAID) &&
      this.policy.canResendNotification()
    );
  }

  resendNotificationDisabledReason(row: InstallmentModel): string {
    if (row.status !== InstallmentStatusEnum.RELEASED && row.status !== InstallmentStatusEnum.PAID) {
      return 'installments.action.requiresReleasedOrPaid';
    }
    return this.policy.resendNotificationDisabledReason() ?? 'installments.action.noPermission';
  }

  confirmRelease(row: InstallmentModel): void {
    if (!this.canRelease(row)) return;

    this.confirm.confirm({
      header: this.i18n.tUi('installments.releaseConfirm.header'),
      message: this.i18n.tUi('installments.releaseConfirm.message', {
        number: row.number,
      }),
      icon: 'pi pi-question-circle',
      accept: () => {
        this.facade
          .release(row.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () =>
              this.toast.add({
                severity: 'success',
                summary: this.i18n.tUi('common.success'),
                detail: this.i18n.tUi('installments.releaseConfirm.success'),
              }),
            error: (err) =>
              this.toast.add({
                severity: 'error',
                summary: this.i18n.tUi('common.error'),
                detail:
                  translateWorksErrorDetail(err, this.i18n) ??
                  this.i18n.tUi('installments.form.saveError'),
              }),
          });
      },
    });
  }

  confirmMarkPaid(row: InstallmentModel): void {
    if (!this.canMarkPaid(row)) return;

    this.confirm.confirm({
      header: this.i18n.tUi('installments.markPaidConfirm.header'),
      message: this.i18n.tUi('installments.markPaidConfirm.message', {
        number: row.number,
      }),
      icon: 'pi pi-question-circle',
      accept: () => {
        this.facade
          .markPaid(row.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () =>
              this.toast.add({
                severity: 'success',
                summary: this.i18n.tUi('common.success'),
                detail: this.i18n.tUi('installments.markPaidConfirm.success'),
              }),
            error: (err) =>
              this.toast.add({
                severity: 'error',
                summary: this.i18n.tUi('common.error'),
                detail:
                  translateWorksErrorDetail(err, this.i18n) ??
                  this.i18n.tUi('installments.form.saveError'),
              }),
          });
      },
    });
  }

  confirmResendNotification(row: InstallmentModel): void {
    if (!this.canResendNotification(row)) return;

    this.confirm.confirm({
      header: this.i18n.tUi('installments.resendNotificationConfirm.header'),
      message: this.i18n.tUi('installments.resendNotificationConfirm.message', {
        number: row.number,
      }),
      icon: 'pi pi-question-circle',
      accept: () => {
        this.facade
          .resendNotification(row.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () =>
              this.toast.add({
                severity: 'success',
                summary: this.i18n.tUi('common.success'),
                detail: this.i18n.tUi('installments.resendNotificationConfirm.success'),
              }),
            error: (err) =>
              this.toast.add({
                severity: 'error',
                summary: this.i18n.tUi('common.error'),
                detail:
                  translateWorksErrorDetail(err, this.i18n) ??
                  this.i18n.tUi('installments.form.saveError'),
              }),
          });
      },
    });
  }
}

import { DestroyRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { DatePickerModule } from 'primeng/datepicker';
import { TranslateModule } from '@ngx-translate/core';
import { MultiSelectModule } from 'primeng/multiselect';
import { ConfirmationService, MessageService } from 'primeng/api';

import { WorkModel } from '@models/works.models';
import { I18nService } from '@core/i18n/i18n.service';
import { CsDatePipe } from '@shared/pipes/cs-date.pipe';
import { DateInputMaskDirective } from '@shared/directives/date-input-mask.directive';
import { STATE_KEY } from '@features/state-key.constants';
import { WorksFacade } from '@features/facade/works.facade';
import { InstallmentModel, InstallmentWithWorkModel } from '@models/installments.models';
import { CsCurrencyPipe } from '@shared/pipes/cs-currency.pipe';
import { InstallmentsFacade } from '@features/facade/installments.facade';
import { translateWorksErrorDetail } from '@features/works/works-error.util';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { StatusBadgeComponent } from '@shared/features/status-badge/status-badge.component';
import { InstallmentsPermissionPolicy } from '@features/works/installments-permission.policy';
import { formatApprovalRanges } from '@features/works/installments/installments-approval-range.util';
import { formatSequentialNumber } from '@shared/utils/br-format';
import { CsCurrencyRangeFilterComponent } from '@features/list-base/cs-currency-range-filter.component';
import {
  InstallmentStatusEnum,
  installmentStatusTone,
  INSTALLMENT_STATUS_VALUES,
} from '@models/enums/installment-status.enum';

@Component({
  standalone: true,
  selector: 'app-installments-list',
  templateUrl: './installments-list.component.html',
  styleUrl: './installments-list.component.scss',
  imports: [
    FormsModule,
    CsDatePipe,
    TableModule,
    ButtonModule,
    CsCurrencyPipe,
    TooltipModule,
    TranslateModule,
    DatePickerModule,
    MultiSelectModule,
    PageHeaderComponent,
    StatusBadgeComponent,
    CsCurrencyRangeFilterComponent,
    DateInputMaskDirective,
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

  /** InstallmentModel puro não tem workName (endpoint por obra não manda - já implícito na URL/
   *  work() carregado à parte) - a coluna "Frente de serviço" da tabela (mesmo layout da listagem
   *  global) precisa do campo no próprio row pra sort/filter do PrimeNG funcionarem, então
   *  completa aqui com o nome já carregado em work(), igual pra todas as linhas desta página. */
  readonly items = computed<InstallmentWithWorkModel[]>(() => {
    const workName = this.work()?.name ?? '';
    return this.facade.items().map((item) => ({ ...item, workName }));
  });
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

  /** row.canRelease já cobre status MEASUREMENT_APPROVED + permissão/alçada (ver
   *  InstallmentService.canReleasePending) - mesmo padrão de AddendumModel.canDecide, não
   *  recalcular no cliente. */
  canRelease(row: InstallmentModel): boolean {
    return row.canRelease;
  }

  releaseDisabledReason(row: InstallmentModel): string {
    if (row.status !== InstallmentStatusEnum.MEASUREMENT_APPROVED) {
      return 'installments.action.requiresMeasurementApproved';
    }
    return 'installments.action.noPermission';
  }

  approvalRangeLabel(row: InstallmentModel): string {
    return formatApprovalRanges(this.i18n, row.approvalRanges);
  }

  /** Sequencial por obra com prefixo "PAG-" (ex.: PAG-0001) - mesmo padrão de
   *  Addendums/MeasurementsListComponent ("ADT-"/"MED-"). */
  numberLabel(row: InstallmentModel): string {
    return formatSequentialNumber('PAG', row.number);
  }

  canResendNotification(row: InstallmentModel): boolean {
    return (
      (row.status === InstallmentStatusEnum.RELEASED ||
        row.status === InstallmentStatusEnum.CANCELLED) &&
      this.policy.canResendNotification()
    );
  }

  resendNotificationDisabledReason(row: InstallmentModel): string {
    if (
      row.status !== InstallmentStatusEnum.RELEASED &&
      row.status !== InstallmentStatusEnum.CANCELLED
    ) {
      return 'installments.action.requiresReleasedOrCancelled';
    }
    return this.policy.resendNotificationDisabledReason() ?? 'installments.action.noPermission';
  }

  confirmRelease(row: InstallmentModel): void {
    if (!this.canRelease(row)) return;

    this.confirm.confirm({
      header: this.i18n.tUi('installments.releaseConfirm.header'),
      message: this.i18n.tUi('installments.releaseConfirm.message', {
        number: this.numberLabel(row),
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

  confirmResendNotification(row: InstallmentModel): void {
    if (!this.canResendNotification(row)) return;

    this.confirm.confirm({
      header: this.i18n.tUi('installments.resendNotificationConfirm.header'),
      message: this.i18n.tUi('installments.resendNotificationConfirm.message', {
        number: this.numberLabel(row),
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

  /** row.canCancel já cobre status != CANCELLED, não vinculada a nenhum Pagamento + permissão
   *  MEDICAO_REABRIR (ver PaymentOrderService.canCancel) - mesmo padrão de canRelease, não
   *  recalcular no cliente. */
  canCancelOrder(row: InstallmentModel): boolean {
    return row.canCancel;
  }

  cancelOrderDisabledReason(row: InstallmentModel): string {
    if (row.status === InstallmentStatusEnum.CANCELLED) {
      return 'installments.action.alreadyCancelled';
    }
    if (row.installmentId !== null) {
      return 'installments.action.alreadySent';
    }
    return this.policy.cancelOrderDisabledReason() ?? 'installments.action.noPermission';
  }

  /** Cancela a Ordem e reabre a Medição que a gerou pra PENDING - desfaz "todo o processo" desde a
   *  liberação, não só a liberação em si (ver MeasurementService.cancelGeneratedOrderAndReopen). */
  confirmCancelOrder(row: InstallmentModel): void {
    if (!this.canCancelOrder(row)) return;

    this.confirm.confirm({
      header: this.i18n.tUi('installments.cancelOrderConfirm.header'),
      message: this.i18n.tUi('installments.cancelOrderConfirm.message', {
        number: this.numberLabel(row),
      }),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.facade
          .cancel(row.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () =>
              this.toast.add({
                severity: 'success',
                summary: this.i18n.tUi('common.success'),
                detail: this.i18n.tUi('installments.cancelOrderConfirm.success'),
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

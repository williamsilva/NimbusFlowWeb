import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';

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
import { WorksFacade } from '@features/facade/works.facade';
import { ProjectsFacade } from '@features/facade/projects.facade';
import { STATE_KEY } from '@features/state-key.constants';
import { MeasurementsFacade } from '@features/facade/measurements.facade';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { MeasurementsPermissionPolicy } from '@features/works/measurements-permission.policy';
import { StatusBadgeComponent } from '@shared/features/status-badge/status-badge.component';
import { CsCurrencyRangeFilterComponent } from '@features/list-base/cs-currency-range-filter.component';
import { MeasurementModel } from '@models/measurements.models';
import { WorkModel } from '@models/works.models';
import { WorkStatusEnum } from '@models/enums/work-status.enum';
import {
  MEASUREMENT_STATUS_VALUES,
  MeasurementStatusEnum,
  measurementStatusTone,
} from '@models/enums/measurement-status.enum';
import { MeasurementsCreateDialogComponent } from '@features/works/measurements/measurements-create-dialog.component';
import { translateWorksErrorDetail } from '@features/works/works-error.util';
import { formatSequentialNumber } from '@shared/utils/br-format';

const SUBMITTABLE_WORK_STATUSES = new Set<WorkStatusEnum>([WorkStatusEnum.PLANNED, WorkStatusEnum.IN_PROGRESS]);

@Component({
  standalone: true,
  selector: 'app-measurements-list',
  templateUrl: './measurements-list.component.html',
  styleUrl: './measurements-list.component.scss',
  imports: [
    DecimalPipe,
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
    MeasurementsCreateDialogComponent,
    CsCurrencyRangeFilterComponent,
  ],
})
export class MeasurementsListComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly i18n = inject(I18nService);
  readonly facade = inject(MeasurementsFacade);
  readonly policy = inject(MeasurementsPermissionPolicy);
  private readonly worksFacade = inject(WorksFacade);
  private readonly projectsFacade = inject(ProjectsFacade);
  private readonly toast = inject(MessageService);
  private readonly confirm = inject(ConfirmationService);

  readonly workId = signal('');
  readonly work = signal<WorkModel | null>(null);
  readonly upsertVisible = signal(false);

  /** Planta do Projeto da obra - mesmo Projeto já carregado em ProjectsFacade pro dropdown de
   *  Work, sem chamada extra (ver cs-site-plan-picker no diálogo de nova medição). */
  readonly siteplanUrl = computed(
    () => this.projectsFacade.items().find((p) => p.id === this.work()?.projectId)?.siteplanUrl ?? null,
  );

  readonly items = computed<MeasurementModel[]>(() => this.facade.items());
  readonly loading = computed(() => this.facade.loading());
  readonly loadedOnce = computed(() => this.facade.loadedOnce());

  readonly statusOptions = computed(() => {
    this.i18n.getAppliedLang();
    return MEASUREMENT_STATUS_VALUES.map((value) => ({
      value,
      label: this.i18n.tUi(`measurements.status.${value}` as never),
    }));
  });

  readonly canCreate = computed(() => {
    const work = this.work();
    return this.policy.canCreate() && !!work && SUBMITTABLE_WORK_STATUSES.has(work.status);
  });

  readonly createDisabledReason = computed<string | null>(() => {
    if (!this.policy.canCreate()) return this.policy.createDisabledReason();
    const work = this.work();
    if (!work || !SUBMITTABLE_WORK_STATUSES.has(work.status)) {
      return 'measurements.action.requiresSubmittableWork';
    }
    return null;
  });

  tableStateKey(): string {
    return STATE_KEY.NIMBUSFLOW.WORKS.MEASUREMENTS.TABLE.STATE.V1;
  }

  ngOnInit(): void {
    const workId = this.route.snapshot.paramMap.get('workId');
    if (!workId) {
      this.router.navigate(['/works']);
      return;
    }

    this.workId.set(workId);
    this.projectsFacade.loadAll();
    this.worksFacade
      .getById(workId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (work) => this.work.set(work),
        error: () => this.router.navigate(['/works']),
      });

    this.facade.loadByWork(workId);
  }

  tone(status: string): ReturnType<typeof measurementStatusTone> {
    return measurementStatusTone(status);
  }

  refresh(): void {
    this.facade.loadByWork(this.workId());
  }

  isPending(row: MeasurementModel): boolean {
    return row.status === MeasurementStatusEnum.PENDING;
  }

  canDecide(row: MeasurementModel): boolean {
    return this.isPending(row) && this.policy.canDecide();
  }

  decideDisabledReason(row: MeasurementModel): string {
    if (!this.isPending(row)) {
      return 'measurements.action.alreadyDecided';
    }
    return this.policy.decideDisabledReason() ?? 'measurements.action.noPermission';
  }

  /** Sequencial por obra com prefixo "MED-" (ex.: MED-0001) - mesmo padrão de InstallmentsListComponent. */
  numberLabel(row: MeasurementModel): string {
    return formatSequentialNumber('MED', row.number);
  }

  goNew(): void {
    if (!this.canCreate()) return;
    this.upsertVisible.set(true);
  }

  onUpsertVisibleChange(v: boolean): void {
    this.upsertVisible.set(v);
  }

  confirmApprove(row: MeasurementModel): void {
    if (!this.canDecide(row)) return;

    this.confirm.confirm({
      header: this.i18n.tUi('measurements.approveConfirm.header'),
      message: this.i18n.tUi('measurements.approveConfirm.message'),
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
                detail: this.i18n.tUi('measurements.approveConfirm.success'),
              }),
            error: (err) =>
              this.toast.add({
                severity: 'error',
                summary: this.i18n.tUi('common.error'),
                detail:
                  translateWorksErrorDetail(err, this.i18n) ??
                  this.i18n.tUi('measurements.form.saveError'),
              }),
          });
      },
    });
  }

  confirmReject(row: MeasurementModel): void {
    if (!this.canDecide(row)) return;

    this.confirm.confirm({
      header: this.i18n.tUi('measurements.rejectConfirm.header'),
      message: this.i18n.tUi('measurements.rejectConfirm.message'),
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
                detail: this.i18n.tUi('measurements.rejectConfirm.success'),
              }),
            error: (err) =>
              this.toast.add({
                severity: 'error',
                summary: this.i18n.tUi('common.error'),
                detail:
                  translateWorksErrorDetail(err, this.i18n) ??
                  this.i18n.tUi('measurements.form.saveError'),
              }),
          });
      },
    });
  }
}

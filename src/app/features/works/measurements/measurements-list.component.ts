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
import { DateInputMaskDirective } from '@shared/directives/date-input-mask.directive';
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
import { MeasurementsEditDialogComponent } from '@features/works/measurements/measurements-edit-dialog.component';
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
    MeasurementsEditDialogComponent,
    CsCurrencyRangeFilterComponent,
    DateInputMaskDirective,
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
  readonly editVisible = signal(false);
  readonly editingMeasurement = signal<MeasurementModel | null>(null);

  /** Planta do Projeto da obra - mesmo Projeto já carregado em ProjectsFacade.optionsItems() pro
   *  dropdown de Work, sem chamada extra (ver cs-site-plan-picker no diálogo de nova medição). */
  readonly siteplanUrl = computed(
    () => this.projectsFacade.optionsItems().find((p) => p.id === this.work()?.projectId)?.siteplanUrl ?? null,
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

  /** Teto do valor a pagar pro diálogo de edição - soma de volta o amountToPay atual da medição
   *  em edição (se ela já tiver gerado uma parcela) ao restante da obra, já que salvar cancela
   *  essa parcela antes de validar o novo valor (mesmo cálculo feito no backend, ver
   *  MeasurementService.updateMeasurement). Sem isso, o campo ficaria travado abaixo do valor que
   *  a própria medição já ocupa. */
  readonly dialogRemainingAmount = computed(() => {
    const base = this.work()?.remainingAmount ?? 0;
    const editing = this.editingMeasurement();
    return editing?.generatedInstallmentId ? base + editing.amountToPay : base;
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
    this.projectsFacade.loadOptions();
    this.reloadWork({ navigateOnError: true });

    this.facade.loadByWork(workId);
  }

  /** work() é carregado uma vez em ngOnInit e nunca reagia a mudanças de remainingAmount feitas
   *  nesta própria página (aprovar medição gera Parcela e reduz o restante da obra) - abrir "Nova
   *  Medição"/"Editar" logo depois de aprovar mostrava o teto antigo, só corrigia com F5. Refaz a
   *  busca da obra antes de abrir os diálogos e depois de aprovar/editar. Best-effort (sem navegar
   *  pra fora em caso de erro, diferente da carga inicial) - falhar aqui não deveria travar a
   *  tela, só deixar o teto temporariamente desatualizado. */
  private reloadWork(opts: { navigateOnError: boolean } = { navigateOnError: false }): void {
    const workId = this.workId();
    if (!workId) return;

    this.worksFacade
      .getById(workId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (work) => this.work.set(work),
        error: () => {
          if (opts.navigateOnError) this.router.navigate(['/works']);
        },
      });
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
    this.reloadWork();
    this.upsertVisible.set(true);
  }

  onUpsertVisibleChange(v: boolean): void {
    this.upsertVisible.set(v);
  }

  /** PENDING exige a mesma permissão de criar; já decidida (APPROVED/REJECTED) exige a de decidir
   *  - editar pode cancelar uma parcela já liberada ou ressuscitar uma medição já decidida (ver
   *  MeasurementsPermissionPolicy#canEdit). Uma parcela já PAGA bloqueia a edição, mas isso só é
   *  validado no backend (esta lista não carrega o status da parcela, só o id gerado). */
  canEdit(row: MeasurementModel): boolean {
    return this.policy.canEdit(row.status);
  }

  editDisabledReason(row: MeasurementModel): string {
    return this.policy.editDisabledReason(row.status) ?? 'measurements.action.noPermission';
  }

  goEdit(row: MeasurementModel): void {
    if (!this.canEdit(row)) return;
    this.reloadWork();
    this.editingMeasurement.set(row);
    this.editVisible.set(true);
  }

  onEditVisibleChange(v: boolean): void {
    this.editVisible.set(v);
    if (!v) this.editingMeasurement.set(null);
  }

  onUpdated(): void {
    this.refresh();
    // Editar cancela a Parcela gerada anteriormente (ver MeasurementService.updateMeasurement) -
    // devolve valor pro restante da obra, então work() precisa ser refeito.
    this.reloadWork();
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
            next: () => {
              this.toast.add({
                severity: 'success',
                summary: this.i18n.tUi('common.success'),
                detail: this.i18n.tUi('measurements.approveConfirm.success'),
              });
              // Aprovar gera (e pode auto-liberar) uma Parcela, reduzindo o restante da obra.
              this.reloadWork();
            },
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

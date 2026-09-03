import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, ViewChild, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';

import { Table } from 'primeng/table';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { FloatLabel } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { MultiSelectModule } from 'primeng/multiselect';
import { TranslateModule } from '@ngx-translate/core';
import { ConfirmationService, MessageService } from 'primeng/api';

import { I18nService } from '@core/i18n/i18n.service';
import { CsDatePipe } from '@shared/pipes/cs-date.pipe';
import { DateInputMaskDirective } from '@williamsilva/nimbus-web-commons';
import { CsCurrencyPipe } from '@shared/pipes/cs-currency.pipe';
import { STATE_KEY } from '@features/state-key.constants';
import { SuppliersFacade } from '@features/facade/suppliers.facade';
import { MeasurementsGlobalFacade } from '@features/facade/measurements-global.facade';
import { MeasurementsAdvancedFilters } from '@features/filter/measurements.filters';
import { StatefulListPage } from '@williamsilva/nimbus-web-commons';
import { buildListQuery } from '@williamsilva/nimbus-web-commons';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { MeasurementsPermissionPolicy } from '@features/works/measurements-permission.policy';
import { StatusBadgeComponent } from '@shared/features/status-badge/status-badge.component';
import { MeasurementWithContextModel, MeasurementsFiltersState } from '@models/measurements.models';
import { PeriodEnum, allPeriodEnum, periodEnumLabel } from '@models/enums/period.enum';
import { CsAdvancedPeriodDateFilterComponent } from '@williamsilva/nimbus-web-commons';
import {
  currencyRangeLabel,
  CsCurrencyRangeFilterComponent,
} from '@features/list-base/cs-currency-range-filter.component';
import {
  ActiveFilterItem,
  FiltersPanelComponent,
} from '@williamsilva/nimbus-web-commons';
import {
  readSingleFilterValue,
  readArrayFilterValues,
  readDateRangeFilterValue,
} from '@williamsilva/nimbus-web-commons';
import {
  MEASUREMENT_STATUS_VALUES,
  MeasurementStatusEnum,
  measurementStatusTone,
} from '@models/enums/measurement-status.enum';
import { translateWorksErrorDetail } from '@features/works/works-error.util';
import { formatSequentialNumber } from '@shared/utils/br-format';

@Component({
  standalone: true,
  selector: 'app-all-measurements-list',
  templateUrl: './all-measurements-list.component.html',
  styleUrl: './all-measurements-list.component.scss',
  imports: [
    FloatLabel,
    DecimalPipe,
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
    FiltersPanelComponent,
    CsCurrencyRangeFilterComponent,
    CsAdvancedPeriodDateFilterComponent,
    DateInputMaskDirective,
  ],
})
export class AllMeasurementsListComponent extends StatefulListPage<
  MeasurementsFiltersState,
  MeasurementsAdvancedFilters
> {
  @ViewChild('dt') private dt?: Table;
  private readonly destroyRef = inject(DestroyRef);

  protected override readonly i18n = inject(I18nService);
  readonly facade = inject(MeasurementsGlobalFacade);
  readonly policy = inject(MeasurementsPermissionPolicy);
  private readonly toast = inject(MessageService);
  private readonly confirm = inject(ConfirmationService);
  private readonly suppliersFacade = inject(SuppliersFacade);

  /** Opções do filtro avançado por fornecedor (multiselect) - carregadas em ngOnInit, mesmo
   *  padrão de AllInstallmentsListComponent.supplierOptions/WorksListComponent.supplierOptions. */
  readonly supplierOptions = this.suppliersFacade.options;

  override rows =
    Number(localStorage.getItem(this.tableRowsKey())) || StatefulListPage.DEFAULT_ROWS;

  /** Seleção pra aprovação em lote (ver confirmApproveSelected()) - mantida entre páginas de
   *  propósito, mesmo padrão de AllInstallmentsListComponent.selection (dataKey="id" + PrimeNG
   *  reconciliando quem está marcado independente da página atual). */
  readonly selection = signal<MeasurementWithContextModel[]>([]);
  readonly approvingBatch = signal(false);

  readonly selectedTotal = computed(() =>
    this.selection().reduce((sum, r) => sum + r.amountToPay, 0),
  );

  supplierId = signal<string[] | null>(null);
  workName = signal('');
  description = signal('');
  status = signal<string[] | null>(this.defaultStatus());
  amountToPayFrom = signal<number | null>(null);
  amountToPayTo = signal<number | null>(null);
  dueDate = signal<string | string[] | null>(null);
  periodDueDate = signal<PeriodEnum | null>(null);

  readonly periodEnumOptions = computed(() => {
    this.i18n.getAppliedLang();
    return allPeriodEnum().map((value) => ({ label: periodEnumLabel(value, this.i18n), value }));
  });

  readonly totalRecords = computed(() => this.facade.totalRecords());
  readonly items = computed<MeasurementWithContextModel[]>(() => this.facade.items());
  readonly loading = computed(() => this.facade.loading());
  readonly loadedOnce = computed(() => this.facade.loadedOnce());

  readonly statusOptions = computed(() => {
    this.i18n.getAppliedLang();
    return MEASUREMENT_STATUS_VALUES.map((value) => ({
      value,
      label: this.i18n.tUi(`measurements.status.${value}` as never),
    }));
  });

  protected override readonly advancedActiveFilters = computed<ActiveFilterItem[]>(() => {
    const items: ActiveFilterItem[] = [];

    const supplierId = this.supplierId();
    const workName = this.workName().trim();
    const description = this.description().trim();
    const status = this.status();
    const amountToPayFrom = this.amountToPayFrom();
    const amountToPayTo = this.amountToPayTo();

    if (supplierId?.length) {
      const labels = this.supplierOptions()
        .filter((opt) => supplierId.includes(opt.value))
        .map((opt) => opt.label)
        .join(', ');
      items.push({ label: this.i18n.tUi('measurements.fields.supplier'), value: labels });
    }
    if (workName) {
      items.push({ label: this.i18n.tUi('measurements.fields.work'), value: workName });
    }
    if (description) {
      items.push({ label: this.i18n.tUi('measurements.fields.description'), value: description });
    }
    if (status?.length) {
      const labels = this.statusOptions()
        .filter((opt) => status.includes(opt.value))
        .map((opt) => opt.label)
        .join(', ');
      items.push({ label: this.i18n.tUi('measurements.fields.status'), value: labels });
    }
    const amountLabel = currencyRangeLabel(this.i18n, amountToPayFrom, amountToPayTo);
    if (amountLabel) {
      items.push({ label: this.i18n.tUi('measurements.fields.amountToPay'), value: amountLabel });
    }
    const dueDateLabel = this.formatActiveFilterPeriodDateValue(
      this.periodDueDate(),
      this.dueDate(),
      this.i18n,
    );
    if (dueDateLabel) {
      items.push({ label: this.i18n.tUi('measurements.fields.dueDate'), value: dueDateLabel });
    }

    return items;
  });

  ngOnInit() {
    // Defesa extra além do (onStateSave) do template - ver StatefulListPage.
    // stripSelectionFromPersistedTableState: cobre um state já corrompido de antes desta
    // proteção existir (não deveria acontecer em produção, já que esta tela nunca teve seleção
    // antes, mas é uma limpeza barata e sem efeito colateral se não houver nada a limpar).
    this.stripSelectionFromPersistedTableState();
    this.suppliersFacade.loadSupplierOptions();
    this.initStatefulList();
  }

  tone(status: string): ReturnType<typeof measurementStatusTone> {
    return measurementStatusTone(status);
  }

  isPending(row: MeasurementWithContextModel): boolean {
    return row.status === MeasurementStatusEnum.PENDING;
  }

  canDecide(row: MeasurementWithContextModel): boolean {
    return this.isPending(row) && this.policy.canDecide();
  }

  decideDisabledReason(row: MeasurementWithContextModel): string {
    if (!this.isPending(row)) {
      return 'measurements.action.alreadyDecided';
    }
    return this.policy.decideDisabledReason() ?? 'measurements.action.noPermission';
  }

  /** row.canApprove já cobre PENDING + permissão + nenhuma Medição mais antiga da mesma Frente
   *  ainda pendente (ver MeasurementService.canApprove) - Reprovar continua usando canDecide, sem
   *  essa restrição extra. */
  canApprove(row: MeasurementWithContextModel): boolean {
    return row.canApprove;
  }

  approveDisabledReason(row: MeasurementWithContextModel): string {
    if (!this.isPending(row)) {
      return 'measurements.action.alreadyDecided';
    }
    if (!this.policy.canDecide()) {
      return this.policy.decideDisabledReason() ?? 'measurements.action.noPermission';
    }
    return 'measurements.action.olderPending';
  }

  /** Sequencial por obra com prefixo "MED-" (ex.: MED-0001) - mesmo padrão de InstallmentsListComponent. */
  numberLabel(row: MeasurementWithContextModel): string {
    return formatSequentialNumber('MED', row.number);
  }

  clear() {
    this.selection.set([]);
    this.clearTableAndReload(this.dt);
  }

  /** Só medições que a própria linha já permitiria aprovar individualmente (PENDING + permissão +
   *  nenhuma Medição mais antiga da mesma Frente ainda pendente) - ver canApprove(). Diferente de
   *  AllInstallmentsListComponent.canSelectForSend, a restrição entre itens do lote já vem pronta
   *  do backend por linha (não precisa recalcular contra as outras linhas selecionadas aqui). */
  canSelectForApprove(row: MeasurementWithContextModel): boolean {
    return this.canApprove(row);
  }

  /** Passada pro [rowSelectable] da tabela - mesmo papel de AllInstallmentsListComponent.
   *  rowSelectable ("selecionar tudo" do cabeçalho nunca marca uma linha não-elegível). */
  readonly rowSelectable = (event: { data: MeasurementWithContextModel }): boolean =>
    this.canSelectForApprove(event.data);

  onSelectionChange(selection: MeasurementWithContextModel[]): void {
    this.selection.set(selection);
  }

  /** Aprova todas as medições selecionadas de uma vez (ver MeasurementsGlobalFacade.approveMany) -
   *  best-effort: mesmo que alguma falhe, as demais do lote continuam aprovadas. O toast final
   *  resume sucesso/falha; a tabela (recarregada 1x ao fim) já mostra o status atualizado de cada
   *  uma (Aprovada x continua Pendente), então não repetimos o detalhe de cada erro no toast. */
  confirmApproveSelected(): void {
    const selected = this.selection();
    if (selected.length === 0 || this.approvingBatch()) return;

    this.confirm.confirm({
      header: this.i18n.tUi('measurements.approveManyConfirm.header'),
      message: this.i18n.tUi('measurements.approveManyConfirm.message', { count: selected.length }),
      icon: 'pi pi-question-circle',
      accept: () => {
        this.approvingBatch.set(true);
        this.facade
          .approveMany(
            selected.map((r) => r.id),
            { decisionNote: null },
          )
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (results) => {
              this.approvingBatch.set(false);
              this.selection.set([]);

              const succeeded = results.filter((r) => r.success).length;
              const failed = results.length - succeeded;

              if (failed === 0) {
                this.toast.add({
                  severity: 'success',
                  summary: this.i18n.tUi('common.success'),
                  detail: this.i18n.tUi('measurements.approveManyConfirm.success', { count: succeeded }),
                });
              } else if (succeeded === 0) {
                this.toast.add({
                  severity: 'error',
                  summary: this.i18n.tUi('common.error'),
                  detail: this.i18n.tUi('measurements.approveManyConfirm.allFailed', { count: failed }),
                });
              } else {
                this.toast.add({
                  severity: 'warn',
                  summary: this.i18n.tUi('common.warning'),
                  detail: this.i18n.tUi('measurements.approveManyConfirm.partial', {
                    succeeded,
                    failed,
                  }),
                });
              }
            },
            error: () => {
              this.approvingBatch.set(false);
            },
          });
      },
    });
  }

  confirmApprove(row: MeasurementWithContextModel): void {
    if (!this.canApprove(row)) return;

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

  confirmReject(row: MeasurementWithContextModel): void {
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

  /** row.canDelete já cobre "sem Ordem viva gerada, sem outra Medição reenviando esta" + permissão
   *  MEDICAO_DELETE (ver MeasurementService.canDelete) - mesmo padrão de canDecide, não recalcular
   *  no cliente. */
  canDelete(row: MeasurementWithContextModel): boolean {
    return row.canDelete;
  }

  deleteDisabledReason(row: MeasurementWithContextModel): string {
    if (row.generatedPaymentOrderId) {
      return 'measurements.action.hasLivePaymentOrder';
    }
    return this.policy.deleteDisabledReason() ?? 'measurements.action.noPermission';
  }

  confirmDelete(row: MeasurementWithContextModel): void {
    if (!this.canDelete(row)) return;

    this.confirm.confirm({
      header: this.i18n.tUi('measurements.deleteConfirm.header'),
      message: this.i18n.tUi('measurements.deleteConfirm.message', { number: this.numberLabel(row) }),
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
                detail: this.i18n.tUi('measurements.deleteConfirm.success'),
              }),
            error: (err) =>
              this.toast.add({
                severity: 'error',
                summary: this.i18n.tUi('common.error'),
                detail:
                  translateWorksErrorDetail(err, this.i18n) ??
                  this.i18n.tUi('measurements.deleteConfirm.error'),
              }),
          });
      },
    });
  }

  protected formatDate(value: Date | string): string {
    const date = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat(this.i18n.getLang(), { dateStyle: 'short' }).format(date);
  }

  protected override tableStateKey(): string {
    return STATE_KEY.NIMBUSFLOW.WORKS.ALL_MEASUREMENTS.TABLE.STATE.V1;
  }

  protected override tableRowsKey(): string {
    return STATE_KEY.NIMBUSFLOW.WORKS.ALL_MEASUREMENTS.TABLE.ROWS.V1;
  }

  protected override filtersKey(): string {
    return STATE_KEY.NIMBUSFLOW.WORKS.ALL_MEASUREMENTS.FILTERS.V1;
  }

  protected override refresh(): void {
    this.selection.set([]);
    this.reloadWithCurrentState();
  }

  /** Mesmo padrão de AllInstallmentsListComponent/WorksListComponent (status pré-selecionado):
   *  "Pendente" pré-selecionado, mas só quando o painel de filtros está vazio de verdade (nem
   *  restaurado do localStorage, nem definido pelo usuário) - ver
   *  applyDefaultAdvancedFiltersIfEmpty em StatefulListPage. */
  private defaultStatus(): string[] {
    return [MeasurementStatusEnum.PENDING];
  }

  protected override applyDefaultAdvancedFilters(): void {
    this.status.set(this.defaultStatus());
  }

  protected override resetFilters(): void {
    this.supplierId.set(null);
    this.workName.set('');
    this.description.set('');
    this.status.set(null);
    this.amountToPayFrom.set(null);
    this.amountToPayTo.set(null);
    this.dueDate.set(null);
    this.periodDueDate.set(null);
    this.applyDefaultAdvancedFiltersIfEmpty();
  }

  protected override toFiltersState(): MeasurementsFiltersState {
    return {
      supplierId: this.supplierId()?.length ? this.supplierId() : null,
      workName: this.workName(),
      description: this.description(),
      status: this.status()?.length ? this.status() : null,
      amountToPayFrom: this.amountToPayFrom(),
      amountToPayTo: this.amountToPayTo(),
      dueDate: this.dueDate(),
      periodDueDate: this.periodDueDate(),
    };
  }

  protected override applyFiltersState(state: MeasurementsFiltersState): void {
    this.supplierId.set(state.supplierId ?? null);
    this.workName.set(state.workName ?? '');
    this.description.set(state.description ?? '');
    this.status.set(state.status ?? null);
    this.amountToPayFrom.set(state.amountToPayFrom ?? null);
    this.amountToPayTo.set(state.amountToPayTo ?? null);
    this.dueDate.set(state.dueDate ?? null);
    this.periodDueDate.set(state.periodDueDate ?? null);
    this.applyDefaultAdvancedFiltersIfEmpty();
  }

  protected override buildAdvancedFilters(): Partial<MeasurementsAdvancedFilters> {
    return {
      supplierId: this.supplierId()?.length ? this.supplierId() : undefined,
      workName: this.workName().trim() || undefined,
      description: this.description().trim() || undefined,
      status: this.status()?.length ? this.status() : undefined,
      amountToPayFrom: this.amountToPayFrom() ?? undefined,
      amountToPayTo: this.amountToPayTo() ?? undefined,
      dueDate: this.dueDate() ?? undefined,
      periodDueDate: this.periodDueDate() ?? undefined,
    };
  }

  protected override mapTableFiltersToActiveItems(filters: any): ActiveFilterItem[] {
    this.i18n.getAppliedLang();

    const items: ActiveFilterItem[] = [];

    const workName = readSingleFilterValue(filters, 'workName');
    if (workName) {
      items.push({ label: this.i18n.tUi('measurements.fields.work'), value: workName });
    }

    const description = readSingleFilterValue(filters, 'description');
    if (description) {
      items.push({ label: this.i18n.tUi('measurements.fields.description'), value: description });
    }

    const statusValues = readArrayFilterValues(filters, 'status');
    if (statusValues.length) {
      const labels = this.statusOptions()
        .filter((option) => statusValues.includes(option.value))
        .map((option) => option.label);
      items.push({
        label: this.i18n.tUi('measurements.fields.status'),
        value: (labels.length ? labels : statusValues).join(', '),
      });
    }

    const dueDate = readDateRangeFilterValue(filters, 'dueDate', this.formatDate.bind(this));
    if (dueDate) {
      items.push({ label: this.i18n.tUi('measurements.fields.dueDate'), value: dueDate });
    }

    return items;
  }

  protected override loadPage(
    query: ReturnType<typeof buildListQuery<MeasurementsAdvancedFilters>>,
  ): void {
    this.facade.loadPage(query);
  }

  protected override loadFirstPage(): void {}
}

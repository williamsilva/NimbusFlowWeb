import { FormsModule } from '@angular/forms';
import { DestroyRef, Component, ViewChild, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Table } from 'primeng/table';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { FloatLabel } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { TranslateModule } from '@ngx-translate/core';
import { MultiSelectModule } from 'primeng/multiselect';
import { ConfirmationService, MessageService } from 'primeng/api';

import { I18nService } from '@core/i18n/i18n.service';
import { CsDatePipe } from '@shared/pipes/cs-date.pipe';
import { STATE_KEY } from '@features/state-key.constants';
import { CsCurrencyPipe } from '@shared/pipes/cs-currency.pipe';
import { ManutencaoModel, ManutencoesFiltersState } from '@models/manutencoes.models';
import { ManutencoesFacade } from '@features/facade/manutencoes.facade';
import { ManutencoesAdvancedFilters } from '@features/filter/manutencoes.filters';
import { statusManutencaoTone, STATUS_MANUTENCAO_VALUES, TIPO_MANUTENCAO_VALUES } from '@models/patrimonio-enums';
import { StatefulListPage } from '@williamsilva/nimbus-web-commons';
import { buildListQuery } from '@williamsilva/nimbus-web-commons';
import { PeriodEnum, allPeriodEnum, periodEnumLabel } from '@models/enums/period.enum';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { DateInputMaskDirective } from '@williamsilva/nimbus-web-commons';
import { StatusBadgeComponent, StatusTone } from '@shared/features/status-badge/status-badge.component';
import { PatrimonioPermissionPolicy } from '@features/patrimonio/patrimonio-permission.policy';
import { ManutencaoFormDialogComponent } from '@features/patrimonio/manutencoes/manutencao-form-dialog.component';
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

@Component({
  standalone: true,
  selector: 'app-manutencoes-list',
  templateUrl: './manutencoes-list.component.html',
  imports: [
    FloatLabel,
    FormsModule,
    CsDatePipe,
    TableModule,
    ButtonModule,
    CsCurrencyPipe,
    TooltipModule,
    InputTextModule,
    TranslateModule,
    DatePickerModule,
    MultiSelectModule,
    PageHeaderComponent,
    FiltersPanelComponent,
    StatusBadgeComponent,
    DateInputMaskDirective,
    ManutencaoFormDialogComponent,
    CsCurrencyRangeFilterComponent,
    CsAdvancedPeriodDateFilterComponent,
  ],
})
export class ManutencoesListComponent extends StatefulListPage<
  ManutencoesFiltersState,
  ManutencoesAdvancedFilters
> {
  @ViewChild('dt') private dt?: Table;

  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(MessageService);
  private readonly confirm = inject(ConfirmationService);

  protected override readonly i18n = inject(I18nService);
  readonly facade = inject(ManutencoesFacade);
  readonly policy = inject(PatrimonioPermissionPolicy);

  override rows =
    Number(localStorage.getItem(this.tableRowsKey())) || StatefulListPage.DEFAULT_ROWS;

  equipamento = signal('');
  autorizadaNome = signal('');
  status = signal<string[] | null>(null);
  tipoManutencao = signal<string[] | null>(null);
  precoDe = signal<number | null>(null);
  precoAte = signal<number | null>(null);
  dataEnvio = signal<string | string[] | null>(null);
  periodDataEnvio = signal<PeriodEnum | null>(null);

  readonly periodEnumOptions = computed(() => {
    this.i18n.getAppliedLang();
    return allPeriodEnum().map((value) => ({ label: periodEnumLabel(value, this.i18n), value }));
  });

  readonly statusOptions = STATUS_MANUTENCAO_VALUES.map((value) => ({
    value,
    label: this.i18n.tUi(`manutencoes.status.${value}` as never),
  }));

  readonly tipoOptions = TIPO_MANUTENCAO_VALUES.map((value) => ({
    value,
    label: this.i18n.tUi(`manutencoes.tipo.${value}` as never),
  }));

  readonly formVisible = signal(false);
  readonly editing = signal<ManutencaoModel | null>(null);

  readonly canManage = computed(() => this.policy.canManageManutencoes());
  readonly totalRecords = computed(() => this.facade.totalRecords());
  readonly items = computed<ManutencaoModel[]>(() => this.facade.items());

  protected override readonly advancedActiveFilters = computed<ActiveFilterItem[]>(() => {
    const items: ActiveFilterItem[] = [];

    const equipamento = this.equipamento().trim();
    const autorizadaNome = this.autorizadaNome().trim();
    const status = this.status();
    const tipoManutencao = this.tipoManutencao();
    const precoDe = this.precoDe();
    const precoAte = this.precoAte();

    if (equipamento) {
      items.push({ label: this.i18n.tUi('manutencoes.fields.equipamento'), value: equipamento });
    }
    if (autorizadaNome) {
      items.push({
        label: this.i18n.tUi('manutencoes.fields.autorizadaNome'),
        value: autorizadaNome,
      });
    }
    if (status?.length) {
      const labels = this.statusOptions
        .filter((opt) => status.includes(opt.value))
        .map((opt) => opt.label)
        .join(', ');
      items.push({ label: this.i18n.tUi('manutencoes.fields.status'), value: labels });
    }
    if (tipoManutencao?.length) {
      const labels = this.tipoOptions
        .filter((opt) => tipoManutencao.includes(opt.value))
        .map((opt) => opt.label)
        .join(', ');
      items.push({ label: this.i18n.tUi('manutencoes.fields.tipoManutencao'), value: labels });
    }
    const dataEnvioLabel = this.formatActiveFilterPeriodDateValue(
      this.periodDataEnvio(),
      this.dataEnvio(),
      this.i18n,
    );
    if (dataEnvioLabel) {
      items.push({ label: this.i18n.tUi('manutencoes.fields.dataEnvio'), value: dataEnvioLabel });
    }
    const precoLabel = currencyRangeLabel(this.i18n, precoDe, precoAte);
    if (precoLabel) {
      items.push({ label: this.i18n.tUi('manutencoes.fields.preco'), value: precoLabel });
    }

    return items;
  });

  ngOnInit() {
    this.initStatefulList();
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

  clear() {
    this.clearTableAndReload(this.dt);
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

  protected formatDate(value: Date | string): string {
    const date = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat(this.i18n.getLang(), { dateStyle: 'short' }).format(date);
  }

  protected override tableStateKey(): string {
    return STATE_KEY.NIMBUSFLOW.PATRIMONIO.MANUTENCOES.TABLE.STATE.V1;
  }

  protected override tableRowsKey(): string {
    return STATE_KEY.NIMBUSFLOW.PATRIMONIO.MANUTENCOES.TABLE.ROWS.V1;
  }

  protected override filtersKey(): string {
    return STATE_KEY.NIMBUSFLOW.PATRIMONIO.MANUTENCOES.FILTERS.V1;
  }

  protected override refresh(): void {
    this.reloadWithCurrentState();
  }

  protected override resetFilters(): void {
    this.equipamento.set('');
    this.autorizadaNome.set('');
    this.status.set(null);
    this.tipoManutencao.set(null);
    this.precoDe.set(null);
    this.precoAte.set(null);
    this.dataEnvio.set(null);
    this.periodDataEnvio.set(null);
    this.applyDefaultAdvancedFiltersIfEmpty();
  }

  protected override toFiltersState(): ManutencoesFiltersState {
    return {
      equipamento: this.equipamento(),
      autorizadaNome: this.autorizadaNome(),
      status: this.status()?.length ? this.status() : null,
      tipoManutencao: this.tipoManutencao()?.length ? this.tipoManutencao() : null,
      precoDe: this.precoDe(),
      precoAte: this.precoAte(),
      dataEnvio: this.dataEnvio(),
      periodDataEnvio: this.periodDataEnvio(),
    };
  }

  protected override applyFiltersState(state: ManutencoesFiltersState): void {
    this.equipamento.set(state.equipamento ?? '');
    this.autorizadaNome.set(state.autorizadaNome ?? '');
    this.status.set(state.status ?? null);
    this.tipoManutencao.set(state.tipoManutencao ?? null);
    this.precoDe.set(state.precoDe ?? null);
    this.precoAte.set(state.precoAte ?? null);
    this.dataEnvio.set(state.dataEnvio ?? null);
    this.periodDataEnvio.set(state.periodDataEnvio ?? null);

    this.applyDefaultAdvancedFiltersIfEmpty();
  }

  protected override buildAdvancedFilters(): Partial<ManutencoesAdvancedFilters> {
    return {
      equipamento: this.equipamento().trim() || undefined,
      autorizadaNome: this.autorizadaNome().trim() || undefined,
      status: this.status()?.length ? this.status() : undefined,
      tipoManutencao: this.tipoManutencao()?.length ? this.tipoManutencao() : undefined,
      precoDe: this.precoDe() ?? undefined,
      precoAte: this.precoAte() ?? undefined,
      dataEnvio: this.dataEnvio() ?? undefined,
      periodDataEnvio: this.periodDataEnvio() ?? undefined,
    };
  }

  protected override mapTableFiltersToActiveItems(filters: any): ActiveFilterItem[] {
    this.i18n.getAppliedLang();

    const items: ActiveFilterItem[] = [];

    const equipamento = readSingleFilterValue(filters, 'equipamento');
    if (equipamento) {
      items.push({ label: this.i18n.tUi('manutencoes.fields.equipamento'), value: equipamento });
    }

    const autorizadaNome = readSingleFilterValue(filters, 'autorizadaNome');
    if (autorizadaNome) {
      items.push({ label: this.i18n.tUi('manutencoes.fields.autorizadaNome'), value: autorizadaNome });
    }

    const statusValues = readArrayFilterValues(filters, 'status');
    if (statusValues.length) {
      const labels = this.statusOptions
        .filter((option) => statusValues.includes(option.value))
        .map((option) => option.label);
      items.push({
        label: this.i18n.tUi('manutencoes.fields.status'),
        value: (labels.length ? labels : statusValues).join(', '),
      });
    }

    const tipoValues = readArrayFilterValues(filters, 'tipoManutencao');
    if (tipoValues.length) {
      const labels = this.tipoOptions
        .filter((option) => tipoValues.includes(option.value))
        .map((option) => option.label);
      items.push({
        label: this.i18n.tUi('manutencoes.fields.tipoManutencao'),
        value: (labels.length ? labels : tipoValues).join(', '),
      });
    }

    const dataEnvio = readDateRangeFilterValue(filters, 'dataEnvio', this.formatDate.bind(this));
    if (dataEnvio) {
      items.push({ label: this.i18n.tUi('manutencoes.fields.dataEnvio'), value: dataEnvio });
    }

    const precoRange = filters?.['preco']?.value ?? filters?.['preco']?.[0]?.value;
    if (Array.isArray(precoRange) && (precoRange[0] != null || precoRange[1] != null)) {
      const label = currencyRangeLabel(this.i18n, precoRange[0], precoRange[1]);
      if (label) {
        items.push({ label: this.i18n.tUi('manutencoes.fields.preco'), value: label });
      }
    }

    return items;
  }

  protected override loadPage(
    query: ReturnType<typeof buildListQuery<ManutencoesAdvancedFilters>>,
  ): void {
    this.facade.loadPage(query);
  }

  protected override loadFirstPage(): void {}
}

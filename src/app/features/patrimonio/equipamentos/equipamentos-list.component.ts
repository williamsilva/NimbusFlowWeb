import { FormsModule } from '@angular/forms';
import { Component, ViewChild, computed, inject, signal } from '@angular/core';

import { Table } from 'primeng/table';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { FloatLabel } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { TranslateModule } from '@ngx-translate/core';
import { MultiSelectModule } from 'primeng/multiselect';

import { I18nService } from '@core/i18n/i18n.service';
import { CsDatePipe } from '@shared/pipes/cs-date.pipe';
import { STATE_KEY } from '@features/state-key.constants';
import { CsCurrencyPipe } from '@shared/pipes/cs-currency.pipe';
import { EquipamentosFacade } from '@features/facade/equipamentos.facade';
import { statusEquipamentoTone, STATUS_EQUIPAMENTO_VALUES } from '@models/patrimonio-enums';
import { EquipamentosAdvancedFilters } from '@features/filter/equipamentos.filters';
import { StatefulListPage } from '@williamsilva/nimbus-web-commons';
import { buildListQuery } from '@williamsilva/nimbus-web-commons';
import { PeriodEnum, allPeriodEnum, periodEnumLabel } from '@models/enums/period.enum';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { DateInputMaskDirective } from '@williamsilva/nimbus-web-commons';
import { EquipamentoModel, EquipamentosFiltersState } from '@models/equipamentos.models';
import { StatusBadgeComponent, StatusTone } from '@shared/features/status-badge/status-badge.component';
import { PatrimonioPermissionPolicy } from '@features/patrimonio/patrimonio-permission.policy';
import { EquipamentoFormDialogComponent } from '@features/patrimonio/equipamentos/equipamento-form-dialog.component';
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
  selector: 'app-equipamentos-list',
  templateUrl: './equipamentos-list.component.html',
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
    EquipamentoFormDialogComponent,
    CsCurrencyRangeFilterComponent,
    CsAdvancedPeriodDateFilterComponent,
  ],
})
export class EquipamentosListComponent extends StatefulListPage<
  EquipamentosFiltersState,
  EquipamentosAdvancedFilters
> {
  @ViewChild('dt') private dt?: Table;

  protected override readonly i18n = inject(I18nService);
  readonly facade = inject(EquipamentosFacade);
  readonly policy = inject(PatrimonioPermissionPolicy);

  override rows =
    Number(localStorage.getItem(this.tableRowsKey())) || StatefulListPage.DEFAULT_ROWS;

  descricao = signal('');
  fornecedorNome = signal('');
  status = signal<string[] | null>(null);
  precoDe = signal<number | null>(null);
  precoAte = signal<number | null>(null);
  dataCompra = signal<string | string[] | null>(null);
  periodDataCompra = signal<PeriodEnum | null>(null);

  readonly periodEnumOptions = computed(() => {
    this.i18n.getAppliedLang();
    return allPeriodEnum().map((value) => ({ label: periodEnumLabel(value, this.i18n), value }));
  });

  readonly statusOptions = STATUS_EQUIPAMENTO_VALUES.map((value) => ({
    value,
    label: this.i18n.tUi(`equipamentos.status.${value}` as never),
  }));

  readonly formVisible = signal(false);
  readonly editing = signal<EquipamentoModel | null>(null);

  readonly canManage = computed(() => this.policy.canManageEquipamentos());
  readonly totalRecords = computed(() => this.facade.totalRecords());
  readonly items = computed<EquipamentoModel[]>(() => this.facade.items());

  protected override readonly advancedActiveFilters = computed<ActiveFilterItem[]>(() => {
    const items: ActiveFilterItem[] = [];

    const descricao = this.descricao().trim();
    const fornecedorNome = this.fornecedorNome().trim();
    const status = this.status();
    const precoDe = this.precoDe();
    const precoAte = this.precoAte();

    if (descricao) {
      items.push({ label: this.i18n.tUi('equipamentos.fields.descricao'), value: descricao });
    }
    if (fornecedorNome) {
      items.push({
        label: this.i18n.tUi('equipamentos.fields.fornecedorNome'),
        value: fornecedorNome,
      });
    }
    if (status?.length) {
      const labels = this.statusOptions
        .filter((opt) => status.includes(opt.value))
        .map((opt) => opt.label)
        .join(', ');
      items.push({ label: this.i18n.tUi('equipamentos.fields.status'), value: labels });
    }
    const dataCompraLabel = this.formatActiveFilterPeriodDateValue(
      this.periodDataCompra(),
      this.dataCompra(),
      this.i18n,
    );
    if (dataCompraLabel) {
      items.push({ label: this.i18n.tUi('equipamentos.fields.dataCompra'), value: dataCompraLabel });
    }
    const precoLabel = currencyRangeLabel(this.i18n, precoDe, precoAte);
    if (precoLabel) {
      items.push({ label: this.i18n.tUi('equipamentos.fields.preco'), value: precoLabel });
    }

    return items;
  });

  ngOnInit() {
    this.initStatefulList();
  }

  statusTone(status: string): StatusTone {
    return statusEquipamentoTone(status);
  }

  goNew(): void {
    if (!this.canManage()) return;
    this.editing.set(null);
    this.formVisible.set(true);
  }

  goEdit(row: EquipamentoModel): void {
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

  protected formatDate(value: Date | string): string {
    const date = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat(this.i18n.getLang(), { dateStyle: 'short' }).format(date);
  }

  protected override tableStateKey(): string {
    return STATE_KEY.NIMBUSFLOW.PATRIMONIO.EQUIPAMENTOS.TABLE.STATE.V1;
  }

  protected override tableRowsKey(): string {
    return STATE_KEY.NIMBUSFLOW.PATRIMONIO.EQUIPAMENTOS.TABLE.ROWS.V1;
  }

  protected override filtersKey(): string {
    return STATE_KEY.NIMBUSFLOW.PATRIMONIO.EQUIPAMENTOS.FILTERS.V1;
  }

  protected override refresh(): void {
    this.reloadWithCurrentState();
  }

  protected override resetFilters(): void {
    this.descricao.set('');
    this.fornecedorNome.set('');
    this.status.set(null);
    this.precoDe.set(null);
    this.precoAte.set(null);
    this.dataCompra.set(null);
    this.periodDataCompra.set(null);
    this.applyDefaultAdvancedFiltersIfEmpty();
  }

  protected override toFiltersState(): EquipamentosFiltersState {
    return {
      descricao: this.descricao(),
      fornecedorNome: this.fornecedorNome(),
      status: this.status()?.length ? this.status() : null,
      precoDe: this.precoDe(),
      precoAte: this.precoAte(),
      dataCompra: this.dataCompra(),
      periodDataCompra: this.periodDataCompra(),
    };
  }

  protected override applyFiltersState(state: EquipamentosFiltersState): void {
    this.descricao.set(state.descricao ?? '');
    this.fornecedorNome.set(state.fornecedorNome ?? '');
    this.status.set(state.status ?? null);
    this.precoDe.set(state.precoDe ?? null);
    this.precoAte.set(state.precoAte ?? null);
    this.dataCompra.set(state.dataCompra ?? null);
    this.periodDataCompra.set(state.periodDataCompra ?? null);

    this.applyDefaultAdvancedFiltersIfEmpty();
  }

  protected override buildAdvancedFilters(): Partial<EquipamentosAdvancedFilters> {
    return {
      descricao: this.descricao().trim() || undefined,
      fornecedorNome: this.fornecedorNome().trim() || undefined,
      status: this.status()?.length ? this.status() : undefined,
      precoDe: this.precoDe() ?? undefined,
      precoAte: this.precoAte() ?? undefined,
      dataCompra: this.dataCompra() ?? undefined,
      periodDataCompra: this.periodDataCompra() ?? undefined,
    };
  }

  protected override mapTableFiltersToActiveItems(filters: any): ActiveFilterItem[] {
    this.i18n.getAppliedLang();

    const items: ActiveFilterItem[] = [];

    const descricao = readSingleFilterValue(filters, 'descricao');
    if (descricao) {
      items.push({ label: this.i18n.tUi('equipamentos.fields.descricao'), value: descricao });
    }

    const fornecedorNome = readSingleFilterValue(filters, 'fornecedorNome');
    if (fornecedorNome) {
      items.push({ label: this.i18n.tUi('equipamentos.fields.fornecedorNome'), value: fornecedorNome });
    }

    const statusValues = readArrayFilterValues(filters, 'status');
    if (statusValues.length) {
      const labels = this.statusOptions
        .filter((option) => statusValues.includes(option.value))
        .map((option) => option.label);
      items.push({
        label: this.i18n.tUi('equipamentos.fields.status'),
        value: (labels.length ? labels : statusValues).join(', '),
      });
    }

    const dataCompra = readDateRangeFilterValue(filters, 'dataCompra', this.formatDate.bind(this));
    if (dataCompra) {
      items.push({ label: this.i18n.tUi('equipamentos.fields.dataCompra'), value: dataCompra });
    }

    const precoRange = filters?.['preco']?.value ?? filters?.['preco']?.[0]?.value;
    if (Array.isArray(precoRange) && (precoRange[0] != null || precoRange[1] != null)) {
      const label = currencyRangeLabel(this.i18n, precoRange[0], precoRange[1]);
      if (label) {
        items.push({ label: this.i18n.tUi('equipamentos.fields.preco'), value: label });
      }
    }

    return items;
  }

  protected override loadPage(
    query: ReturnType<typeof buildListQuery<EquipamentosAdvancedFilters>>,
  ): void {
    this.facade.loadPage(query);
  }

  protected override loadFirstPage(): void {}
}

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
import {
  HistoricoLocalizacaoModel,
  HistoricoLocalizacaoFiltersState,
} from '@models/historico-localizacao.models';
import { HistoricoLocalizacaoFacade } from '@features/facade/historico-localizacao.facade';
import { HistoricoLocalizacaoAdvancedFilters } from '@features/filter/historico-localizacao.filters';
import {
  statusHistoricoLocalizacaoTone,
  STATUS_HISTORICO_LOCALIZACAO_VALUES,
} from '@models/patrimonio-enums';
import { StatefulListPage } from '@features/list-base/stateful-list-page';
import { buildListQuery } from '@shared/features/list-query/list-query.builder';
import { PeriodEnum, allPeriodEnum, periodEnumLabel } from '@models/enums/period.enum';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { DateInputMaskDirective } from '@shared/directives/date-input-mask.directive';
import { StatusBadgeComponent, StatusTone } from '@shared/features/status-badge/status-badge.component';
import { PatrimonioPermissionPolicy } from '@features/patrimonio/patrimonio-permission.policy';
import { HistoricoLocalizacaoFormDialogComponent } from '@features/patrimonio/historico-localizacao/historico-localizacao-form-dialog.component';
import { CsAdvancedPeriodDateFilterComponent } from '@features/list-base/cs-advanced-period-date-filter.component';
import {
  ActiveFilterItem,
  FiltersPanelComponent,
} from '@shared/features/filters-panel/filters-panel.component';
import {
  readSingleFilterValue,
  readArrayFilterValues,
  readDateRangeFilterValue,
} from '@features/list-base/table-filter-readers';

@Component({
  standalone: true,
  selector: 'app-historico-localizacao-list',
  templateUrl: './historico-localizacao-list.component.html',
  imports: [
    FloatLabel,
    FormsModule,
    CsDatePipe,
    TableModule,
    ButtonModule,
    TooltipModule,
    InputTextModule,
    TranslateModule,
    DatePickerModule,
    MultiSelectModule,
    PageHeaderComponent,
    FiltersPanelComponent,
    StatusBadgeComponent,
    DateInputMaskDirective,
    HistoricoLocalizacaoFormDialogComponent,
    CsAdvancedPeriodDateFilterComponent,
  ],
})
export class HistoricoLocalizacaoListComponent extends StatefulListPage<
  HistoricoLocalizacaoFiltersState,
  HistoricoLocalizacaoAdvancedFilters
> {
  @ViewChild('dt') private dt?: Table;

  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(MessageService);
  private readonly confirm = inject(ConfirmationService);

  protected override readonly i18n = inject(I18nService);
  readonly facade = inject(HistoricoLocalizacaoFacade);
  readonly policy = inject(PatrimonioPermissionPolicy);

  override rows =
    Number(localStorage.getItem(this.tableRowsKey())) || StatefulListPage.DEFAULT_ROWS;

  equipamento = signal('');
  localizacao = signal('');
  status = signal<string[] | null>(null);
  dataInicial = signal<string | string[] | null>(null);
  periodDataInicial = signal<PeriodEnum | null>(null);

  readonly periodEnumOptions = computed(() => {
    this.i18n.getAppliedLang();
    return allPeriodEnum().map((value) => ({ label: periodEnumLabel(value, this.i18n), value }));
  });

  readonly statusOptions = STATUS_HISTORICO_LOCALIZACAO_VALUES.map((value) => ({
    value,
    label: this.i18n.tUi(`historicoLocalizacao.status.${value}` as never),
  }));

  readonly formVisible = signal(false);
  readonly editing = signal<HistoricoLocalizacaoModel | null>(null);

  readonly canManage = computed(() => this.policy.canManageHistoricoLocalizacao());
  readonly totalRecords = computed(() => this.facade.totalRecords());
  readonly items = computed<HistoricoLocalizacaoModel[]>(() => this.facade.items());

  protected override readonly advancedActiveFilters = computed<ActiveFilterItem[]>(() => {
    const items: ActiveFilterItem[] = [];

    const equipamento = this.equipamento().trim();
    const localizacao = this.localizacao().trim();
    const status = this.status();

    if (equipamento) {
      items.push({ label: this.i18n.tUi('historicoLocalizacao.fields.equipamento'), value: equipamento });
    }
    if (localizacao) {
      items.push({ label: this.i18n.tUi('historicoLocalizacao.fields.localizacao'), value: localizacao });
    }
    if (status?.length) {
      const labels = this.statusOptions
        .filter((opt) => status.includes(opt.value))
        .map((opt) => opt.label)
        .join(', ');
      items.push({ label: this.i18n.tUi('historicoLocalizacao.fields.status'), value: labels });
    }
    const dataInicialLabel = this.formatActiveFilterPeriodDateValue(
      this.periodDataInicial(),
      this.dataInicial(),
      this.i18n,
    );
    if (dataInicialLabel) {
      items.push({
        label: this.i18n.tUi('historicoLocalizacao.fields.dataInicial'),
        value: dataInicialLabel,
      });
    }

    return items;
  });

  ngOnInit() {
    this.initStatefulList();
  }

  statusTone(status: string): StatusTone {
    return statusHistoricoLocalizacaoTone(status);
  }

  isSystem(row: HistoricoLocalizacaoModel): boolean {
    return row.geracao === 'SISTEMA';
  }

  goNew(): void {
    if (!this.canManage()) return;
    this.editing.set(null);
    this.formVisible.set(true);
  }

  goEdit(row: HistoricoLocalizacaoModel): void {
    if (!this.canManage() || this.isSystem(row)) return;
    this.editing.set(row);
    this.formVisible.set(true);
  }

  onFormVisibleChange(v: boolean): void {
    this.formVisible.set(v);
  }

  clear() {
    this.clearTableAndReload(this.dt);
  }

  confirmDelete(row: HistoricoLocalizacaoModel): void {
    if (!this.canManage() || this.isSystem(row)) return;

    this.confirm.confirm({
      header: this.i18n.tUi('historicoLocalizacao.deleteConfirm.header' as never),
      message: this.i18n.tUi('historicoLocalizacao.deleteConfirm.message' as never),
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
                detail: this.i18n.tUi('historicoLocalizacao.deleteConfirm.success' as never),
              }),
            error: (err) =>
              this.toast.add({
                severity: 'error',
                summary: this.i18n.tUi('common.error'),
                detail:
                  err?.error?.message ?? this.i18n.tUi('historicoLocalizacao.deleteConfirm.error' as never),
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
    return STATE_KEY.NIMBUSFLOW.PATRIMONIO.HISTORICO_LOCALIZACAO.TABLE.STATE.V1;
  }

  protected override tableRowsKey(): string {
    return STATE_KEY.NIMBUSFLOW.PATRIMONIO.HISTORICO_LOCALIZACAO.TABLE.ROWS.V1;
  }

  protected override filtersKey(): string {
    return STATE_KEY.NIMBUSFLOW.PATRIMONIO.HISTORICO_LOCALIZACAO.FILTERS.V1;
  }

  protected override refresh(): void {
    this.reloadWithCurrentState();
  }

  protected override resetFilters(): void {
    this.equipamento.set('');
    this.localizacao.set('');
    this.status.set(null);
    this.dataInicial.set(null);
    this.periodDataInicial.set(null);
    this.applyDefaultAdvancedFiltersIfEmpty();
  }

  protected override toFiltersState(): HistoricoLocalizacaoFiltersState {
    return {
      equipamento: this.equipamento(),
      localizacao: this.localizacao(),
      status: this.status()?.length ? this.status() : null,
      dataInicial: this.dataInicial(),
      periodDataInicial: this.periodDataInicial(),
    };
  }

  protected override applyFiltersState(state: HistoricoLocalizacaoFiltersState): void {
    this.equipamento.set(state.equipamento ?? '');
    this.localizacao.set(state.localizacao ?? '');
    this.status.set(state.status ?? null);
    this.dataInicial.set(state.dataInicial ?? null);
    this.periodDataInicial.set(state.periodDataInicial ?? null);

    this.applyDefaultAdvancedFiltersIfEmpty();
  }

  protected override buildAdvancedFilters(): Partial<HistoricoLocalizacaoAdvancedFilters> {
    return {
      equipamento: this.equipamento().trim() || undefined,
      localizacao: this.localizacao().trim() || undefined,
      status: this.status()?.length ? this.status() : undefined,
      dataInicial: this.dataInicial() ?? undefined,
      periodDataInicial: this.periodDataInicial() ?? undefined,
    };
  }

  protected override mapTableFiltersToActiveItems(filters: any): ActiveFilterItem[] {
    this.i18n.getAppliedLang();

    const items: ActiveFilterItem[] = [];

    const equipamento = readSingleFilterValue(filters, 'equipamento');
    if (equipamento) {
      items.push({ label: this.i18n.tUi('historicoLocalizacao.fields.equipamento'), value: equipamento });
    }

    const localizacao = readSingleFilterValue(filters, 'localizacao');
    if (localizacao) {
      items.push({ label: this.i18n.tUi('historicoLocalizacao.fields.localizacao'), value: localizacao });
    }

    const statusValues = readArrayFilterValues(filters, 'status');
    if (statusValues.length) {
      const labels = this.statusOptions
        .filter((option) => statusValues.includes(option.value))
        .map((option) => option.label);
      items.push({
        label: this.i18n.tUi('historicoLocalizacao.fields.status'),
        value: (labels.length ? labels : statusValues).join(', '),
      });
    }

    const dataInicial = readDateRangeFilterValue(filters, 'dataInicial', this.formatDate.bind(this));
    if (dataInicial) {
      items.push({ label: this.i18n.tUi('historicoLocalizacao.fields.dataInicial'), value: dataInicial });
    }

    return items;
  }

  protected override loadPage(
    query: ReturnType<typeof buildListQuery<HistoricoLocalizacaoAdvancedFilters>>,
  ): void {
    this.facade.loadPage(query);
  }

  protected override loadFirstPage(): void {}
}

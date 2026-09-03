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
import { AgendaManutencaoModel, AgendaManutencaoFiltersState } from '@models/agenda-manutencao.models';
import { AgendaManutencaoFacade } from '@features/facade/agenda-manutencao.facade';
import { AgendaManutencaoAdvancedFilters } from '@features/filter/agenda-manutencao.filters';
import {
  statusAgendaManutencaoTone,
  STATUS_AGENDA_MANUTENCAO_VALUES,
  FREQUENCIA_MANUTENCAO_VALUES,
  TIPO_MANUTENCAO_VALUES,
  PERFIL_NOTIFICACAO_VALUES,
} from '@models/patrimonio-enums';
import { StatefulListPage } from '@williamsilva/nimbus-web-commons';
import { buildListQuery } from '@williamsilva/nimbus-web-commons';
import { PeriodEnum, allPeriodEnum, periodEnumLabel } from '@models/enums/period.enum';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { DateInputMaskDirective } from '@williamsilva/nimbus-web-commons';
import { StatusBadgeComponent, StatusTone } from '@shared/features/status-badge/status-badge.component';
import { PatrimonioPermissionPolicy } from '@features/patrimonio/patrimonio-permission.policy';
import { AgendaManutencaoFormDialogComponent } from '@features/patrimonio/agenda-manutencao/agenda-manutencao-form-dialog.component';
import { CsAdvancedPeriodDateFilterComponent } from '@williamsilva/nimbus-web-commons';
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
  selector: 'app-agenda-manutencao-list',
  templateUrl: './agenda-manutencao-list.component.html',
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
    AgendaManutencaoFormDialogComponent,
    CsAdvancedPeriodDateFilterComponent,
  ],
})
export class AgendaManutencaoListComponent extends StatefulListPage<
  AgendaManutencaoFiltersState,
  AgendaManutencaoAdvancedFilters
> {
  @ViewChild('dt') private dt?: Table;

  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(MessageService);
  private readonly confirm = inject(ConfirmationService);

  protected override readonly i18n = inject(I18nService);
  readonly facade = inject(AgendaManutencaoFacade);
  readonly policy = inject(PatrimonioPermissionPolicy);

  override rows =
    Number(localStorage.getItem(this.tableRowsKey())) || StatefulListPage.DEFAULT_ROWS;

  equipamento = signal('');
  status = signal<string[] | null>(null);
  frequencia = signal<string[] | null>(null);
  tipoManutencao = signal<string[] | null>(null);
  perfilNotificacao = signal<string[] | null>(null);
  proximaManutencao = signal<string | string[] | null>(null);
  periodProximaManutencao = signal<PeriodEnum | null>(null);

  readonly periodEnumOptions = computed(() => {
    this.i18n.getAppliedLang();
    return allPeriodEnum().map((value) => ({ label: periodEnumLabel(value, this.i18n), value }));
  });

  readonly statusOptions = STATUS_AGENDA_MANUTENCAO_VALUES.map((value) => ({
    value,
    label: this.i18n.tUi(`agendaManutencao.status.${value}` as never),
  }));

  readonly frequenciaOptions = FREQUENCIA_MANUTENCAO_VALUES.map((value) => ({
    value,
    label: this.i18n.tUi(`agendaManutencao.frequencia.${value}` as never),
  }));

  readonly tipoOptions = TIPO_MANUTENCAO_VALUES.map((value) => ({
    value,
    label: this.i18n.tUi(`manutencoes.tipo.${value}` as never),
  }));

  readonly perfilOptions = PERFIL_NOTIFICACAO_VALUES.map((value) => ({
    value,
    label: this.i18n.tUi(`agendaManutencao.perfil.${value}` as never),
  }));

  readonly formVisible = signal(false);
  readonly editing = signal<AgendaManutencaoModel | null>(null);

  readonly canManage = computed(() => this.policy.canManageAgendaManutencao());
  readonly totalRecords = computed(() => this.facade.totalRecords());
  readonly items = computed<AgendaManutencaoModel[]>(() => this.facade.items());

  protected override readonly advancedActiveFilters = computed<ActiveFilterItem[]>(() => {
    const items: ActiveFilterItem[] = [];

    const equipamento = this.equipamento().trim();
    const status = this.status();
    const frequencia = this.frequencia();
    const tipoManutencao = this.tipoManutencao();
    const perfilNotificacao = this.perfilNotificacao();

    if (equipamento) {
      items.push({ label: this.i18n.tUi('agendaManutencao.fields.equipamento'), value: equipamento });
    }
    if (status?.length) {
      const labels = this.statusOptions
        .filter((opt) => status.includes(opt.value))
        .map((opt) => opt.label)
        .join(', ');
      items.push({ label: this.i18n.tUi('agendaManutencao.fields.status'), value: labels });
    }
    if (frequencia?.length) {
      const labels = this.frequenciaOptions
        .filter((opt) => frequencia.includes(opt.value))
        .map((opt) => opt.label)
        .join(', ');
      items.push({ label: this.i18n.tUi('agendaManutencao.fields.frequencia'), value: labels });
    }
    if (tipoManutencao?.length) {
      const labels = this.tipoOptions
        .filter((opt) => tipoManutencao.includes(opt.value))
        .map((opt) => opt.label)
        .join(', ');
      items.push({ label: this.i18n.tUi('agendaManutencao.fields.tipoManutencao'), value: labels });
    }
    if (perfilNotificacao?.length) {
      const labels = this.perfilOptions
        .filter((opt) => perfilNotificacao.includes(opt.value))
        .map((opt) => opt.label)
        .join(', ');
      items.push({ label: this.i18n.tUi('agendaManutencao.fields.perfilNotificacao'), value: labels });
    }
    const proximaManutencaoLabel = this.formatActiveFilterPeriodDateValue(
      this.periodProximaManutencao(),
      this.proximaManutencao(),
      this.i18n,
    );
    if (proximaManutencaoLabel) {
      items.push({
        label: this.i18n.tUi('agendaManutencao.fields.proximaManutencao'),
        value: proximaManutencaoLabel,
      });
    }

    return items;
  });

  ngOnInit() {
    this.initStatefulList();
  }

  statusTone(status: string): StatusTone {
    return statusAgendaManutencaoTone(status);
  }

  goNew(): void {
    if (!this.canManage()) return;
    this.editing.set(null);
    this.formVisible.set(true);
  }

  goEdit(row: AgendaManutencaoModel): void {
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

  confirmDelete(row: AgendaManutencaoModel): void {
    if (!this.canManage()) return;

    this.confirm.confirm({
      header: this.i18n.tUi('agendaManutencao.deleteConfirm.header' as never),
      message: this.i18n.tUi('agendaManutencao.deleteConfirm.message' as never),
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
                detail: this.i18n.tUi('agendaManutencao.deleteConfirm.success' as never),
              }),
            error: () =>
              this.toast.add({
                severity: 'error',
                summary: this.i18n.tUi('common.error'),
                detail: this.i18n.tUi('agendaManutencao.deleteConfirm.error' as never),
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
    return STATE_KEY.NIMBUSFLOW.PATRIMONIO.AGENDA_MANUTENCAO.TABLE.STATE.V1;
  }

  protected override tableRowsKey(): string {
    return STATE_KEY.NIMBUSFLOW.PATRIMONIO.AGENDA_MANUTENCAO.TABLE.ROWS.V1;
  }

  protected override filtersKey(): string {
    return STATE_KEY.NIMBUSFLOW.PATRIMONIO.AGENDA_MANUTENCAO.FILTERS.V1;
  }

  protected override refresh(): void {
    this.reloadWithCurrentState();
  }

  protected override resetFilters(): void {
    this.equipamento.set('');
    this.status.set(null);
    this.frequencia.set(null);
    this.tipoManutencao.set(null);
    this.perfilNotificacao.set(null);
    this.proximaManutencao.set(null);
    this.periodProximaManutencao.set(null);
    this.applyDefaultAdvancedFiltersIfEmpty();
  }

  protected override toFiltersState(): AgendaManutencaoFiltersState {
    return {
      equipamento: this.equipamento(),
      status: this.status()?.length ? this.status() : null,
      frequencia: this.frequencia()?.length ? this.frequencia() : null,
      tipoManutencao: this.tipoManutencao()?.length ? this.tipoManutencao() : null,
      perfilNotificacao: this.perfilNotificacao()?.length ? this.perfilNotificacao() : null,
      proximaManutencao: this.proximaManutencao(),
      periodProximaManutencao: this.periodProximaManutencao(),
    };
  }

  protected override applyFiltersState(state: AgendaManutencaoFiltersState): void {
    this.equipamento.set(state.equipamento ?? '');
    this.status.set(state.status ?? null);
    this.frequencia.set(state.frequencia ?? null);
    this.tipoManutencao.set(state.tipoManutencao ?? null);
    this.perfilNotificacao.set(state.perfilNotificacao ?? null);
    this.proximaManutencao.set(state.proximaManutencao ?? null);
    this.periodProximaManutencao.set(state.periodProximaManutencao ?? null);

    this.applyDefaultAdvancedFiltersIfEmpty();
  }

  protected override buildAdvancedFilters(): Partial<AgendaManutencaoAdvancedFilters> {
    return {
      equipamento: this.equipamento().trim() || undefined,
      status: this.status()?.length ? this.status() : undefined,
      frequencia: this.frequencia()?.length ? this.frequencia() : undefined,
      tipoManutencao: this.tipoManutencao()?.length ? this.tipoManutencao() : undefined,
      perfilNotificacao: this.perfilNotificacao()?.length ? this.perfilNotificacao() : undefined,
      proximaManutencao: this.proximaManutencao() ?? undefined,
      periodProximaManutencao: this.periodProximaManutencao() ?? undefined,
    };
  }

  protected override mapTableFiltersToActiveItems(filters: any): ActiveFilterItem[] {
    this.i18n.getAppliedLang();

    const items: ActiveFilterItem[] = [];

    const equipamento = readSingleFilterValue(filters, 'equipamento');
    if (equipamento) {
      items.push({ label: this.i18n.tUi('agendaManutencao.fields.equipamento'), value: equipamento });
    }

    const statusValues = readArrayFilterValues(filters, 'status');
    if (statusValues.length) {
      const labels = this.statusOptions
        .filter((option) => statusValues.includes(option.value))
        .map((option) => option.label);
      items.push({
        label: this.i18n.tUi('agendaManutencao.fields.status'),
        value: (labels.length ? labels : statusValues).join(', '),
      });
    }

    const frequenciaValues = readArrayFilterValues(filters, 'frequencia');
    if (frequenciaValues.length) {
      const labels = this.frequenciaOptions
        .filter((option) => frequenciaValues.includes(option.value))
        .map((option) => option.label);
      items.push({
        label: this.i18n.tUi('agendaManutencao.fields.frequencia'),
        value: (labels.length ? labels : frequenciaValues).join(', '),
      });
    }

    const tipoValues = readArrayFilterValues(filters, 'tipoManutencao');
    if (tipoValues.length) {
      const labels = this.tipoOptions
        .filter((option) => tipoValues.includes(option.value))
        .map((option) => option.label);
      items.push({
        label: this.i18n.tUi('agendaManutencao.fields.tipoManutencao'),
        value: (labels.length ? labels : tipoValues).join(', '),
      });
    }

    const perfilValues = readArrayFilterValues(filters, 'perfilNotificacao');
    if (perfilValues.length) {
      const labels = this.perfilOptions
        .filter((option) => perfilValues.includes(option.value))
        .map((option) => option.label);
      items.push({
        label: this.i18n.tUi('agendaManutencao.fields.perfilNotificacao'),
        value: (labels.length ? labels : perfilValues).join(', '),
      });
    }

    const proximaManutencao = readDateRangeFilterValue(
      filters,
      'proximaManutencao',
      this.formatDate.bind(this),
    );
    if (proximaManutencao) {
      items.push({
        label: this.i18n.tUi('agendaManutencao.fields.proximaManutencao'),
        value: proximaManutencao,
      });
    }

    return items;
  }

  protected override loadPage(
    query: ReturnType<typeof buildListQuery<AgendaManutencaoAdvancedFilters>>,
  ): void {
    this.facade.loadPage(query);
  }

  protected override loadFirstPage(): void {}
}

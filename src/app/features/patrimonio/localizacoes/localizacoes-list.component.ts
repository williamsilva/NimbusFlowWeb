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
import { LocalizacaoModel, LocalizacoesFiltersState } from '@models/localizacoes.models';
import { LocalizacoesFacade } from '@features/facade/localizacoes.facade';
import { LocalizacoesAdvancedFilters } from '@features/filter/localizacoes.filters';
import { statusLocalizacaoTone, STATUS_LOCALIZACAO_VALUES } from '@models/patrimonio-enums';
import { StatefulListPage } from '@williamsilva/nimbus-web-commons';
import { buildListQuery } from '@williamsilva/nimbus-web-commons';
import { PeriodEnum, allPeriodEnum, periodEnumLabel } from '@models/enums/period.enum';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { DateInputMaskDirective } from '@williamsilva/nimbus-web-commons';
import { StatusBadgeComponent, StatusTone } from '@shared/features/status-badge/status-badge.component';
import { PatrimonioPermissionPolicy } from '@features/patrimonio/patrimonio-permission.policy';
import { LocalizacaoFormDialogComponent } from '@features/patrimonio/localizacoes/localizacao-form-dialog.component';
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
  selector: 'app-localizacoes-list',
  templateUrl: './localizacoes-list.component.html',
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
    LocalizacaoFormDialogComponent,
    CsAdvancedPeriodDateFilterComponent,
  ],
})
export class LocalizacoesListComponent extends StatefulListPage<
  LocalizacoesFiltersState,
  LocalizacoesAdvancedFilters
> {
  @ViewChild('dt') private dt?: Table;

  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(MessageService);
  private readonly confirm = inject(ConfirmationService);

  protected override readonly i18n = inject(I18nService);
  readonly facade = inject(LocalizacoesFacade);
  readonly policy = inject(PatrimonioPermissionPolicy);

  override rows =
    Number(localStorage.getItem(this.tableRowsKey())) || StatefulListPage.DEFAULT_ROWS;

  descricao = signal('');
  status = signal<string[] | null>(null);
  createdAt = signal<string | string[] | null>(null);
  periodCreatedAt = signal<PeriodEnum | null>(null);

  readonly periodEnumOptions = computed(() => {
    this.i18n.getAppliedLang();
    return allPeriodEnum().map((value) => ({ label: periodEnumLabel(value, this.i18n), value }));
  });

  readonly statusOptions = STATUS_LOCALIZACAO_VALUES.map((value) => ({
    value,
    label: this.i18n.tUi(`localizacoes.status.${value}` as never),
  }));

  readonly formVisible = signal(false);
  readonly editing = signal<LocalizacaoModel | null>(null);

  readonly canManage = computed(() => this.policy.canManageLocalizacoes());
  readonly totalRecords = computed(() => this.facade.totalRecords());
  readonly items = computed<LocalizacaoModel[]>(() => this.facade.items());

  protected override readonly advancedActiveFilters = computed<ActiveFilterItem[]>(() => {
    const items: ActiveFilterItem[] = [];

    const descricao = this.descricao().trim();
    const status = this.status();

    if (descricao) {
      items.push({ label: this.i18n.tUi('localizacoes.fields.descricao'), value: descricao });
    }
    if (status?.length) {
      const labels = this.statusOptions
        .filter((opt) => status.includes(opt.value))
        .map((opt) => opt.label)
        .join(', ');
      items.push({ label: this.i18n.tUi('localizacoes.fields.status'), value: labels });
    }
    const createdAtLabel = this.formatActiveFilterPeriodDateValue(
      this.periodCreatedAt(),
      this.createdAt(),
      this.i18n,
    );
    if (createdAtLabel) {
      items.push({ label: this.i18n.tUi('localizacoes.fields.createdAt'), value: createdAtLabel });
    }

    return items;
  });

  ngOnInit() {
    this.initStatefulList();
  }

  statusTone(status: string): StatusTone {
    return statusLocalizacaoTone(status);
  }

  isSystem(row: LocalizacaoModel): boolean {
    return row.geracao === 'SISTEMA';
  }

  goNew(): void {
    if (!this.canManage()) return;
    this.editing.set(null);
    this.formVisible.set(true);
  }

  goEdit(row: LocalizacaoModel): void {
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

  confirmDelete(row: LocalizacaoModel): void {
    if (!this.canManage() || this.isSystem(row)) return;

    this.confirm.confirm({
      header: this.i18n.tUi('localizacoes.deleteConfirm.header' as never),
      message: this.i18n.tUi('localizacoes.deleteConfirm.message' as never),
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
                detail: this.i18n.tUi('localizacoes.deleteConfirm.success' as never),
              }),
            error: (err) =>
              this.toast.add({
                severity: 'error',
                summary: this.i18n.tUi('common.error'),
                detail: err?.error?.message ?? this.i18n.tUi('localizacoes.deleteConfirm.error' as never),
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
    return STATE_KEY.NIMBUSFLOW.PATRIMONIO.LOCALIZACOES.TABLE.STATE.V1;
  }

  protected override tableRowsKey(): string {
    return STATE_KEY.NIMBUSFLOW.PATRIMONIO.LOCALIZACOES.TABLE.ROWS.V1;
  }

  protected override filtersKey(): string {
    return STATE_KEY.NIMBUSFLOW.PATRIMONIO.LOCALIZACOES.FILTERS.V1;
  }

  protected override refresh(): void {
    this.reloadWithCurrentState();
  }

  protected override resetFilters(): void {
    this.descricao.set('');
    this.status.set(null);
    this.createdAt.set(null);
    this.periodCreatedAt.set(null);
    this.applyDefaultAdvancedFiltersIfEmpty();
  }

  protected override toFiltersState(): LocalizacoesFiltersState {
    return {
      descricao: this.descricao(),
      status: this.status()?.length ? this.status() : null,
      createdAt: this.createdAt(),
      periodCreatedAt: this.periodCreatedAt(),
    };
  }

  protected override applyFiltersState(state: LocalizacoesFiltersState): void {
    this.descricao.set(state.descricao ?? '');
    this.status.set(state.status ?? null);
    this.createdAt.set(state.createdAt ?? null);
    this.periodCreatedAt.set(state.periodCreatedAt ?? null);

    this.applyDefaultAdvancedFiltersIfEmpty();
  }

  protected override buildAdvancedFilters(): Partial<LocalizacoesAdvancedFilters> {
    return {
      descricao: this.descricao().trim() || undefined,
      status: this.status()?.length ? this.status() : undefined,
      createdAt: this.createdAt() ?? undefined,
      periodCreatedAt: this.periodCreatedAt() ?? undefined,
    };
  }

  protected override mapTableFiltersToActiveItems(filters: any): ActiveFilterItem[] {
    this.i18n.getAppliedLang();

    const items: ActiveFilterItem[] = [];

    const descricao = readSingleFilterValue(filters, 'descricao');
    if (descricao) {
      items.push({ label: this.i18n.tUi('localizacoes.fields.descricao'), value: descricao });
    }

    const statusValues = readArrayFilterValues(filters, 'status');
    if (statusValues.length) {
      const labels = this.statusOptions
        .filter((option) => statusValues.includes(option.value))
        .map((option) => option.label);
      items.push({
        label: this.i18n.tUi('localizacoes.fields.status'),
        value: (labels.length ? labels : statusValues).join(', '),
      });
    }

    const createdAt = readDateRangeFilterValue(filters, 'createdAt', this.formatDate.bind(this));
    if (createdAt) {
      items.push({ label: this.i18n.tUi('localizacoes.fields.createdAt'), value: createdAt });
    }

    return items;
  }

  protected override loadPage(
    query: ReturnType<typeof buildListQuery<LocalizacoesAdvancedFilters>>,
  ): void {
    this.facade.loadPage(query);
  }

  protected override loadFirstPage(): void {}
}

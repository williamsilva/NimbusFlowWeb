
import { FormsModule } from '@angular/forms';

import { Component, ViewChild, computed, inject, signal } from '@angular/core';

import { Table } from 'primeng/table';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { FloatLabel } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { TranslateModule } from '@ngx-translate/core';
import { MultiSelectModule } from 'primeng/multiselect';
import { MessageService } from 'primeng/api';

import { I18nService } from '@core/i18n/i18n.service';
import { CsDatePipe } from '@shared/pipes/cs-date.pipe';
import { DateInputMaskDirective } from '@williamsilva/nimbus-web-commons';
import { STATE_KEY } from '@features/state-key.constants';
import { StatefulListPage } from '@williamsilva/nimbus-web-commons';
import { SuggestionsFacade } from '@features/facade/suggestions.facade';
import { buildListQuery } from '@williamsilva/nimbus-web-commons';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { SuggestionsAdvancedFilters } from '@features/filter/suggestions.filters';
import { SuggestionsPermissionPolicy } from '@features/suggestions/suggestions-permission.policy';
import { StatusBadgeComponent } from '@shared/features/status-badge/status-badge.component';
import {
  SUGGESTION_STATUS_VALUES,
  suggestionStatusTone,
} from '@models/enums/suggestion-status.enum';
import { SuggestionModel, SuggestionsFiltersState } from '@models/suggestions.models';
import { SuggestionsCreateDialogComponent } from '@features/suggestions/suggestions-create/suggestions-create-dialog.component';
import { PeriodEnum, allPeriodEnum, periodEnumLabel } from '@models/enums/period.enum';
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
  selector: 'app-suggestions-list',
  templateUrl: './suggestions-list.component.html',
  styleUrl: './suggestions-list.component.scss',
  imports: [
    CsDatePipe,
    FloatLabel,
    FormsModule,
    SelectModule,
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
    SuggestionsCreateDialogComponent,
    CsAdvancedPeriodDateFilterComponent,
    DateInputMaskDirective,
  ],
})
export class SuggestionsListComponent extends StatefulListPage<
  SuggestionsFiltersState,
  SuggestionsAdvancedFilters
> {
  @ViewChild('dt') private dt?: Table;

  protected override readonly i18n = inject(I18nService);
  readonly facade = inject(SuggestionsFacade);
  protected readonly toast = inject(MessageService);
  protected readonly policy = inject(SuggestionsPermissionPolicy);

  override rows =
    Number(localStorage.getItem(this.tableRowsKey())) || StatefulListPage.DEFAULT_ROWS;

  description = signal('');
  status = signal<string[] | null>(null);
  createdAt = signal<string | string[] | null>(null);
  periodCreatedAt = signal<PeriodEnum | null>(null);

  newVisible = signal(false);

  readonly statusOptions = SUGGESTION_STATUS_VALUES.map((value) => ({
    value,
    label: this.i18n.tUi(`suggestions.status.${value}` as never),
  }));

  readonly periodEnumOptions = computed(() => {
    this.i18n.getAppliedLang();
    return allPeriodEnum().map((value) => ({ label: periodEnumLabel(value, this.i18n), value }));
  });

  readonly canCreate = computed(() => this.policy.canCreate());
  readonly canManageStatus = computed(() => this.policy.canManageStatus());
  readonly totalRecords = computed(() => this.facade.totalRecords());
  readonly suggestions = computed<SuggestionModel[]>(() => this.facade.suggestions());

  protected override readonly advancedActiveFilters = computed<ActiveFilterItem[]>(() => {
    const items: ActiveFilterItem[] = [];

    const description = this.description().trim();
    const status = this.status();

    if (description) {
      items.push({ label: this.i18n.tUi('suggestions.fields.description'), value: description });
    }
    if (status?.length) {
      const labels = this.statusOptions
        .filter((opt) => status.includes(opt.value))
        .map((opt) => opt.label)
        .join(', ');
      items.push({ label: this.i18n.tUi('suggestions.fields.status'), value: labels });
    }
    const createdAtLabel = this.formatActiveFilterPeriodDateValue(
      this.periodCreatedAt(),
      this.createdAt(),
      this.i18n,
    );
    if (createdAtLabel) {
      items.push({ label: this.i18n.tUi('suggestions.fields.createdAt'), value: createdAtLabel });
    }

    return items;
  });

  ngOnInit() {
    this.initStatefulList();
  }

  tone(status: string): ReturnType<typeof suggestionStatusTone> {
    return suggestionStatusTone(status);
  }

  goNew() {
    this.newVisible.set(true);
  }

  onCreated(): void {
    this.refresh();
  }

  onNewVisibleChange(v: boolean) {
    this.newVisible.set(v);
  }

  onStatusChange(row: SuggestionModel, status: string): void {
    if (!this.canManageStatus() || row.status === (status as SuggestionModel['status'])) return;

    this.facade.updateStatus(row.id, status as SuggestionModel['status']).subscribe({
      next: () => {
        this.toast.add({
          severity: 'success',
          summary: this.i18n.tUi('common.success'),
          detail: this.i18n.tUi('suggestions.status.updated' as never),
        });
      },
      error: () => {
        this.toast.add({
          severity: 'error',
          summary: this.i18n.tUi('common.error'),
          detail: this.i18n.tUi('suggestions.status.updateError' as never),
        });
      },
    });
  }

  clear() {
    this.clearTableAndReload(this.dt);
  }

  protected formatDate(value: Date | string): string {
    const date = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat(this.i18n.getLang(), { dateStyle: 'short' }).format(date);
  }

  protected override tableStateKey(): string {
    return STATE_KEY.NIMBUSFLOW.WORKS.SUGGESTIONS.TABLE.STATE.V1;
  }

  protected override tableRowsKey(): string {
    return STATE_KEY.NIMBUSFLOW.WORKS.SUGGESTIONS.TABLE.ROWS.V1;
  }

  protected override filtersKey(): string {
    return STATE_KEY.NIMBUSFLOW.WORKS.SUGGESTIONS.FILTERS.V1;
  }

  protected override refresh(): void {
    this.reloadWithCurrentState();
  }

  protected override resetFilters(): void {
    this.description.set('');
    this.status.set(null);
    this.createdAt.set(null);
    this.periodCreatedAt.set(null);
  }

  protected override toFiltersState(): SuggestionsFiltersState {
    return {
      description: this.description(),
      status: this.status()?.length ? this.status() : null,
      createdAt: this.createdAt(),
      periodCreatedAt: this.periodCreatedAt(),
    };
  }

  protected override applyFiltersState(state: SuggestionsFiltersState): void {
    this.description.set(state.description ?? '');
    this.status.set(state.status ?? null);
    this.createdAt.set(state.createdAt ?? null);
    this.periodCreatedAt.set(state.periodCreatedAt ?? null);
  }

  protected override buildAdvancedFilters(): Partial<SuggestionsAdvancedFilters> {
    return {
      description: this.description().trim() || undefined,
      status: this.status()?.length ? this.status() : undefined,
      createdAt: this.createdAt() ?? undefined,
      periodCreatedAt: this.periodCreatedAt() ?? undefined,
    };
  }

  protected override mapTableFiltersToActiveItems(filters: any): ActiveFilterItem[] {
    this.i18n.getAppliedLang();

    const items: ActiveFilterItem[] = [];

    const description = readSingleFilterValue(filters, 'description');
    if (description) {
      items.push({ label: this.i18n.tUi('suggestions.fields.description'), value: description });
    }

    const statusValues = readArrayFilterValues(filters, 'status');
    if (statusValues.length) {
      const labels = this.statusOptions
        .filter((option) => statusValues.includes(option.value))
        .map((option) => option.label);
      items.push({
        label: this.i18n.tUi('suggestions.fields.status'),
        value: (labels.length ? labels : statusValues).join(', '),
      });
    }

    const createdAt = readDateRangeFilterValue(filters, 'createdAt', this.formatDate.bind(this));
    if (createdAt) {
      items.push({ label: this.i18n.tUi('suggestions.fields.createdAt'), value: createdAt });
    }

    return items;
  }

  protected override loadPage(
    query: ReturnType<typeof buildListQuery<SuggestionsAdvancedFilters>>,
  ): void {
    this.facade.loadPage(query);
  }

  protected override loadFirstPage(): void {}
}

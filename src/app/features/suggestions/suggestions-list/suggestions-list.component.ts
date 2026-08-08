import { NgIf } from '@angular/common';
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
import { STATE_KEY } from '@features/state-key.constants';
import { StatefulListPage } from '@features/list-base/stateful-list-page';
import { SuggestionsFacade } from '@features/facade/suggestions.facade';
import { buildListQuery } from '@shared/features/list-query/list-query.builder';
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
  selector: 'app-suggestions-list',
  templateUrl: './suggestions-list.component.html',
  imports: [
    NgIf,
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
  createdAtRange = signal<Date[] | null>(null);

  newVisible = signal(false);

  readonly statusOptions = SUGGESTION_STATUS_VALUES.map((value) => ({
    value,
    label: this.i18n.tUi(`suggestions.status.${value}` as never),
  }));

  readonly canCreate = computed(() => this.policy.canCreate());
  readonly canManageStatus = computed(() => this.policy.canManageStatus());
  readonly totalRecords = computed(() => this.facade.totalRecords());
  readonly suggestions = computed<SuggestionModel[]>(() => this.facade.suggestions());

  protected override readonly advancedActiveFilters = computed<ActiveFilterItem[]>(() => {
    const items: ActiveFilterItem[] = [];

    const description = this.description().trim();
    const status = this.status();
    const createdAtRange = this.createdAtRange();

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
    if (createdAtRange?.[0] && createdAtRange?.[1]) {
      items.push({
        label: this.i18n.tUi('suggestions.fields.createdAt'),
        value: `${this.formatDate(createdAtRange[0])} – ${this.formatDate(createdAtRange[1])}`,
      });
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
    return STATE_KEY.NIMBUSFLOW_SECURITY.WORKS.SUGGESTIONS.TABLE.STATE.V1;
  }

  protected override tableRowsKey(): string {
    return STATE_KEY.NIMBUSFLOW_SECURITY.WORKS.SUGGESTIONS.TABLE.ROWS.V1;
  }

  protected override filtersKey(): string {
    return STATE_KEY.NIMBUSFLOW_SECURITY.WORKS.SUGGESTIONS.FILTERS.V1;
  }

  protected override refresh(): void {
    this.reloadWithCurrentState();
  }

  protected override resetFilters(): void {
    this.description.set('');
    this.status.set(null);
    this.createdAtRange.set(null);
  }

  protected override toFiltersState(): SuggestionsFiltersState {
    const createdAtRange = this.createdAtRange();

    return {
      description: this.description(),
      status: this.status()?.length ? this.status() : null,
      createdAtRange:
        createdAtRange?.[0] && createdAtRange?.[1]
          ? [createdAtRange[0].toISOString(), createdAtRange[1].toISOString()]
          : null,
    };
  }

  protected override applyFiltersState(state: SuggestionsFiltersState): void {
    this.description.set(state.description ?? '');
    this.status.set(state.status ?? null);
    this.createdAtRange.set(
      state.createdAtRange?.[0] && state.createdAtRange?.[1]
        ? [new Date(state.createdAtRange[0]), new Date(state.createdAtRange[1])]
        : null,
    );
  }

  protected override buildAdvancedFilters(): Partial<SuggestionsAdvancedFilters> {
    const createdAtRange = this.createdAtRange();
    const [createdAtFrom, createdAtTo] =
      createdAtRange?.[0] && createdAtRange?.[1]
        ? [createdAtRange[0].toISOString(), createdAtRange[1].toISOString()]
        : [undefined, undefined];

    return {
      description: this.description().trim() || undefined,
      status: this.status()?.length ? this.status() : undefined,
      createdAtFrom,
      createdAtTo,
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

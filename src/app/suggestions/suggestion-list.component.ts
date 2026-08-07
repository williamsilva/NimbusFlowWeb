import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DialogService } from 'primeng/dynamicdialog';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';

import { AuthService } from '../core/auth/auth.service';
import { I18nService } from '../core/i18n/i18n.service';
import { ActiveFilterEntry, NbFiltersPanelComponent } from '../shared/filters-panel/nb-filters-panel.component';
import { NbPageHeaderComponent } from '../shared/page-header/nb-page-header.component';
import { NbStatefulListPage } from '../shared/list-base/nb-stateful-list-page';
import { StatusBadgeComponent, StatusTone } from '../shared/status-badge/status-badge.component';
import { Suggestion, SuggestionService, SuggestionStatus } from './suggestion.service';
import { SuggestionFormComponent } from './suggestion-form.component';

const STATUS_TONES: Record<SuggestionStatus, StatusTone> = {
  RECEIVED: 'info',
  IN_ANALYSIS: 'warn',
  IMPLEMENTED: 'success',
  REJECTED: 'danger',
};

interface SuggestionsFilterState {
  search: string;
}

@Component({
  selector: 'app-suggestion-list',
  imports: [
    FormsModule,
    ButtonModule,
    FloatLabelModule,
    InputTextModule,
    SelectModule,
    TableModule,
    TooltipModule,
    NbFiltersPanelComponent,
    NbPageHeaderComponent,
    StatusBadgeComponent,
    TranslatePipe,
  ],
  templateUrl: './suggestion-list.component.html',
  styleUrl: './suggestion-list.component.scss',
})
export class SuggestionListComponent extends NbStatefulListPage<SuggestionsFilterState> implements OnInit {
  private readonly suggestionService = inject(SuggestionService);
  private readonly authService = inject(AuthService);
  private readonly dialogService = inject(DialogService);
  private readonly i18n = inject(I18nService);

  private readonly suggestions = signal<Suggestion[]>([]);
  statusOptions: SuggestionStatus[] = ['RECEIVED', 'IN_ANALYSIS', 'IMPLEMENTED', 'REJECTED'];
  permissions: string[] = [];

  ngOnInit(): void {
    this.initStatefulList();
    this.authService.loadMe().subscribe((user) => (this.permissions = user.permissions));
  }

  protected override refresh(): void {
    this.load();
  }

  protected override tableRowsKey(): string {
    return 'nimbusflow.suggestions.table.rows.v1';
  }

  protected override filtersKey(): string {
    return 'nimbusflow.suggestions.filters.v1';
  }

  protected override emptyFilter(): SuggestionsFilterState {
    return { search: '' };
  }

  protected override buildActiveFilters(f: SuggestionsFilterState): ActiveFilterEntry[] {
    const entries: ActiveFilterEntry[] = [];
    if (f.search) entries.push({ label: this.i18n.tUi('suggestions.list.searchPlaceholder'), value: f.search });
    return entries;
  }

  readonly filteredSuggestions = computed(() => {
    const term = this.appliedFilter().search.trim().toLowerCase();
    if (!term) return this.suggestions();
    return this.suggestions().filter((suggestion) => suggestion.description.toLowerCase().includes(term));
  });

  get statusSelectOptions(): { label: string; value: SuggestionStatus }[] {
    return this.statusOptions.map((status) => ({ label: this.i18n.tUi(this.statusLabelKey(status)), value: status }));
  }

  load(): void {
    this.suggestionService.list().subscribe((suggestions) => this.suggestions.set(suggestions));
  }

  openCreate(): void {
    const ref = this.dialogService.open<SuggestionFormComponent, void>(SuggestionFormComponent, {
      header: this.i18n.tUi('suggestions.form.createTitle'),
      width: '560px',
      modal: true,
    });

    ref?.onClose.subscribe((saved) => {
      if (saved) {
        this.load();
      }
    });
  }

  statusLabelKey(status: SuggestionStatus): string {
    return `suggestions.status.${status}`;
  }

  statusTone(status: SuggestionStatus): StatusTone {
    return STATUS_TONES[status];
  }

  /** Só é UX (esconder o seletor) - a validação de verdade é sempre revalidada no backend. */
  canManage(): boolean {
    return this.permissions.includes('SUGESTAO_MANAGE');
  }

  changeStatus(suggestion: Suggestion, status: SuggestionStatus): void {
    this.suggestionService.updateStatus(suggestion.id, { status }).subscribe(() => this.load());
  }
}

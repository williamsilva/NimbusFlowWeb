import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DialogService } from 'primeng/dynamicdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';

import { AuthService } from '../core/auth/auth.service';
import { I18nService } from '../core/i18n/i18n.service';
import { StatusBadgeComponent, StatusTone } from '../shared/status-badge/status-badge.component';
import { Suggestion, SuggestionService, SuggestionStatus } from './suggestion.service';
import { SuggestionFormComponent } from './suggestion-form.component';

const STATUS_TONES: Record<SuggestionStatus, StatusTone> = {
  RECEIVED: 'info',
  IN_ANALYSIS: 'warn',
  IMPLEMENTED: 'success',
  REJECTED: 'danger',
};

@Component({
    selector: 'app-suggestion-list',
    imports: [
        FormsModule,
        ButtonModule,
        IconFieldModule,
        InputIconModule,
        InputTextModule,
        SelectModule,
        TableModule,
        TooltipModule,
        StatusBadgeComponent,
        TranslatePipe,
    ],
    templateUrl: './suggestion-list.component.html',
    styleUrl: './suggestion-list.component.scss'
})
export class SuggestionListComponent implements OnInit {
  suggestions: Suggestion[] = [];
  search = '';
  statusOptions: SuggestionStatus[] = ['RECEIVED', 'IN_ANALYSIS', 'IMPLEMENTED', 'REJECTED'];
  permissions: string[] = [];

  constructor(
    private readonly suggestionService: SuggestionService,
    private readonly authService: AuthService,
    private readonly dialogService: DialogService,
    private readonly i18n: I18nService,
  ) {}

  ngOnInit(): void {
    this.load();
    this.authService.loadMe().subscribe((user) => (this.permissions = user.permissions));
  }

  get filteredSuggestions(): Suggestion[] {
    const term = this.search.trim().toLowerCase();
    if (!term) {
      return this.suggestions;
    }
    return this.suggestions.filter((suggestion) => suggestion.description.toLowerCase().includes(term));
  }

  get statusSelectOptions(): { label: string; value: SuggestionStatus }[] {
    return this.statusOptions.map((status) => ({ label: this.i18n.tUi(this.statusLabelKey(status)), value: status }));
  }

  load(): void {
    this.suggestionService.list().subscribe((suggestions) => (this.suggestions = suggestions));
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

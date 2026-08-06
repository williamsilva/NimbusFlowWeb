import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';

import { AuthService } from '../core/auth/auth.service';
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
        MatButtonModule,
        MatCardModule,
        MatDialogModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatSelectModule,
        MatTableModule,
        MatTooltipModule,
        StatusBadgeComponent,
        TranslatePipe,
    ],
    templateUrl: './suggestion-list.component.html',
    styleUrl: './suggestion-list.component.scss'
})
export class SuggestionListComponent implements OnInit {
  suggestions: Suggestion[] = [];
  search = '';
  displayedColumns = ['description', 'status', 'attachment', 'createdBy'];
  statusOptions: SuggestionStatus[] = ['RECEIVED', 'IN_ANALYSIS', 'IMPLEMENTED', 'REJECTED'];
  permissions: string[] = [];

  constructor(
    private readonly suggestionService: SuggestionService,
    private readonly authService: AuthService,
    private readonly dialog: MatDialog,
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

  load(): void {
    this.suggestionService.list().subscribe((suggestions) => (this.suggestions = suggestions));
  }

  openCreate(): void {
    const ref = this.dialog.open<SuggestionFormComponent, void, boolean>(SuggestionFormComponent, {
      autoFocus: false,
    });

    ref.afterClosed().subscribe((saved) => {
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

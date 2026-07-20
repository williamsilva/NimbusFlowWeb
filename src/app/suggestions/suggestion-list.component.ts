import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';

import { AuthService } from '../core/auth/auth.service';
import { Suggestion, SuggestionService, SuggestionStatus } from './suggestion.service';

@Component({
  selector: 'app-suggestion-list',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatCardModule, MatIconModule, MatSelectModule, MatTableModule],
  templateUrl: './suggestion-list.component.html',
  styleUrl: './suggestion-list.component.scss',
})
export class SuggestionListComponent implements OnInit {
  suggestions: Suggestion[] = [];
  displayedColumns = ['description', 'status', 'attachment', 'createdBy'];
  statusOptions: SuggestionStatus[] = ['RECEIVED', 'IN_ANALYSIS', 'IMPLEMENTED', 'REJECTED'];
  permissions: string[] = [];

  constructor(
    private readonly suggestionService: SuggestionService,
    private readonly authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.load();
    this.authService.loadMe().subscribe((user) => (this.permissions = user.permissions));
  }

  load(): void {
    this.suggestionService.list().subscribe((suggestions) => (this.suggestions = suggestions));
  }

  /** Só é UX (esconder o seletor) - a validação de verdade é sempre revalidada no backend. */
  canManage(): boolean {
    return this.permissions.includes('SUGESTAO_MANAGE');
  }

  changeStatus(suggestion: Suggestion, status: SuggestionStatus): void {
    this.suggestionService.updateStatus(suggestion.id, { status }).subscribe(() => this.load());
  }
}

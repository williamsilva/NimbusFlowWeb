import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';

import { I18nService } from '../core/i18n/i18n.service';
import { SuggestionRequest, SuggestionService } from './suggestion.service';

@Component({
    selector: 'app-suggestion-form',
    imports: [ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, TranslatePipe],
    templateUrl: './suggestion-form.component.html',
    styleUrl: './suggestion-form.component.scss'
})
export class SuggestionFormComponent {
  selectedFile: File | null = null;
  saving = false;
  form;

  constructor(
    private readonly fb: FormBuilder,
    private readonly suggestionService: SuggestionService,
    private readonly dialogRef: MatDialogRef<SuggestionFormComponent>,
    private readonly messageService: MessageService,
    private readonly i18n: I18nService,
  ) {
    this.form = this.fb.group({
      description: ['', Validators.required],
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files && input.files.length > 0 ? input.files[0] : null;
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: this.i18n.tUi('common.warning'),
        detail: this.i18n.tUi('suggestions.form.reviewFields'),
      });
      return;
    }

    const request: SuggestionRequest = { description: this.form.getRawValue().description! };
    this.saving = true;
    this.suggestionService.create(request, this.selectedFile).subscribe({
      next: () => this.dialogRef.close(true),
      error: () => {
        this.saving = false;
        this.messageService.add({
          severity: 'error',
          summary: this.i18n.tUi('common.error'),
          detail: this.i18n.tUi('suggestions.form.saveError'),
        });
      },
    });
  }
}

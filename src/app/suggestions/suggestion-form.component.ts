import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslatePipe } from '@ngx-translate/core';

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
    private readonly snackBar: MatSnackBar,
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
      this.snackBar.open(this.i18n.tUi('suggestions.form.reviewFields'), this.i18n.tUi('common.ok'), { duration: 4000 });
      return;
    }

    const request: SuggestionRequest = { description: this.form.getRawValue().description! };
    this.saving = true;
    this.suggestionService.create(request, this.selectedFile).subscribe({
      next: () => this.dialogRef.close(true),
      error: () => {
        this.saving = false;
        this.snackBar.open(this.i18n.tUi('suggestions.form.saveError'), this.i18n.tUi('common.ok'), { duration: 5000 });
      },
    });
  }
}

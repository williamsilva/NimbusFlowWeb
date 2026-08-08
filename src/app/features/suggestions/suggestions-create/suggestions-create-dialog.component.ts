import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { input, signal, Output, inject, Component, EventEmitter, effect } from '@angular/core';

import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TranslateModule } from '@ngx-translate/core';

import { I18nService } from '@core/i18n/i18n.service';
import { SuggestionsFacade } from '@features/facade/suggestions.facade';
import { ErrorMsgComponent } from '@shared/error-msg/error-msg.component';

@Component({
  standalone: true,
  selector: 'app-suggestions-create-dialog',
  templateUrl: './suggestions-create-dialog.component.html',
  imports: [
    ToastModule,
    DialogModule,
    ButtonModule,
    TextareaModule,
    TranslateModule,
    FloatLabelModule,
    ErrorMsgComponent,
    ReactiveFormsModule,
  ],
})
export class SuggestionsCreateDialogComponent {
  visible = input.required<boolean>();

  @Output() saved = new EventEmitter<void>();
  @Output() created = new EventEmitter<void>();
  @Output() visibleChange = new EventEmitter<boolean>();

  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly i18n = inject(I18nService);
  readonly suggestions = inject(SuggestionsFacade);

  readonly saving = signal(false);
  readonly selectedFile = signal<File | null>(null);

  readonly form = this.fb.nonNullable.group({
    description: ['', [Validators.required, Validators.maxLength(1000)]],
  });

  constructor() {
    effect(() => {
      if (this.visible()) {
        return;
      }
      this.reset();
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile.set(input.files?.[0] ?? null);
  }

  onHide(): void {
    this.close();
  }

  close(): void {
    this.saving.set(false);
    this.reset();
    this.visibleChange.emit(false);
  }

  private reset(): void {
    this.form.reset({ description: '' });
    this.selectedFile.set(null);
  }

  save(): void {
    this.form.markAllAsTouched();
    this.form.updateValueAndValidity();

    if (this.form.invalid) {
      this.toast.add({
        severity: 'warn',
        summary: this.i18n.tUi('common.warning'),
        detail: this.i18n.tUi('suggestions.form.invalid'),
      });
      return;
    }

    const v = this.form.getRawValue();

    this.saving.set(true);

    this.suggestions
      .create({ description: v.description.trim(), attachment: this.selectedFile() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);

          this.toast.add({
            severity: 'success',
            summary: this.i18n.tUi('common.success'),
            detail: this.i18n.tUi('suggestions.form.created'),
          });

          this.created.emit();
          this.saved.emit();
          this.close();
        },
        error: () => {
          this.saving.set(false);
          this.toast.add({
            severity: 'error',
            summary: this.i18n.tUi('common.error'),
            detail: this.i18n.tUi('suggestions.form.saveError'),
          });
        },
      });
  }
}

import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { input, signal, Output, inject, Component, EventEmitter, effect } from '@angular/core';

import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TranslateModule } from '@ngx-translate/core';

import { I18nService } from '@core/i18n/i18n.service';
import { WorksFacade } from '@features/facade/works.facade';
import { TicketsFacade } from '@features/facade/tickets.facade';
import { ErrorMsgComponent } from '@shared/error-msg/error-msg.component';

@Component({
  standalone: true,
  selector: 'app-tickets-create-dialog',
  templateUrl: './tickets-create-dialog.component.html',
  imports: [
    ToastModule,
    SelectModule,
    DialogModule,
    ButtonModule,
    TextareaModule,
    TranslateModule,
    InputTextModule,
    FloatLabelModule,
    ErrorMsgComponent,
    ReactiveFormsModule,
  ],
})
export class TicketsCreateDialogComponent {
  visible = input.required<boolean>();

  @Output() saved = new EventEmitter<void>();
  @Output() created = new EventEmitter<void>();
  @Output() visibleChange = new EventEmitter<boolean>();

  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly i18n = inject(I18nService);
  readonly tickets = inject(TicketsFacade);
  readonly worksFacade = inject(WorksFacade);
  readonly workOptions = this.worksFacade.options;

  readonly saving = signal(false);
  readonly selectedFile = signal<File | null>(null);

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.required, Validators.maxLength(2000)]],
    workId: this.fb.control<string | null>(null),
  });

  constructor() {
    this.worksFacade.loadOptions();

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
    this.form.reset({ title: '', description: '', workId: null });
    this.selectedFile.set(null);
  }

  save(): void {
    this.form.markAllAsTouched();
    this.form.updateValueAndValidity();

    if (this.form.invalid) {
      this.toast.add({
        severity: 'warn',
        summary: this.i18n.tUi('common.warning'),
        detail: this.i18n.tUi('tickets.form.invalid'),
      });
      return;
    }

    const v = this.form.getRawValue();

    this.saving.set(true);

    this.tickets
      .create({
        title: v.title.trim(),
        description: v.description.trim(),
        workId: v.workId,
        attachment: this.selectedFile(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);

          this.toast.add({
            severity: 'success',
            summary: this.i18n.tUi('common.success'),
            detail: this.i18n.tUi('tickets.form.created'),
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
            detail: this.i18n.tUi('tickets.form.saveError'),
          });
        },
      });
  }
}

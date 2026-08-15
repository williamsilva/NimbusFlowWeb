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
import { TicketsFacade } from '@features/facade/tickets.facade';
import { ErrorMsgComponent } from '@shared/error-msg/error-msg.component';

/** Pequeno dialog dedicado só porque TicketCloseRequest.resolutionNote é obrigatório no backend
 *  (@NotBlank) - diferente de Addendum.decisionNote (opcional, resolvido via ConfirmationService
 *  simples sem input de texto em AllAddendumsListComponent). */
@Component({
  standalone: true,
  selector: 'app-tickets-close-dialog',
  templateUrl: './tickets-close-dialog.component.html',
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
export class TicketsCloseDialogComponent {
  visible = input.required<boolean>();
  ticketId = input<string | null>(null);

  @Output() closed = new EventEmitter<void>();
  @Output() visibleChange = new EventEmitter<boolean>();

  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly i18n = inject(I18nService);
  readonly tickets = inject(TicketsFacade);

  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    resolutionNote: ['', [Validators.required, Validators.maxLength(1000)]],
  });

  constructor() {
    effect(() => {
      if (this.visible()) {
        return;
      }
      this.reset();
    });
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
    this.form.reset({ resolutionNote: '' });
  }

  save(): void {
    const id = this.ticketId();
    if (!id) return;

    this.form.markAllAsTouched();
    this.form.updateValueAndValidity();

    if (this.form.invalid) {
      this.toast.add({
        severity: 'warn',
        summary: this.i18n.tUi('common.warning'),
        detail: this.i18n.tUi('tickets.form.closeInvalid'),
      });
      return;
    }

    const v = this.form.getRawValue();

    this.saving.set(true);

    this.tickets
      .close(id, { resolutionNote: v.resolutionNote.trim() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);

          this.toast.add({
            severity: 'success',
            summary: this.i18n.tUi('common.success'),
            detail: this.i18n.tUi('tickets.status.closed' as never),
          });

          this.closed.emit();
          this.close();
        },
        error: () => {
          this.saving.set(false);
          this.toast.add({
            severity: 'error',
            summary: this.i18n.tUi('common.error'),
            detail: this.i18n.tUi('tickets.status.closeError' as never),
          });
        },
      });
  }
}

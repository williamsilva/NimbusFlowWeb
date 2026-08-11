import { NgFor, NgIf } from '@angular/common';
import { DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { input, Output, inject, Component, EventEmitter } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TranslateModule } from '@ngx-translate/core';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputNumberModule } from 'primeng/inputnumber';

import { I18nService } from '@core/i18n/i18n.service';
import { ErrorMsgComponent } from '@shared/error-msg/error-msg.component';
import { CsCurrencyPipe } from '@shared/pipes/cs-currency.pipe';
import { MeasurementsFacade } from '@features/facade/measurements.facade';
import { translateWorksErrorDetail } from '@features/works/works-error.util';

const ACCEPTED_MEDIA_TYPES =
  'image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm';

function toDateOnlyString(value: Date | null): string | null {
  if (!value) return null;
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, '0');
  const d = String(value.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

@Component({
  standalone: true,
  selector: 'app-measurements-create-dialog',
  templateUrl: './measurements-create-dialog.component.html',
  imports: [
    NgIf,
    NgFor,
    DialogModule,
    ButtonModule,
    TranslateModule,
    TextareaModule,
    DatePickerModule,
    FloatLabelModule,
    InputNumberModule,
    ErrorMsgComponent,
    CsCurrencyPipe,
    ReactiveFormsModule,
  ],
})
export class MeasurementsCreateDialogComponent {
  visible = input.required<boolean>();
  workId = input.required<string>();
  /** Valor total da obra (inicial + aditivos aprovados) - base do percentual executado (valor a pagar / totalAmount * 100). */
  totalAmount = input.required<number>();
  /** totalAmount menos as parcelas já geradas - teto do valor a pagar desta medição (mesma checagem feita no backend ao submeter). */
  remainingAmount = input.required<number>();

  @Output() saved = new EventEmitter<void>();
  @Output() visibleChange = new EventEmitter<boolean>();

  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly i18n = inject(I18nService);
  readonly facade = inject(MeasurementsFacade);
  readonly acceptedMediaTypes = ACCEPTED_MEDIA_TYPES;

  readonly saving = signal(false);
  readonly files = signal<File[]>([]);

  readonly form = this.fb.group({
    description: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(1000)]),
    percentageCompleted: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(0),
      Validators.max(100),
    ]),
    amountToPay: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    dueDate: this.fb.control<Date | null>(null, [Validators.required]),
  });

  constructor() {
    this.form.controls.percentageCompleted.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        const total = this.totalAmount();
        const amount = value != null ? round2((total * value) / 100) : null;
        this.form.controls.amountToPay.setValue(amount, { emitEvent: false });
      });

    this.form.controls.amountToPay.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        const total = this.totalAmount();
        const percentage = value != null && total > 0 ? round2((value / total) * 100) : null;
        this.form.controls.percentageCompleted.setValue(percentage, { emitEvent: false });
      });
  }

  onHide(): void {
    this.close();
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const selected = input.files ? Array.from(input.files) : [];
    this.files.set([...this.files(), ...selected]);
    input.value = '';
  }

  removeFile(index: number): void {
    this.files.set(this.files().filter((_, i) => i !== index));
  }

  close(): void {
    this.saving.set(false);
    this.files.set([]);
    this.form.reset({ description: '', percentageCompleted: null, amountToPay: null, dueDate: null });
    this.visibleChange.emit(false);
  }

  save(): void {
    this.form.markAllAsTouched();
    this.form.updateValueAndValidity();

    if (this.form.invalid) {
      this.toast.add({
        severity: 'warn',
        summary: this.i18n.tUi('common.warning'),
        detail: this.i18n.tUi('measurements.form.invalid'),
      });
      return;
    }

    const v = this.form.getRawValue();

    if (v.amountToPay! > this.remainingAmount()) {
      this.toast.add({
        severity: 'warn',
        summary: this.i18n.tUi('common.warning'),
        detail: this.i18n.tUi('measurements.form.exceedsRemaining'),
      });
      return;
    }

    this.saving.set(true);

    this.facade
      .submit(this.workId(), {
        description: v.description.trim(),
        percentageCompleted: v.percentageCompleted!,
        amountToPay: v.amountToPay!,
        dueDate: toDateOnlyString(v.dueDate)!,
        supersedesId: null,
        files: this.files(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.add({
            severity: 'success',
            summary: this.i18n.tUi('common.success'),
            detail: this.i18n.tUi('measurements.form.created'),
          });
          this.saved.emit();
          this.close();
        },
        error: (err) => {
          this.saving.set(false);
          this.toast.add({
            severity: 'error',
            summary: this.i18n.tUi('common.error'),
            detail:
              translateWorksErrorDetail(err, this.i18n) ??
              this.i18n.tUi('measurements.form.saveError'),
          });
        },
      });
  }
}

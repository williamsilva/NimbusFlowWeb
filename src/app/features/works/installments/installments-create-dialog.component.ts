import { NgFor } from '@angular/common';
import { DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { input, Output, inject, Component, EventEmitter } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TranslateModule } from '@ngx-translate/core';
import { DatePickerModule } from 'primeng/datepicker';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputNumberModule } from 'primeng/inputnumber';

import { I18nService } from '@core/i18n/i18n.service';
import { ErrorMsgComponent } from '@shared/error-msg/error-msg.component';
import { InstallmentsFacade } from '@features/facade/installments.facade';
import { translateWorksErrorDetail } from '@features/works/works-error.util';

function toDateOnlyString(value: Date | null): string | null {
  if (!value) return null;
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, '0');
  const d = String(value.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

@Component({
  standalone: true,
  selector: 'app-installments-create-dialog',
  templateUrl: './installments-create-dialog.component.html',
  imports: [
    NgFor,
    DialogModule,
    ButtonModule,
    TranslateModule,
    DatePickerModule,
    FloatLabelModule,
    InputNumberModule,
    ErrorMsgComponent,
    ReactiveFormsModule,
  ],
})
export class InstallmentsCreateDialogComponent {
  visible = input.required<boolean>();
  workId = input.required<string>();

  @Output() saved = new EventEmitter<void>();
  @Output() visibleChange = new EventEmitter<boolean>();

  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly i18n = inject(I18nService);
  readonly facade = inject(InstallmentsFacade);

  readonly saving = signal(false);

  readonly form = this.fb.group({
    rows: this.fb.array([this.buildRow()]),
  });

  get rows(): FormArray {
    return this.form.controls.rows;
  }

  private buildRow() {
    return this.fb.nonNullable.group({
      amount: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
      dueDate: this.fb.control<Date | null>(null, [Validators.required]),
    });
  }

  addRow(): void {
    this.rows.push(this.buildRow());
  }

  removeRow(index: number): void {
    if (this.rows.length <= 1) return;
    this.rows.removeAt(index);
  }

  onHide(): void {
    this.close();
  }

  close(): void {
    this.saving.set(false);
    this.form.setControl('rows', this.fb.array([this.buildRow()]));
    this.visibleChange.emit(false);
  }

  save(): void {
    this.form.markAllAsTouched();
    this.form.updateValueAndValidity();

    if (this.form.invalid) {
      this.toast.add({
        severity: 'warn',
        summary: this.i18n.tUi('common.warning'),
        detail: this.i18n.tUi('installments.form.invalid'),
      });
      return;
    }

    const installments = this.rows.getRawValue().map((row: { amount: number; dueDate: Date }) => ({
      amount: row.amount,
      dueDate: toDateOnlyString(row.dueDate)!,
    }));

    this.saving.set(true);

    this.facade
      .schedule(this.workId(), { installments })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.add({
            severity: 'success',
            summary: this.i18n.tUi('common.success'),
            detail: this.i18n.tUi('installments.form.created'),
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
              this.i18n.tUi('installments.form.saveError'),
          });
        },
      });
  }
}

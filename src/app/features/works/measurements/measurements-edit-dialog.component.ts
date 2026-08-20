import { DestroyRef, effect, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { input, Output, inject, Component, EventEmitter } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';

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
import { MeasurementModel } from '@models/measurements.models';
import { MeasurementsFacade } from '@features/facade/measurements.facade';
import { translateWorksErrorDetail } from '@features/works/works-error.util';

function toDateOnlyString(value: Date | null): string | null {
  if (!value) return null;
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, '0');
  const d = String(value.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Inverso de toDateOnlyString - "2026-03-01" (LocalDate serializado) -> Date local, sem passar
 *  por UTC (new Date("2026-03-01") interpretaria como meia-noite UTC, que pode virar o dia
 *  anterior dependendo do fuso do navegador). */
function parseDateOnlyString(value: string | null): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Edição de medição - só os campos de negócio (descrição/percentual/valor/vencimento), sem
 * mídia/planta/geolocalização (ficam como estavam, ver MeasurementService.updateMeasurement no
 * backend). Se a medição já tinha gerado uma parcela, salvar cancela essa parcela e devolve a
 * medição pra PENDING - ver MeasurementsListComponent#canEdit/dialogRemainingAmount.
 */
@Component({
  standalone: true,
  selector: 'app-measurements-edit-dialog',
  templateUrl: './measurements-edit-dialog.component.html',
  imports: [
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
export class MeasurementsEditDialogComponent {
  visible = input.required<boolean>();
  measurement = input<MeasurementModel | null>(null);
  /** Valor total da obra - mesmo papel de MeasurementsCreateDialogComponent.totalAmount. */
  totalAmount = input.required<number>();
  /** Teto do valor a pagar já contando que a parcela desta medição (se houver) será cancelada ao
   *  salvar - ver MeasurementsListComponent.dialogRemainingAmount (soma de volta o amountToPay
   *  atual da medição, mesmo cálculo que o backend faz depois de cancelar a parcela). */
  remainingAmount = input.required<number>();

  @Output() updated = new EventEmitter<void>();
  @Output() visibleChange = new EventEmitter<boolean>();

  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly i18n = inject(I18nService);
  readonly facade = inject(MeasurementsFacade);

  readonly saving = signal(false);
  readonly planPositionX = signal<number | null>(null);
  readonly planPositionY = signal<number | null>(null);
  readonly deviceLatitude = signal<number | null>(null);
  readonly deviceLongitude = signal<number | null>(null);

  private readonly amountExceedsRemainingValidator: ValidatorFn = (
    control: AbstractControl,
  ): ValidationErrors | null => {
    const value = control.value;
    if (value == null) return null;

    const remaining = this.remainingAmount();
    if (value <= remaining) return null;

    return { exceedsRemaining: { remaining: this.i18n.formatBrlCurrency(remaining) } };
  };

  private readonly percentageExceedsRemainingValidator: ValidatorFn = (
    control: AbstractControl,
  ): ValidationErrors | null => {
    const value = control.value;
    if (value == null) return null;

    const total = this.totalAmount();
    const remaining = this.remainingAmount();
    const remainingPercentage = total > 0 ? round2((remaining / total) * 100) : 0;
    if (value <= remainingPercentage) return null;

    return { exceedsRemaining: { remaining: this.formatPercentage(remainingPercentage) } };
  };

  readonly form = this.fb.group({
    description: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(1000)]),
    amountToPay: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(0.01),
      this.amountExceedsRemainingValidator,
    ]),
    percentageCompleted: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(0),
      Validators.max(100),
      this.percentageExceedsRemainingValidator,
    ]),
    dueDate: this.fb.control<Date | null>(null, [Validators.required]),
  });

  /** id da medição já carregada no form - evita que um re-fire espúrio deste effect (mesmo
   *  bugfix já documentado em TicketsEditDialogComponent/action-plans-create-dialog/
   *  works-create-dialog/tasks-create-dialog/projects-upsert-dialog/department-form-dialog) chame
   *  form.reset() de novo e apague o que o usuário já editou. */
  private lastLoadedId: string | null = null;

  constructor() {
    effect(() => {
      if (!this.visible()) {
        this.lastLoadedId = null;
        return;
      }

      const m = this.measurement();
      if (!m || this.lastLoadedId === m.id) {
        return;
      }
      this.lastLoadedId = m.id;

      this.form.reset({
        description: m.description,
        amountToPay: m.amountToPay,
        percentageCompleted: m.percentageCompleted,
        dueDate: parseDateOnlyString(m.dueDate),
      });
      this.planPositionX.set(m.planPositionX);
      this.planPositionY.set(m.planPositionY);
      this.deviceLatitude.set(m.deviceLatitude);
      this.deviceLongitude.set(m.deviceLongitude);
    });

    // remainingAmount/totalAmount são inputs - se mudarem com o diálogo já aberto, revalida os 2 campos.
    effect(() => {
      this.totalAmount();
      this.remainingAmount();
      this.form.controls.amountToPay.updateValueAndValidity({ emitEvent: false });
      this.form.controls.percentageCompleted.updateValueAndValidity({ emitEvent: false });
    });

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

  private formatPercentage(value: number): string {
    return `${new Intl.NumberFormat(this.i18n.getLocale(), {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)} %`;
  }

  onHide(): void {
    this.close();
  }

  close(): void {
    this.saving.set(false);
    this.lastLoadedId = null;
    this.visibleChange.emit(false);
  }

  save(): void {
    const measurement = this.measurement();
    if (!measurement) return;

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

    this.saving.set(true);

    this.facade
      .update(measurement.id, {
        description: v.description.trim(),
        percentageCompleted: v.percentageCompleted!,
        amountToPay: v.amountToPay!,
        dueDate: toDateOnlyString(v.dueDate)!,
        planPositionX: this.planPositionX(),
        planPositionY: this.planPositionY(),
        deviceLatitude: this.deviceLatitude(),
        deviceLongitude: this.deviceLongitude(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.add({
            severity: 'success',
            summary: this.i18n.tUi('common.success'),
            detail: this.i18n.tUi('measurements.form.updated'),
          });
          this.updated.emit();
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

import { computed, DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { input, Output, inject, Component, EventEmitter } from '@angular/core';

import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TranslateModule } from '@ngx-translate/core';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { FloatLabelModule } from 'primeng/floatlabel';

import { I18nService } from '@core/i18n/i18n.service';
import { ErrorMsgComponent } from '@shared/error-msg/error-msg.component';
import { AddendumsFacade } from '@features/facade/addendums.facade';
import { ApprovalTierEnum } from '@models/enums/addendum-status.enum';
import { translateWorksErrorDetail } from '@features/works/works-error.util';

/** Só informativo no cliente - a alçada real é sempre calculada e gravada pelo backend
 *  (AddendumApprovalService.resolveTier), este valor pode ficar defasado se o limite mudar. */
const APPROVAL_TIER2_THRESHOLD_HINT = 50000;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

@Component({
  standalone: true,
  selector: 'app-addendums-create-dialog',
  templateUrl: './addendums-create-dialog.component.html',
  imports: [
    FormsModule,
    DialogModule,
    ButtonModule,
    TranslateModule,
    TextareaModule,
    FloatLabelModule,
    InputNumberModule,
    ErrorMsgComponent,
    ReactiveFormsModule,
  ],
})
export class AddendumsCreateDialogComponent {
  visible = input.required<boolean>();
  workId = input.required<string>();
  /** Valor inicial da obra - base do percentual de aumento (valor / initialAmount * 100). */
  initialAmount = input.required<number>();

  @Output() saved = new EventEmitter<void>();
  @Output() visibleChange = new EventEmitter<boolean>();

  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly i18n = inject(I18nService);
  readonly facade = inject(AddendumsFacade);

  readonly saving = signal(false);
  readonly amount = signal<number | null>(null);

  readonly tierHint = computed<ApprovalTierEnum>(() =>
    (this.amount() ?? 0) > APPROVAL_TIER2_THRESHOLD_HINT
      ? ApprovalTierEnum.TIER2
      : ApprovalTierEnum.TIER1,
  );

  readonly form = this.fb.nonNullable.group({
    amount: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    percentage: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    justification: ['', [Validators.required, Validators.maxLength(1000)]],
  });

  constructor() {
    this.form.controls.amount.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.amount.set(value ?? null);
        const initial = this.initialAmount();
        const percentage = value != null && initial > 0 ? round2((value / initial) * 100) : null;
        this.form.controls.percentage.setValue(percentage, { emitEvent: false });
      });

    this.form.controls.percentage.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        const initial = this.initialAmount();
        const amount = value != null ? round2((initial * value) / 100) : null;
        this.amount.set(amount);
        this.form.controls.amount.setValue(amount, { emitEvent: false });
      });
  }

  onHide(): void {
    this.close();
  }

  close(): void {
    this.saving.set(false);
    this.amount.set(null);
    this.form.reset({ amount: null, percentage: null, justification: '' });
    this.visibleChange.emit(false);
  }

  save(): void {
    this.form.markAllAsTouched();
    this.form.updateValueAndValidity();

    if (this.form.invalid) {
      this.toast.add({
        severity: 'warn',
        summary: this.i18n.tUi('common.warning'),
        detail: this.i18n.tUi('addendums.form.invalid'),
      });
      return;
    }

    const v = this.form.getRawValue();
    this.saving.set(true);

    this.facade
      .submit(this.workId(), {
        amount: v.amount!,
        justification: v.justification.trim(),
        supersedesId: null,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.add({
            severity: 'success',
            summary: this.i18n.tUi('common.success'),
            detail: this.i18n.tUi('addendums.form.created'),
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
              translateWorksErrorDetail(err, this.i18n) ?? this.i18n.tUi('addendums.form.saveError'),
          });
        },
      });
  }
}

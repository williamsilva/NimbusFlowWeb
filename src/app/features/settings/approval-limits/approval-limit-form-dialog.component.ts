import { DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Output, Component, EventEmitter } from '@angular/core';

import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { TranslateModule } from '@ngx-translate/core';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputNumberModule } from 'primeng/inputnumber';
import { FloatLabelModule } from 'primeng/floatlabel';

import { I18nService } from '@core/i18n/i18n.service';
import { UserOptionModel } from '@models/groups.models';
import { ErrorMsgComponent } from '@shared/error-msg/error-msg.component';
import { ApprovalLimitModel } from '@models/approval-limits.models';
import { ApprovalLimitsFacade } from '@features/facade/approval-limits.facade';

@Component({
  standalone: true,
  selector: 'app-approval-limit-form-dialog',
  templateUrl: './approval-limit-form-dialog.component.html',
  imports: [
    FormsModule,
    DialogModule,
    ButtonModule,
    CheckboxModule,
    TranslateModule,
    FloatLabelModule,
    InputNumberModule,
    MultiSelectModule,
    ErrorMsgComponent,
    ReactiveFormsModule,
  ],
})
export class ApprovalLimitFormDialogComponent {
  visible = input.required<boolean>();
  editing = input.required<ApprovalLimitModel | null>();
  userOptions = input.required<UserOptionModel[]>();

  @Output() visibleChange = new EventEmitter<boolean>();

  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly facade = inject(ApprovalLimitsFacade);

  readonly i18n = inject(I18nService);
  readonly saving = signal(false);
  readonly unbounded = signal(false);

  readonly isEditing = computed(() => this.editing() != null);

  readonly form = this.fb.nonNullable.group({
    minAmount: this.fb.control<number | null>(null, [Validators.required, Validators.min(0)]),
    maxAmount: this.fb.control<number | null>(null),
    userIds: this.fb.nonNullable.control<string[]>([], [Validators.required]),
  });

  constructor() {
    // Reabre o form com os dados da faixa (ou limpo, pra criação) toda vez que o diálogo abre -
    // mesmo padrão de outros diálogos deste módulo, que não recebem "initialValue" separado.
    effect(() => {
      if (!this.visible()) return;

      const current = this.editing();
      this.unbounded.set(current ? current.maxAmount == null : false);
      this.form.reset({
        minAmount: current?.minAmount ?? null,
        maxAmount: current?.maxAmount ?? null,
        userIds: current?.userIds ?? [],
      });
    });

    // maxAmount desabilita via FormControl (não [disabled] no template) - ligar os dois causa o
    // warning do Angular "disabled attribute with a reactive form directive". form.reset() acima
    // sempre reabilita os controles, por isso este effect roda depois (mesma ordem de leitura de
    // signals) e aplica o estado certo de volta.
    effect(() => {
      if (this.unbounded()) {
        this.form.controls.maxAmount.disable();
      } else {
        this.form.controls.maxAmount.enable();
      }
    });

    this.form.controls.userIds.setValidators([]);
  }

  onUnboundedChange(checked: boolean): void {
    this.unbounded.set(checked);
    if (checked) {
      this.form.controls.maxAmount.setValue(null);
    }
  }

  onHide(): void {
    this.close();
  }

  close(): void {
    this.saving.set(false);
    this.visibleChange.emit(false);
  }

  save(): void {
    this.form.markAllAsTouched();
    this.form.updateValueAndValidity();

    const v = this.form.getRawValue();

    if (this.form.controls.minAmount.invalid || v.userIds.length === 0) {
      this.toast.add({
        severity: 'warn',
        summary: this.i18n.tUi('common.warning'),
        detail: this.i18n.tUi('approvalLimits.form.invalid'),
      });
      return;
    }

    if (!this.unbounded() && (v.maxAmount == null || v.maxAmount <= v.minAmount!)) {
      this.toast.add({
        severity: 'warn',
        summary: this.i18n.tUi('common.warning'),
        detail: this.i18n.tUi('approvalLimits.form.invalidRange'),
      });
      return;
    }

    const input = {
      minAmount: v.minAmount!,
      maxAmount: this.unbounded() ? null : v.maxAmount,
      userIds: v.userIds,
    };

    this.saving.set(true);
    const editingId = this.editing()?.id;
    const request$ = editingId ? this.facade.update(editingId, input) : this.facade.create(input);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.add({
          severity: 'success',
          summary: this.i18n.tUi('common.success'),
          detail: this.i18n.tUi(editingId ? 'approvalLimits.form.updated' : 'approvalLimits.form.created'),
        });
        this.close();
      },
      error: () => {
        this.saving.set(false);
        this.toast.add({
          severity: 'error',
          summary: this.i18n.tUi('common.error'),
          detail: this.i18n.tUi('approvalLimits.form.saveError'),
        });
      },
    });
  }
}

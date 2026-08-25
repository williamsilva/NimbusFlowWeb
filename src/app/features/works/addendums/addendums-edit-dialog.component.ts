import { DestroyRef, effect, signal } from '@angular/core';
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
import { AddendumModel } from '@models/addendums.models';
import { AddendumStatusEnum } from '@models/enums/addendum-status.enum';
import { AddendumsFacade } from '@features/facade/addendums.facade';
import { translateWorksErrorDetail } from '@features/works/works-error.util';

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Edição de um aditivo já solicitado - mesmos campos da criação (valor/percentual/justificativa,
 * ver AddendumsCreateDialogComponent). Editar um aditivo já decidido (Aprovado ou Reprovado) o
 * devolve pra Pendente no backend (AddendumApprovalService.updateAddendum) - dispara o e-mail/
 * push de "aditivo reaberto" e exige uma nova decisão. Elegibilidade (permissão + status da
 * frente de serviço + valor ainda não totalmente medido) já vem resolvida pelo backend em
 * AddendumModel.canEdit - ver AddendumsListComponent#openEdit.
 */
@Component({
  standalone: true,
  selector: 'app-addendums-edit-dialog',
  templateUrl: './addendums-edit-dialog.component.html',
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
export class AddendumsEditDialogComponent {
  visible = input.required<boolean>();
  addendum = input<AddendumModel | null>(null);
  /** Valor inicial da obra - base do percentual (mesmo papel de
   *  AddendumsCreateDialogComponent.initialAmount). */
  initialAmount = input.required<number>();

  @Output() updated = new EventEmitter<void>();
  @Output() visibleChange = new EventEmitter<boolean>();

  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly i18n = inject(I18nService);
  readonly facade = inject(AddendumsFacade);

  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    amount: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    percentage: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    justification: ['', [Validators.required, Validators.maxLength(1000)]],
  });

  /** id do aditivo já carregado no form - evita que um re-fire espúrio deste effect (mesmo
   *  bugfix já documentado em MeasurementsEditDialogComponent/TicketsEditDialogComponent/etc)
   *  chame form.reset() de novo e apague o que o usuário já editou. */
  private lastLoadedId: string | null = null;

  constructor() {
    effect(() => {
      if (!this.visible()) {
        this.lastLoadedId = null;
        return;
      }

      const a = this.addendum();
      if (!a || this.lastLoadedId === a.id) {
        return;
      }
      this.lastLoadedId = a.id;

      const initial = this.initialAmount();
      const percentage = initial > 0 ? round2((a.amount / initial) * 100) : null;

      // emitEvent: false - mesmo motivo documentado em MeasurementsEditDialogComponent: sem isso,
      // o reset de amount e percentage (nessa ordem) disparava um os valueChanges do outro em
      // cascata, arredondando o valor exato carregado.
      this.form.reset(
        { amount: a.amount, percentage, justification: a.justification },
        { emitEvent: false },
      );
    });

    this.form.controls.amount.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        const initial = this.initialAmount();
        const percentage = value != null && initial > 0 ? round2((value / initial) * 100) : null;
        this.form.controls.percentage.setValue(percentage, { emitEvent: false });
      });

    this.form.controls.percentage.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        const initial = this.initialAmount();
        const amount = value != null ? round2((initial * value) / 100) : null;
        this.form.controls.amount.setValue(amount, { emitEvent: false });
      });
  }

  /** true quando salvar vai REABRIR o aditivo (já decidido, voltando pra Pendente) - usado só pro
   *  aviso no template, ver AddendumApprovalService.updateAddendum (wasDecided). */
  isReopening(): boolean {
    return this.addendum()?.status !== AddendumStatusEnum.PENDING && !!this.addendum();
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
    const addendum = this.addendum();
    if (!addendum) return;

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
      .update(addendum.id, {
        amount: v.amount!,
        justification: v.justification.trim(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.add({
            severity: 'success',
            summary: this.i18n.tUi('common.success'),
            detail: this.i18n.tUi('addendums.form.updated'),
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
              translateWorksErrorDetail(err, this.i18n) ?? this.i18n.tUi('addendums.form.saveError'),
          });
        },
      });
  }
}

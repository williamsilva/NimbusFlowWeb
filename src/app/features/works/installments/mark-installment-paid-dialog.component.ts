import { Component, EventEmitter, Output, effect, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TranslateModule } from '@ngx-translate/core';
import { DatePickerModule } from 'primeng/datepicker';
import { FloatLabelModule } from 'primeng/floatlabel';

import { I18nService } from '@core/i18n/i18n.service';
import { PaymentModel } from '@models/payments.models';
import { DateInputMaskDirective } from '@shared/directives/date-input-mask.directive';

function toDateOnlyString(value: Date | null): string | null {
  if (!value) return null;
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, '0');
  const d = String(value.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Pede a data em que o pagamento efetivamente ocorreu antes de marcar o Pagamento como pago - não
 * é "agora" (ver InstallmentService#markAsPaid no backend, que usa essa data pra contar a
 * carência de conclusão automática da Frente, WorkAutoCompleteService).
 *
 * <p>Component "burro" de propósito - não chama a API sozinho, só coleta a data e emite
 * `confirmed`; quem abre o dialog (tela "Pagamentos") decide como tratar sucesso/erro (toast).
 */
@Component({
  standalone: true,
  selector: 'app-mark-installment-paid-dialog',
  templateUrl: './mark-installment-paid-dialog.component.html',
  imports: [
    FormsModule,
    DialogModule,
    ButtonModule,
    TranslateModule,
    DatePickerModule,
    FloatLabelModule,
    DateInputMaskDirective,
  ],
})
export class MarkInstallmentPaidDialogComponent {
  visible = input.required<boolean>();
  payment = input<PaymentModel | null>(null);

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() confirmed = new EventEmitter<string>();

  readonly i18n = inject(I18nService);

  /** Sem [minDate] - carência do WorkAutoCompleteJob usa o pagamento MAIS RECENTE entre as
   *  parcelas, então uma data bem antiga não quebra nada, só adianta a elegibilidade da Frente
   *  (comportamento esperado: o usuário está registrando um pagamento que já ocorreu). */
  protected readonly today = new Date();
  protected paidAt: Date | null = null;

  constructor() {
    // Reabre sempre com a data de hoje sugerida (maioria dos pagamentos é registrada no mesmo
    // dia) - o usuário pode trocar antes de confirmar.
    effect(() => {
      if (this.visible()) {
        this.paidAt = new Date();
      }
    });
  }

  supplierLabel(): string {
    return this.payment()?.supplierName ?? '';
  }

  cancel(): void {
    this.visibleChange.emit(false);
  }

  confirm(): void {
    const paidAt = toDateOnlyString(this.paidAt);
    if (!paidAt) return;
    this.confirmed.emit(paidAt);
  }
}

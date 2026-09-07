import { Component, EventEmitter, Output, effect, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TranslateModule } from '@ngx-translate/core';
import { DatePickerModule } from 'primeng/datepicker';
import { FloatLabelModule } from 'primeng/floatlabel';

import { I18nService } from '@core/i18n/i18n.service';
import { DateInputMaskDirective } from '@williamsilva/nimbus-web-commons';

/** Só o necessário pra rotular a confirmação - quem abre o dialog decide o resto (id, valor). */
export interface MarkInstallmentPaidTarget {
  supplierName: string;
}

function toDateOnlyString(value: Date | null): string | null {
  if (!value) return null;
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, '0');
  const d = String(value.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Inverso de toDateOnlyString - "2026-03-01" (LocalDate serializado) -> Date local, sem passar
 *  por UTC (new Date("2026-03-01") interpretaria como meia-noite UTC, que pode virar o dia
 *  anterior dependendo do fuso do navegador). Mesmo helper de measurements-edit-dialog.component.ts. */
function parseDateOnlyString(value: string | null): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Pede a data em que o pagamento efetivamente ocorreu antes de marcar o Pagamento como pago - não
 * é "agora" (ver InstallmentService#markAsPaid no backend, que usa essa data pra contar a
 * carência de conclusão automática da Frente, WorkAutoCompleteService).
 *
 * <p>Component "burro" de propósito - não chama a API sozinho, só coleta a data e emite
 * `confirmed`; quem abre o dialog (tela "Parcelas Liberadas") decide como tratar sucesso/erro
 * (toast).
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
  payment = input<MarkInstallmentPaidTarget | null>(null);
  /** Vencimento mais próximo entre as Ordens incluídas neste Pagamento (mesmo cálculo da coluna
   *  "Vencimento" da tela, ver PaymentsListComponent.dueDate) - sugerido como data de pagamento
   *  por padrão, pedido do usuário (2026-09-01): a maioria dos pagamentos ocorre no vencimento,
   *  não no dia em que alguém confirma isso no sistema. */
  suggestedDate = input<string | null>(null);

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() confirmed = new EventEmitter<string>();

  readonly i18n = inject(I18nService);

  /** Sem [minDate] - carência do WorkAutoCompleteJob usa o pagamento MAIS RECENTE entre as
   *  parcelas, então uma data bem antiga não quebra nada, só adianta a elegibilidade da Frente
   *  (comportamento esperado: o usuário está registrando um pagamento que já ocorreu). */
  protected readonly today = new Date();
  protected paidAt: Date | null = null;

  constructor() {
    // Reabre sugerindo o vencimento (suggestedDate) quando disponível - cai pra hoje só se o
    // Pagamento não tiver nenhuma Ordem vinculada (não deveria acontecer em dado real). O usuário
    // pode trocar antes de confirmar, de qualquer forma.
    effect(() => {
      if (this.visible()) {
        this.paidAt = parseDateOnlyString(this.suggestedDate()) ?? new Date();
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

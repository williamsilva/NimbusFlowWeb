import { Component, EventEmitter, Output, effect, inject, input, signal } from '@angular/core';

import { ChipModule } from 'primeng/chip';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TranslateModule } from '@ngx-translate/core';

import { I18nService } from '@core/i18n/i18n.service';
import { CsCurrencyPipe } from '@shared/pipes/cs-currency.pipe';

/** Só o necessário pra rotular a confirmação (quantidade/valor/fornecedor) - quem abre o dialog
 *  decide o resto (ids das Ordens a enviar). */
export interface SendPaymentOrderTarget {
  supplierName: string;
  orderCount: number;
  totalAmount: number;
}

/**
 * Confirma o envio de um Pagamento consolidado (tela "Parcelas Liberadas") com a opção de anexar
 * o PDF da nota fiscal do fornecedor (pedido do usuário, 2026-09-18) - 1 anexo opcional pro envio
 * inteiro, não por Ordem incluída. Component "burro" de propósito (mesmo padrão de
 * MarkInstallmentPaidDialogComponent) - não chama a API sozinho, só coleta o arquivo e emite
 * `confirmed`; quem abre decide como tratar sucesso/erro (toast).
 */
@Component({
  standalone: true,
  selector: 'app-send-payment-order-dialog',
  templateUrl: './send-payment-order-dialog.component.html',
  imports: [ChipModule, DialogModule, ButtonModule, TranslateModule, CsCurrencyPipe],
})
export class SendPaymentOrderDialogComponent {
  visible = input.required<boolean>();
  target = input<SendPaymentOrderTarget | null>(null);
  sending = input(false);

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() confirmed = new EventEmitter<File | null>();

  readonly i18n = inject(I18nService);

  protected readonly invoice = signal<File | null>(null);

  constructor() {
    // Reabre sempre sem anexo - o dialog não guarda estado entre um envio e o próximo (mesmo
    // racional de MarkInstallmentPaidDialogComponent: reabrir é sempre um novo início).
    effect(() => {
      if (this.visible()) {
        this.invoice.set(null);
      }
    });
  }

  onInvoiceSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.invoice.set(input.files?.[0] ?? null);
    input.value = '';
  }

  removeInvoice(): void {
    this.invoice.set(null);
  }

  cancel(): void {
    this.visibleChange.emit(false);
  }

  confirm(): void {
    this.confirmed.emit(this.invoice());
  }
}

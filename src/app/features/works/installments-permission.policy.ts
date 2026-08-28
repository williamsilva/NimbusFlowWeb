import { Injectable, inject } from '@angular/core';

import { PERMISSIONS } from '@core/auth/permissions.constants';
import { PermissionService } from '@core/auth/permission.service';

@Injectable({ providedIn: 'root' })
export class InstallmentsPermissionPolicy {
  private readonly perms = inject(PermissionService);

  /** Ver a própria tela (menu/rota) exige `PARCELA_CONSULT`. */
  canView(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.PARCELA.VIEW);
  }

  canRelease(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.PARCELA.LIBERAR);
  }

  canMarkPaid(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.PARCELA.PAGAR);
  }

  canResendNotification(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.PARCELA.LIBERAR);
  }

  /** Cancelar uma Ordem (ainda não enviada) reabre a Medição que a gerou pra PENDING - por isso a
   *  permissão é MEDICAO_REABRIR, não uma PARCELA.* (mesma razão documentada no backend, ver
   *  PaymentOrderService.cancel/MeasurementService.cancelGeneratedOrderAndReopen). */
  canCancelOrder(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.MEDICAO.REABRIR);
  }

  canUndoMarkPaid(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.PARCELA.DESFAZER_PAGAMENTO);
  }

  canUndoSend(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.PARCELA.DESFAZER_ENVIO);
  }

  /** Controla a visibilidade da coluna de seleção + botão "Enviar Ordem de Pagamento" dentro de
   *  "Parcelas Liberadas" (extinta tela dedicada "Ordens de Pagamento" incorporada ali em
   *  2026-08-24) - quem não tem essa permissão só vê a listagem normal, sem selecionar/enviar. */
  canSendPaymentOrder(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.PARCELA.ENVIAR_ORDEM);
  }

  releaseDisabledReason(): string | null {
    return this.canRelease() ? null : 'installments.action.noPermission';
  }

  markPaidDisabledReason(): string | null {
    return this.canMarkPaid() ? null : 'installments.action.noPermission';
  }

  resendNotificationDisabledReason(): string | null {
    return this.canResendNotification() ? null : 'installments.action.noPermission';
  }

  cancelOrderDisabledReason(): string | null {
    return this.canCancelOrder() ? null : 'installments.action.noPermission';
  }

  undoMarkPaidDisabledReason(): string | null {
    return this.canUndoMarkPaid() ? null : 'installments.action.noPermission';
  }

  undoSendDisabledReason(): string | null {
    return this.canUndoSend() ? null : 'installments.action.noPermission';
  }
}

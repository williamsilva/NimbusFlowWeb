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
}

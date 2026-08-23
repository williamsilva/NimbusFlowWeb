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

  /** Ver a tela "Ordens de Pagamento" e enviar exigem a mesma permissão - a tela inteira é sobre
   *  a ação de enviar, sem modo só-leitura separado. */
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

import { Injectable, inject } from '@angular/core';

import { PERMISSIONS } from '@core/auth/permissions.constants';
import { PermissionService } from '@core/auth/permission.service';

/**
 * `InstallmentService.scheduleInstallments` no backend não checa nenhuma authority (diferente de
 * release/markAsPaid, que exigem PARCELA_LIBERAR/PARCELA_PAGAR) - gateamos a criação do
 * cronograma aqui no frontend por OBRA_MANAGE (mesma permissão de editar a obra) como defesa em
 * profundidade, já que agendar parcelas é parte de gerenciar a obra.
 */
@Injectable({ providedIn: 'root' })
export class InstallmentsPermissionPolicy {
  private readonly perms = inject(PermissionService);

  canSchedule(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.OBRA.MANAGE);
  }

  canRelease(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.PARCELA.LIBERAR);
  }

  canMarkPaid(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.PARCELA.PAGAR);
  }

  scheduleDisabledReason(): string | null {
    return this.canSchedule() ? null : 'installments.action.noPermission';
  }

  releaseDisabledReason(): string | null {
    return this.canRelease() ? null : 'installments.action.noPermission';
  }

  markPaidDisabledReason(): string | null {
    return this.canMarkPaid() ? null : 'installments.action.noPermission';
  }
}

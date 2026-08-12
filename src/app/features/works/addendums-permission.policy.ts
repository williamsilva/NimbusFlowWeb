import { Injectable, inject } from '@angular/core';

import { PERMISSIONS } from '@core/auth/permissions.constants';
import { PermissionService } from '@core/auth/permission.service';

/**
 * Quem pode decidir (aprovar/reprovar) um aditivo específico já vem resolvido pelo backend em
 * AddendumModel.canDecide (permissão de aprovar aditivo + estar na faixa de valor autorizada em
 * Configurações > Alçada, ver AddendumApprovalService.canDecide) - não recalcular no cliente, só
 * usar `row.canDecide` direto. Antes esta policy recebia um ApprovalTier (Alçada 1/2, corte fixo
 * de valor) e decidia sozinha, o que podia divergir da regra real aplicada no approve/reject -
 * causa do bug da coluna "Alçada" desalinhada.
 */
@Injectable({ providedIn: 'root' })
export class AddendumsPermissionPolicy {
  private readonly perms = inject(PermissionService);

  canCreate(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.ADITIVO.CREATE);
  }

  createDisabledReason(): string | null {
    return this.canCreate() ? null : 'addendums.action.noPermission';
  }
}

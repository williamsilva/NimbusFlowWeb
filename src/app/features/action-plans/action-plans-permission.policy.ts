import { Injectable, inject } from '@angular/core';

import { PERMISSIONS } from '@core/auth/permissions.constants';
import { PermissionService } from '@core/auth/permission.service';

/** Todas as ações (criar/editar/iniciar/concluir/cancelar) exigem PLANO_ACAO_MANAGE - sem alçada/
 *  aprovação formal (ver javadoc de ActionPlanService no backend). */
@Injectable({ providedIn: 'root' })
export class ActionPlansPermissionPolicy {
  private readonly perms = inject(PermissionService);

  canManage(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.PLANO_ACAO.MANAGE);
  }
}

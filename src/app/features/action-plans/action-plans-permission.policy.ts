import { Injectable, inject } from '@angular/core';

import { PERMISSIONS } from '@core/auth/permissions.constants';
import { PermissionService } from '@core/auth/permission.service';

/** Todas as ações (criar/editar/iniciar/concluir/cancelar) exigem PLANO_ACAO_MANAGE - sem alçada/
 *  aprovação formal (ver javadoc de ActionPlanService no backend). Ver a própria tela (menu/rota)
 *  exige PLANO_ACAO_CONSULT - ver `canView`. */
@Injectable({ providedIn: 'root' })
export class ActionPlansPermissionPolicy {
  private readonly perms = inject(PermissionService);

  canView(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.PLANO_ACAO.VIEW);
  }

  canManage(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.PLANO_ACAO.MANAGE);
  }
}

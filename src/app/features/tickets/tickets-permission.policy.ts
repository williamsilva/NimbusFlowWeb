import { Injectable, inject } from '@angular/core';

import { PERMISSIONS } from '@core/auth/permissions.constants';
import { PermissionService } from '@core/auth/permission.service';

/**
 * Criação de chamado é livre (qualquer usuário autenticado pode reportar - ver TicketService no
 * backend), sem gate de permissão. Editar/fechar/cancelar exigem CHAMADO_MANAGE.
 */
@Injectable({ providedIn: 'root' })
export class TicketsPermissionPolicy {
  private readonly perms = inject(PermissionService);

  canCreate(): boolean {
    return true;
  }

  canManage(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.CHAMADO.MANAGE);
  }
}

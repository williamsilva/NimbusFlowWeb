import { Injectable, inject } from '@angular/core';

import { PERMISSIONS } from '@core/auth/permissions.constants';
import { PermissionService } from '@core/auth/permission.service';

/**
 * Criação de chamado é livre (qualquer usuário autenticado pode reportar - ver TicketService no
 * backend), sem gate de permissão. Fechar/converter/vincular Frente exigem CHAMADO_MANAGE;
 * cancelar exige CHAMADO_CANCEL e editar exige CHAMADO_EDIT - permissões dedicadas e separadas
 * (não reaproveitam MANAGE, mesmo padrão de OBRA_DELETE/MEDICAO_DELETE), pedido do usuário
 * 2026-09-19/2026-09-20: grupo Operacional tem CHAMADO_MANAGE mas não deve poder cancelar nem
 * editar. Ver a própria tela (menu/rota) exige CHAMADO_CONSULT - ver `canView`.
 */
@Injectable({ providedIn: 'root' })
export class TicketsPermissionPolicy {
  private readonly perms = inject(PermissionService);

  canView(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.CHAMADO.VIEW);
  }

  canCreate(): boolean {
    return true;
  }

  canManage(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.CHAMADO.MANAGE);
  }

  canCancel(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.CHAMADO.CANCEL);
  }

  canEdit(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.CHAMADO.EDIT);
  }
}

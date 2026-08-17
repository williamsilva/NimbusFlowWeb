import { Injectable, inject } from '@angular/core';

import { PERMISSIONS } from '@core/auth/permissions.constants';
import { PermissionService } from '@core/auth/permission.service';

/**
 * Uma única permissão de escrita (`OBRA_MANAGE`) cobrindo create+update - não há exclusão (o
 * backend não expõe DELETE pra Obra, só o status `CANCELLED`). Ver a própria tela (menu/rota)
 * exige `OBRA_CONSULT` - ver `canView`. O seletor de Frente de Serviço usado por outras telas
 * (Chamados/Planos de Ação/Dashboard/Medições/Parcelas/Aditivos) não passa por aqui - consome
 * `/works/options`, sem gate (ver WorkService#options no backend).
 */
@Injectable({ providedIn: 'root' })
export class WorksPermissionPolicy {
  private readonly perms = inject(PermissionService);

  canView(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.OBRA.VIEW);
  }

  canManage(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.OBRA.MANAGE);
  }

  canCreate(): boolean {
    return this.canManage();
  }

  canEdit(): boolean {
    return this.canManage();
  }

  createDisabledReason(): string | null {
    return this.canCreate() ? null : 'works.action.noPermission';
  }

  editDisabledReason(): string | null {
    return this.canEdit() ? null : 'works.action.noPermission';
  }
}

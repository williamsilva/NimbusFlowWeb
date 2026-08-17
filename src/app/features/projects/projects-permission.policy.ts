import { Injectable, inject } from '@angular/core';

import { PERMISSIONS } from '@core/auth/permissions.constants';
import { PermissionService } from '@core/auth/permission.service';

/** Só uma permissão única (`PROJETO_MANAGE`) cobrindo create+update, mesmo padrão de Obra/Fornecedor.
 *  Ver a própria tela (menu/rota) exige `PROJETO_CONSULT` - ver `canView`. */
@Injectable({ providedIn: 'root' })
export class ProjectsPermissionPolicy {
  private readonly perms = inject(PermissionService);

  canView(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.PROJETO.VIEW);
  }

  canManage(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.PROJETO.MANAGE);
  }

  canCreate(): boolean {
    return this.canManage();
  }

  canEdit(): boolean {
    return this.canManage();
  }

  createDisabledReason(): string | null {
    return this.canCreate() ? null : 'projects.action.noPermission';
  }

  editDisabledReason(): string | null {
    return this.canEdit() ? null : 'projects.action.noPermission';
  }
}

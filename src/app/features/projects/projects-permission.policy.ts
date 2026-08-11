import { Injectable, inject } from '@angular/core';

import { PERMISSIONS } from '@core/auth/permissions.constants';
import { PermissionService } from '@core/auth/permission.service';

/** Só uma permissão única (`PROJETO_MANAGE`) cobrindo create+update, mesmo padrão de Obra/Fornecedor. */
@Injectable({ providedIn: 'root' })
export class ProjectsPermissionPolicy {
  private readonly perms = inject(PermissionService);

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

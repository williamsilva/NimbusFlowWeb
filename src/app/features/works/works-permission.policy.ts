import { Injectable, inject } from '@angular/core';

import { PERMISSIONS } from '@core/auth/permissions.constants';
import { PermissionService } from '@core/auth/permission.service';

/**
 * Só uma permissão única (`OBRA_MANAGE`) cobrindo create+update - não há exclusão (o backend não
 * expõe DELETE pra Obra, só o status `CANCELLED`) e não há variantes VIEW/CREATE/CHANGE (leitura
 * é sempre aberta a qualquer usuário autenticado, ver WorkService no backend).
 */
@Injectable({ providedIn: 'root' })
export class WorksPermissionPolicy {
  private readonly perms = inject(PermissionService);

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

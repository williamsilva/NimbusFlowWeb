import { Injectable, inject } from '@angular/core';

import { PERMISSIONS } from '@core/auth/permissions.constants';
import { PermissionService } from '@core/auth/permission.service';

/**
 * Uma única permissão de escrita (`FORNECEDOR_MANAGE`) cobrindo create+update+deactivate - não
 * há variantes CREATE/CHANGE/DELETE. Ver a própria tela (menu/rota) exige `FORNECEDOR_CONSULT` -
 * ver `canView`.
 */
@Injectable({ providedIn: 'root' })
export class SuppliersPermissionPolicy {
  private readonly perms = inject(PermissionService);

  canView(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.FORNECEDOR.VIEW);
  }

  canManage(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.FORNECEDOR.MANAGE);
  }

  canCreate(): boolean {
    return this.canManage();
  }

  canEdit(): boolean {
    return this.canManage();
  }

  canDeactivate(): boolean {
    return this.canManage();
  }

  canActivate(): boolean {
    return this.canManage();
  }

  createDisabledReason(): string | null {
    return this.canCreate() ? null : 'suppliers.action.noPermission';
  }

  editDisabledReason(): string | null {
    return this.canEdit() ? null : 'suppliers.action.noPermission';
  }

  deactivateDisabledReason(): string | null {
    return this.canDeactivate() ? null : 'suppliers.action.noPermission';
  }

  activateDisabledReason(): string | null {
    return this.canActivate() ? null : 'suppliers.action.noPermission';
  }
}

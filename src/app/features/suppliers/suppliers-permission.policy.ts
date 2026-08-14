import { Injectable, inject } from '@angular/core';

import { PERMISSIONS } from '@core/auth/permissions.constants';
import { PermissionService } from '@core/auth/permission.service';

/**
 * Diferente de GroupsPermissionPolicy/SecurityPermissionPolicy: o NimbusFlowServer só tem uma
 * permissão única (`FORNECEDOR_MANAGE`) cobrindo create+update+deactivate - não há variantes
 * VIEW/CREATE/CHANGE/DELETE (leitura é sempre aberta a qualquer usuário autenticado, ver
 * SupplierService no backend).
 */
@Injectable({ providedIn: 'root' })
export class SuppliersPermissionPolicy {
  private readonly perms = inject(PermissionService);

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

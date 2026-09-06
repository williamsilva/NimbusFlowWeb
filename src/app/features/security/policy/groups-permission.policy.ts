import { Injectable, inject } from '@angular/core';

import { GroupModel } from '@models/groups.models';
import { PERMISSIONS } from '@core/auth/permissions.constants';
import { PermissionService } from '@core/auth/permission.service';

export type GroupPermissionTarget = Pick<GroupModel, 'id' | 'name'>;

@Injectable({ providedIn: 'root' })
export class GroupsPermissionPolicy {
  private readonly perms = inject(PermissionService);

  canView(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.GROUPS.VIEW);
  }

  canCreate(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.GROUPS.CREATE);
  }

  // row mantido pra uniformizar a assinatura com as outras policies (o chamador sempre passa a
  // linha), mesmo sem uso aqui já que essa permissão não depende do registro.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  canEdit(_row: GroupPermissionTarget): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.GROUPS.CHANGE);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- ver canEdit acima.
  canDelete(_row: GroupPermissionTarget): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.GROUPS.DELETE);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- ver canEdit acima.
  canManagePermissions(_row: GroupPermissionTarget): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.GROUPS.MANAGE_PERMISSIONS);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- ver canEdit acima.
  canManageUsers(_row: GroupPermissionTarget): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.GROUPS.MANAGE_USERS);
  }

  createDisabledReason(): string | null {
    if (!this.canCreate()) {
      return 'groups.action.create.noPermission';
    }

    return null;
  }

  editDisabledReason(row: GroupPermissionTarget): string | null {
    if (!this.canEdit(row)) {
      return 'groups.action.edit.noPermission';
    }

    return null;
  }

  deleteDisabledReason(row: GroupPermissionTarget): string | null {
    if (!this.canDelete(row)) {
      return 'groups.action.delete.noPermission';
    }

    return null;
  }
}

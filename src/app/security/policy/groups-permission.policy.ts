import { Injectable, inject } from '@angular/core';

import { PERMISSIONS } from '../../core/auth/permissions.constants';
import { PermissionService } from '../../core/auth/permission.service';

export interface GroupPermissionTarget {
  id: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class GroupsPermissionPolicy {
  private readonly perms = inject(PermissionService);

  canView(): boolean {
    return this.perms.has(PERMISSIONS.GROUPS.VIEW);
  }

  canCreate(): boolean {
    return this.perms.has(PERMISSIONS.GROUPS.CREATE);
  }

  canEdit(_row: GroupPermissionTarget): boolean {
    return this.perms.has(PERMISSIONS.GROUPS.CHANGE);
  }

  canDelete(_row: GroupPermissionTarget): boolean {
    return this.perms.has(PERMISSIONS.GROUPS.DELETE);
  }

  canManagePermissions(_row: GroupPermissionTarget): boolean {
    return this.perms.has(PERMISSIONS.GROUPS.MANAGE_PERMISSIONS);
  }
}

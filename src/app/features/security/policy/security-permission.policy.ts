import { Injectable, inject } from '@angular/core';

import { PERMISSIONS } from '@core/auth/permissions.constants';
import { PermissionService } from '@core/auth/permission.service';
import { UserStatus, normalizeUserStatus } from '@models/enums/user-status.enum';

export type BulkUserActionMode = 'activate' | 'deactivate';

export interface UserRowPermissionTarget {
  id: string;
  userName: string;
  status: UserStatus | null;
}

@Injectable({ providedIn: 'root' })
export class SecurityPermissionPolicy {
  private readonly perms = inject(PermissionService);

  canView(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.USERS.VIEW);
  }

  canCreate(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.USERS.CREATE);
  }

  canEdit(row: UserRowPermissionTarget): boolean {
    if (!this.perms.hasSupportOr(PERMISSIONS.USERS.CHANGE)) {
      return false;
    }

    if (this.isSystem(row)) {
      return false;
    }

    return true;
  }

  canActivate(row: UserRowPermissionTarget): boolean {
    if (!this.perms.hasSupportOr(PERMISSIONS.USERS.ACTIVE_OR_INACTIVE)) {
      return false;
    }

    if (this.isProtectedUser(row)) {
      return false;
    }

    const status = normalizeUserStatus(row.status);

    return status === UserStatus.INACTIVE || status === UserStatus.DISABLED;
  }

  canDeactivate(row: UserRowPermissionTarget): boolean {
    if (!this.perms.hasSupportOr(PERMISSIONS.USERS.ACTIVE_OR_INACTIVE)) {
      return false;
    }

    if (this.isCurrentUser(row)) {
      return false;
    }

    if (this.isProtectedUser(row)) {
      return false;
    }

    const status = normalizeUserStatus(row.status);

    return status === UserStatus.ACTIVE;
  }

  activateDisabledReason(row: UserRowPermissionTarget): string | null {
    if (!this.perms.hasSupportOr(PERMISSIONS.USERS.ACTIVE_OR_INACTIVE)) {
      return 'users.action.activate.noPermission';
    }

    if (this.isProtectedUser(row)) {
      return 'users.action.activate.protected';
    }

    const status = normalizeUserStatus(row.status);

    if (status !== UserStatus.INACTIVE && status !== UserStatus.DISABLED) {
      return 'users.action.activate.invalidStatus';
    }

    return null;
  }

  deactivateDisabledReason(row: UserRowPermissionTarget): string | null {
    if (!this.perms.hasSupportOr(PERMISSIONS.USERS.ACTIVE_OR_INACTIVE)) {
      return 'users.action.deactivate.noPermission';
    }

    if (this.isCurrentUser(row)) {
      return 'users.action.deactivate.self';
    }

    if (this.isProtectedUser(row)) {
      return 'users.action.deactivate.protected';
    }

    const status = normalizeUserStatus(row.status);

    if (status !== UserStatus.ACTIVE) {
      return 'users.action.deactivate.invalidStatus';
    }

    return null;
  }

  modeForRow(row: UserRowPermissionTarget): BulkUserActionMode | null {
    if (!this.perms.hasSupportOr(PERMISSIONS.USERS.ACTIVE_OR_INACTIVE)) {
      return null;
    }

    if (this.isProtectedUser(row)) {
      return null;
    }

    const status = normalizeUserStatus(row.status);

    if (status === UserStatus.ACTIVE) {
      return this.isCurrentUser(row) ? null : 'deactivate';
    }

    if (status === UserStatus.INACTIVE || status === UserStatus.DISABLED) {
      return 'activate';
    }

    return null;
  }

  canSelectForAnyBulk(row: UserRowPermissionTarget): boolean {
    return this.modeForRow(row) !== null;
  }

  canSelectForMode(row: UserRowPermissionTarget, mode: BulkUserActionMode | null): boolean {
    if (!mode) {
      return this.canSelectForAnyBulk(row);
    }

    return this.modeForRow(row) === mode;
  }

  canActivateBulk(rows: ReadonlyArray<UserRowPermissionTarget> | null | undefined): boolean {
    return !!rows?.length && rows.every((row) => this.modeForRow(row) === 'activate');
  }

  canDeactivateBulk(rows: ReadonlyArray<UserRowPermissionTarget> | null | undefined): boolean {
    return !!rows?.length && rows.every((row) => this.modeForRow(row) === 'deactivate');
  }

  private isCurrentUser(row: UserRowPermissionTarget): boolean {
    const currentUsername = this.normalize(this.perms.currentUsername());
    const rowUsername = this.normalize(row.userName);

    return !!currentUsername && !!rowUsername && currentUsername === rowUsername;
  }

  private isProtectedUser(row: UserRowPermissionTarget): boolean {
    const username = this.normalize(row.userName);

    return username === 'owner' || username === 'system';
  }

  private isSystem(row: UserRowPermissionTarget): boolean {
    return this.normalize(row.userName) === 'system';
  }

  private normalize(value: string | null | undefined): string {
    return (value ?? '').trim().toLowerCase();
  }
}

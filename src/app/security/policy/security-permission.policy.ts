import { Injectable, inject } from '@angular/core';

import { PERMISSIONS } from '../../core/auth/permissions.constants';
import { PermissionService } from '../../core/auth/permission.service';

export type BulkUserActionMode = 'activate' | 'deactivate';

/** Status numérico do NimbusAuth (ver account.profile.status1-5 no i18n): 1=Ativo 2=Inativo
 * 3=Bloqueado 4=Desativado 5=Senha pendente. Só 1<->2 é uma transição administrativa válida aqui -
 * 3/4/5 não entram no fluxo de ativar/desativar (mesmo comportamento já existente em
 * user-list.component.ts antes deste arquivo existir). */
export interface UserRowPermissionTarget {
  id: string;
  userName: string;
  status: number;
}

@Injectable({ providedIn: 'root' })
export class SecurityPermissionPolicy {
  private readonly perms = inject(PermissionService);

  canView(): boolean {
    return this.perms.has(PERMISSIONS.USERS.VIEW);
  }

  canCreate(): boolean {
    return this.perms.has(PERMISSIONS.USERS.CREATE);
  }

  canEdit(row: UserRowPermissionTarget): boolean {
    if (!this.perms.has(PERMISSIONS.USERS.CHANGE)) return false;
    return !this.isSystem(row);
  }

  canResendInvite(row: UserRowPermissionTarget): boolean {
    return this.perms.has(PERMISSIONS.USERS.RESEND_INVITE) && row.status === 5;
  }

  modeForRow(row: UserRowPermissionTarget): BulkUserActionMode | null {
    if (!this.perms.has(PERMISSIONS.USERS.ACTIVE_OR_INACTIVE)) return null;
    if (this.isProtectedUser(row)) return null;

    if (row.status === 2) return 'activate';
    if (row.status === 1) return this.isCurrentUser(row) ? null : 'deactivate';

    return null;
  }

  canActivateBulk(rows: ReadonlyArray<UserRowPermissionTarget> | null | undefined): boolean {
    return !!rows?.length && rows.every((row) => this.modeForRow(row) === 'activate');
  }

  canDeactivateBulk(rows: ReadonlyArray<UserRowPermissionTarget> | null | undefined): boolean {
    return !!rows?.length && rows.every((row) => this.modeForRow(row) === 'deactivate');
  }

  private isCurrentUser(row: UserRowPermissionTarget): boolean {
    return this.perms.isCurrentUsername(row.userName);
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

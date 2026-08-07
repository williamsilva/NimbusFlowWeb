import { Injectable, computed, inject } from '@angular/core';

import { MeStore } from './me.store';
import { Permission } from './permissions.constants';

/**
 * Mesmo padrão do CardSyncWeb (core/auth/permission.service.ts), sem o bypass hasSupportOr() - o
 * catálogo de permissões do NimbusFlow não tem um authority SUPPORT equivalente.
 */
@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly meStore = inject(MeStore);

  readonly me = computed(() => this.meStore.me());

  readonly permissionSet = computed<Set<string>>(() => {
    const permissions = this.me()?.permissions ?? [];

    return new Set(
      permissions
        .filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
        .map((p) => p.trim()),
    );
  });

  has(permission: Permission | string | null | undefined): boolean {
    if (!permission) return false;
    return this.permissionSet().has(permission);
  }

  hasAny(...permissions: Array<Permission | string | null | undefined>): boolean {
    return permissions.some((permission) => this.has(permission));
  }

  hasAll(...permissions: Array<Permission | string | null | undefined>): boolean {
    return permissions.every((permission) => this.has(permission));
  }

  currentUsername(): string | undefined {
    return this.normalize(this.me()?.username);
  }

  currentUserId(): string | undefined {
    const id = this.me()?.userId;
    return typeof id === 'string' && id.trim().length > 0 ? id.trim() : undefined;
  }

  isCurrentUsername(username: string | null | undefined): boolean {
    const current = this.currentUsername();
    const value = this.normalize(username);

    return !!current && !!value && current === value;
  }

  private normalize(value: string | null | undefined): string | undefined {
    const normalized = (value ?? '').trim().toLowerCase();
    return normalized.length > 0 ? normalized : undefined;
  }
}

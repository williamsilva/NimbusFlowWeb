import { Injectable, computed, inject } from '@angular/core';

import { MeStore } from './me.store';
import { PERMISSIONS, Permission } from './permissions.constants';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly meStore = inject(MeStore);

  readonly me = computed(() => this.meStore.me());

  readonly authoritySet = computed<Set<string>>(() => {
    const authorities = this.me()?.permissions ?? [];

    return new Set(
      authorities
        .filter((a): a is string => typeof a === 'string' && a.trim().length > 0)
        .map((a) => a.trim()),
    );
  });

  authorities(): readonly string[] {
    return this.me()?.permissions ?? [];
  }

  has(permission: Permission | string | null | undefined): boolean {
    if (!permission) return false;
    return this.authoritySet().has(permission);
  }

  hasAny(...permissions: Array<Permission | string | null | undefined>): boolean {
    return permissions.some((permission) => this.has(permission));
  }

  hasAll(...permissions: Array<Permission | string | null | undefined>): boolean {
    return permissions.every((permission) => this.has(permission));
  }

  hasSupport(): boolean {
    return this.has(PERMISSIONS.SUPPORT);
  }

  hasSupportOr(permission: Permission | string | null | undefined): boolean {
    return this.hasSupport() || this.has(permission);
  }

  hasSupportOrAny(...permissions: Array<Permission | string | null | undefined>): boolean {
    return this.hasSupport() || this.hasAny(...permissions);
  }

  hasSupportOrAll(...permissions: Array<Permission | string | null | undefined>): boolean {
    return this.hasSupport() || this.hasAll(...permissions);
  }

  can(permission: Permission | string | null | undefined): boolean {
    return this.has(permission);
  }

  canAny(...permissions: Array<Permission | string | null | undefined>): boolean {
    return this.hasAny(...permissions);
  }

  canAll(...permissions: Array<Permission | string | null | undefined>): boolean {
    return this.hasAll(...permissions);
  }

  canAccess(
    permissions: Array<Permission | string | null | undefined>,
    requireAll = false,
  ): boolean {
    if (!permissions.length) {
      return true;
    }

    return requireAll ? this.hasSupportOrAll(...permissions) : this.hasSupportOrAny(...permissions);
  }

  hasMenuAccess(
    permissions?: Array<Permission | string | null | undefined>,
    requireAll = false,
  ): boolean {
    if (!permissions?.length) {
      return true;
    }

    return this.canAccess(permissions, requireAll);
  }

  currentUsername(): string | undefined {
    return this.normalize(this.me()?.username);
  }

  currentUserId(): string | undefined {
    const id = this.me()?.userId;
    return typeof id === 'string' && id.trim().length > 0 ? id.trim() : undefined;
  }

  currentDisplayName(): string | undefined {
    const name = this.me()?.name;
    return typeof name === 'string' && name.trim().length > 0 ? name.trim() : undefined;
  }

  isCurrentUsername(username: string | null | undefined): boolean {
    const current = this.currentUsername();
    const value = this.normalize(username);

    return !!current && !!value && current === value;
  }

  isCurrentUserId(id: string | null | undefined): boolean {
    const current = this.currentUserId();
    const value = this.normalizeId(id);

    return !!current && !!value && current === value;
  }

  private normalize(value: string | null | undefined): string | undefined {
    const normalized = (value ?? '').trim().toLowerCase();
    return normalized.length > 0 ? normalized : undefined;
  }

  private normalizeId(value: string | null | undefined): string | undefined {
    const normalized = (value ?? '').trim();
    return normalized.length > 0 ? normalized : undefined;
  }
}

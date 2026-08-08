import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, UrlTree } from '@angular/router';

import { Permission } from './permissions.constants';
import { ToastService } from '../toast/toast.service';
import { PermissionService } from './permission.service';

type RoutePermissionData = {
  permissions?: Permission[];
  requireAll?: boolean;
  redirectTo?: string;
};

export const permissionGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
): boolean | UrlTree => {
  const router = inject(Router);
  const toast = inject(ToastService);
  const perms = inject(PermissionService);

  const data = (route.data ?? {}) as RoutePermissionData;
  const requiredPermissions = data.permissions ?? [];
  const requireAll = data.requireAll ?? false;
  const redirectTo = data.redirectTo ?? '/forbidden';

  if (!requiredPermissions.length) {
    return true;
  }

  const allowed = perms.canAccess(requiredPermissions, requireAll);

  if (allowed) {
    return true;
  }

  toast.warn('Acesso negado', 'Usuário não autorizado.', 4500, {
    context: 'security',
  });

  return router.parseUrl(redirectTo);
};

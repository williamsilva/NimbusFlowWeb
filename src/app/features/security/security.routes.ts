import { Routes } from '@angular/router';

import { permissionGuard } from '@core/auth/permission.guard';
import { PERMISSIONS } from '@core/auth/permissions.constants';

export const SECURITY_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'users' },
  {
    path: 'account/password',
    title: 'routes.security.accountPassword.title',
    loadComponent: () =>
      import('./account-password/account-password.component').then(
        (m) => m.AccountPasswordComponent,
      ),
  },
  {
    path: 'account/profile',
    title: 'routes.security.accountProfile.title',
    loadComponent: () => import('./profile/profile.component').then((m) => m.ProfilePageComponent),
  },
  {
    path: 'users',
    title: 'routes.security.users.title',
    canActivate: [permissionGuard],
    data: {
      requireAll: false,
      redirectTo: '/forbidden',
      permissions: [PERMISSIONS.USERS.VIEW],
    },
    loadComponent: () =>
      import('./users/users-list/users-list.component').then((m) => m.UsersListComponent),
  },
  {
    path: 'groups',
    title: 'routes.security.groups.title',
    canActivate: [permissionGuard],
    data: {
      requireAll: false,
      redirectTo: '/forbidden',
      permissions: [PERMISSIONS.GROUPS.VIEW],
    },
    loadComponent: () =>
      import('./groups/groups-list/groups-list.component').then((m) => m.GroupsListComponent),
  },
  {
    path: 'groups/:id',
    title: 'routes.security.groupDetail.title',
    canActivate: [permissionGuard],
    data: {
      requireAll: false,
      redirectTo: '/forbidden',
      permissions: [PERMISSIONS.GROUPS.VIEW],
    },
    loadComponent: () =>
      import('./groups/group-detail/group-detail.component').then((m) => m.GroupDetailComponent),
  },
  {
    path: '**',
    title: 'routes.notFound.title',
    loadComponent: () => import('../error/not-found/not-found.page').then((m) => m.NotFoundPage),
  },
];

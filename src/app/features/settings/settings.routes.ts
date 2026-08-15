import { Routes } from '@angular/router';

import { permissionGuard } from '@core/auth/permission.guard';
import { PERMISSIONS } from '@core/auth/permissions.constants';

export const SETTINGS_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'email' },
  {
    path: 'email',
    title: 'routes.settings.email.title',
    canActivate: [permissionGuard],
    data: {
      requireAll: false,
      redirectTo: '/forbidden',
      permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.SETTINGS.EMAIL_VIEW],
    },
    loadComponent: () =>
      import('./email-settings/email-settings.component').then(
        (m) => m.EmailSettingsComponent,
      ),
  },
  {
    path: 'backup',
    title: 'routes.settings.backup.title',
    canActivate: [permissionGuard],
    data: {
      requireAll: false,
      redirectTo: '/forbidden',
      permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.SETTINGS.BACKUP_PROCESS],
    },
    loadComponent: () =>
      import('./backup-settings/backup-settings.component').then(
        (m) => m.BackupSettingsComponent,
      ),
  },
  {
    path: 'approval-limits',
    title: 'routes.settings.approvalLimits.title',
    canActivate: [permissionGuard],
    data: {
      requireAll: false,
      redirectTo: '/forbidden',
      permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.SETTINGS.ALCADA_VIEW],
    },
    loadComponent: () =>
      import('./approval-limits/approval-limits-list.component').then(
        (m) => m.ApprovalLimitsListComponent,
      ),
  },
  {
    path: 'departments',
    title: 'routes.settings.departments.title',
    canActivate: [permissionGuard],
    data: {
      requireAll: false,
      redirectTo: '/forbidden',
      permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.SETTINGS.DEPARTAMENTO_VIEW],
    },
    loadComponent: () =>
      import('./departments/departments-list.component').then(
        (m) => m.DepartmentsListComponent,
      ),
  },
  {
    path: 'email-log',
    title: 'routes.settings.emailLog.title',
    canActivate: [permissionGuard],
    data: {
      requireAll: false,
      redirectTo: '/forbidden',
      permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.SETTINGS.EMAIL_LOG_VIEW],
    },
    loadComponent: () =>
      import('./email-log/email-log-list.component').then(
        (m) => m.EmailLogListComponent,
      ),
  },
  {
    path: '**',
    title: 'routes.notFound.title',
    loadComponent: () => import('../error/not-found/not-found.page').then((m) => m.NotFoundPage),
  },
];

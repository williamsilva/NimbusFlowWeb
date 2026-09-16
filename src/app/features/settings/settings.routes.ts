import { Routes } from '@angular/router';

import { permissionGuard } from '@core/auth/permission.guard';
import { PERMISSIONS } from '@core/auth/permissions.constants';

export const SETTINGS_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'approval-limits' },
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
    path: 'work-auto-complete',
    title: 'routes.settings.workAutoComplete.title',
    canActivate: [permissionGuard],
    data: {
      requireAll: false,
      redirectTo: '/forbidden',
      permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.SETTINGS.WORK_AUTO_COMPLETE_VIEW],
    },
    loadComponent: () =>
      import('./work-auto-complete-settings/work-auto-complete-settings.component').then(
        (m) => m.WorkAutoCompleteSettingsComponent,
      ),
  },
  {
    path: '**',
    title: 'routes.notFound.title',
    loadComponent: () => import('../error/not-found/not-found.page').then((m) => m.NotFoundPage),
  },
];

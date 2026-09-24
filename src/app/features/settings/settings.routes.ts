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
    path: 'cargos',
    title: 'routes.settings.cargos.title',
    canActivate: [permissionGuard],
    data: {
      requireAll: false,
      redirectTo: '/forbidden',
      permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.SETTINGS.CARGO_VIEW],
    },
    loadComponent: () =>
      import('./cargos/cargos-list.component').then((m) => m.CargosListComponent),
  },
  {
    path: 'task-locations',
    title: 'routes.settings.taskLocations.title',
    canActivate: [permissionGuard],
    data: {
      requireAll: false,
      redirectTo: '/forbidden',
      permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.SETTINGS.TASK_LOCATION_VIEW],
    },
    loadComponent: () =>
      import('./task-locations/task-locations-list.component').then(
        (m) => m.TaskLocationsListComponent,
      ),
  },
  {
    path: 'task-shift-settings',
    title: 'routes.settings.taskShiftSettings.title',
    canActivate: [permissionGuard],
    data: {
      requireAll: false,
      redirectTo: '/forbidden',
      permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.SETTINGS.TASK_SHIFT_SETTINGS_VIEW],
    },
    loadComponent: () =>
      import('./task-shift-settings/task-shift-settings.component').then(
        (m) => m.TaskShiftSettingsComponent,
      ),
  },
  {
    path: 'task-templates',
    title: 'routes.settings.taskTemplates.title',
    canActivate: [permissionGuard],
    data: {
      requireAll: false,
      redirectTo: '/forbidden',
      permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.SETTINGS.TASK_TEMPLATE_VIEW],
    },
    loadComponent: () =>
      import('./task-templates/task-templates-settings.component').then(
        (m) => m.TaskTemplatesSettingsComponent,
      ),
  },
  {
    path: 'work-auto-complete',
    title: 'routes.settings.workAutoComplete.title',
    canActivate: [permissionGuard],
    data: {
      requireAll: false,
      redirectTo: '/forbidden',
      permissions: [
        PERMISSIONS.SUPPORT,
        PERMISSIONS.SETTINGS.WORK_AUTO_COMPLETE_VIEW,
        PERMISSIONS.SETTINGS.PROJECT_AUTO_COMPLETE_VIEW,
        PERMISSIONS.SETTINGS.SUPPLIER_AUTO_DEACTIVATE_VIEW,
      ],
    },
    loadComponent: () =>
      import('./work-auto-complete-settings/work-auto-complete-settings.component').then(
        (m) => m.WorkAutoCompleteSettingsComponent,
      ),
  },
  {
    path: 'company',
    title: 'routes.settings.company.title',
    canActivate: [permissionGuard],
    data: {
      requireAll: false,
      redirectTo: '/forbidden',
      permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.SETTINGS.COMPANY_VIEW],
    },
    loadComponent: () =>
      import('./company-settings/company-settings-page.component').then(
        (m) => m.CompanySettingsPageComponent,
      ),
  },
  {
    path: '**',
    title: 'routes.notFound.title',
    loadComponent: () => import('../error/not-found/not-found.page').then((m) => m.NotFoundPage),
  },
];

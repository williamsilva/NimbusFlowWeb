import { Routes } from '@angular/router';

import { authGuard } from '@core/auth/auth.guard';
import { LayoutComponent } from '@layout/layout.component';

export const appRoutes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

      {
        path: 'dashboard',
        title: 'routes.dashboard.title',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },

      {
        path: 'security',
        loadChildren: () =>
          import('./features/security/security.routes').then((m) => m.SECURITY_ROUTES),
      },

      {
        path: 'settings',
        loadChildren: () =>
          import('./features/settings/settings.routes').then((m) => m.SETTINGS_ROUTES),
      },

      // Fornecedor / Obra / Sugestão (com.nimbusflow.works no backend) - leitura é aberta a
      // qualquer usuário autenticado (ver SupplierService/WorkService/SuggestionService no
      // NimbusFlowServer), por isso não há permissionGuard aqui (diferente de users/groups).
      {
        path: 'suppliers',
        title: 'routes.suppliers.title',
        loadComponent: () =>
          import('./features/suppliers/suppliers-list/suppliers-list.component').then(
            (m) => m.SuppliersListComponent,
          ),
      },

      {
        path: 'projects',
        title: 'routes.projects.title',
        loadComponent: () =>
          import('./features/projects/projects-list.component').then(
            (m) => m.ProjectsListComponent,
          ),
      },

      {
        path: 'works',
        title: 'routes.works.title',
        loadComponent: () =>
          import('./features/works/works-list/works-list.component').then(
            (m) => m.WorksListComponent,
          ),
      },

      {
        path: 'addendums',
        title: 'routes.addendums.title',
        loadComponent: () =>
          import('./features/works/addendums/all-addendums-list.component').then(
            (m) => m.AllAddendumsListComponent,
          ),
      },

      {
        path: 'installments',
        title: 'routes.installments.title',
        loadComponent: () =>
          import('./features/works/installments/all-installments-list.component').then(
            (m) => m.AllInstallmentsListComponent,
          ),
      },

      {
        path: 'works/:workId/addendums',
        title: 'routes.works.addendums.title',
        loadComponent: () =>
          import('./features/works/addendums/addendums-list.component').then(
            (m) => m.AddendumsListComponent,
          ),
      },

      {
        path: 'works/:workId/installments',
        title: 'routes.works.installments.title',
        loadComponent: () =>
          import('./features/works/installments/installments-list.component').then(
            (m) => m.InstallmentsListComponent,
          ),
      },

      {
        path: 'works/:workId/measurements',
        title: 'routes.works.measurements.title',
        loadComponent: () =>
          import('./features/works/measurements/measurements-list.component').then(
            (m) => m.MeasurementsListComponent,
          ),
      },

      {
        path: 'measurements',
        title: 'routes.measurements.title',
        loadComponent: () =>
          import('./features/works/measurements/all-measurements-list.component').then(
            (m) => m.AllMeasurementsListComponent,
          ),
      },

      {
        path: 'suggestions',
        title: 'routes.suggestions.title',
        loadComponent: () =>
          import('./features/suggestions/suggestions-list/suggestions-list.component').then(
            (m) => m.SuggestionsListComponent,
          ),
      },

      {
        path: 'forbidden',
        title: 'routes.forbidden.title',
        loadComponent: () =>
          import('./features/error/forbidden/forbidden.page').then((m) => m.ForbiddenPage),
      },

      {
        path: 'not-found',
        title: 'routes.notFound.title',
        loadComponent: () =>
          import('./features/error/not-found/not-found.page').then((m) => m.NotFoundPage),
      },

      {
        path: '**',
        title: 'routes.notFound.title',
        loadComponent: () =>
          import('./features/error/not-found/not-found.page').then((m) => m.NotFoundPage),
      },
    ],
  },
];

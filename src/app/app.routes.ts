import { Routes } from '@angular/router';

import { authGuard } from '@core/auth/auth.guard';
import { permissionGuard } from '@core/auth/permission.guard';
import { PERMISSIONS } from '@core/auth/permissions.constants';
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

      // Fornecedor / Projeto / Obra / Aditivo / Parcela / Medição / Sugestão (com.nimbusflow.works
      // no backend) - cada tela exige sua própria permissão de visualização (*_CONSULT), mesmo
      // padrão de Segurança (ver security.routes.ts) e da cadeia Chamado/Plano/Tarefa abaixo.
      {
        path: 'suppliers',
        title: 'routes.suppliers.title',
        canActivate: [permissionGuard],
        data: {
          requireAll: false,
          redirectTo: '/forbidden',
          permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.FORNECEDOR.VIEW],
        },
        loadComponent: () =>
          import('./features/suppliers/suppliers-list/suppliers-list.component').then(
            (m) => m.SuppliersListComponent,
          ),
      },

      {
        path: 'projects',
        title: 'routes.projects.title',
        canActivate: [permissionGuard],
        data: {
          requireAll: false,
          redirectTo: '/forbidden',
          permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.PROJETO.VIEW],
        },
        loadComponent: () =>
          import('./features/projects/projects-list.component').then(
            (m) => m.ProjectsListComponent,
          ),
      },

      {
        path: 'works',
        title: 'routes.works.title',
        canActivate: [permissionGuard],
        data: {
          requireAll: false,
          redirectTo: '/forbidden',
          permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.OBRA.VIEW],
        },
        loadComponent: () =>
          import('./features/works/works-list/works-list.component').then(
            (m) => m.WorksListComponent,
          ),
      },

      {
        path: 'addendums',
        title: 'routes.addendums.title',
        canActivate: [permissionGuard],
        data: {
          requireAll: false,
          redirectTo: '/forbidden',
          permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.ADITIVO.VIEW],
        },
        loadComponent: () =>
          import('./features/works/addendums/all-addendums-list.component').then(
            (m) => m.AllAddendumsListComponent,
          ),
      },

      {
        path: 'installments',
        title: 'routes.installments.title',
        canActivate: [permissionGuard],
        data: {
          requireAll: false,
          redirectTo: '/forbidden',
          permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.PARCELA.VIEW],
        },
        loadComponent: () =>
          import('./features/works/installments/all-installments-list.component').then(
            (m) => m.AllInstallmentsListComponent,
          ),
      },

      {
        path: 'works/:workId/addendums',
        title: 'routes.works.addendums.title',
        canActivate: [permissionGuard],
        data: {
          requireAll: false,
          redirectTo: '/forbidden',
          permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.ADITIVO.VIEW],
        },
        loadComponent: () =>
          import('./features/works/addendums/addendums-list.component').then(
            (m) => m.AddendumsListComponent,
          ),
      },

      {
        path: 'works/:workId/installments',
        title: 'routes.works.installments.title',
        canActivate: [permissionGuard],
        data: {
          requireAll: false,
          redirectTo: '/forbidden',
          permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.PARCELA.VIEW],
        },
        loadComponent: () =>
          import('./features/works/installments/installments-list.component').then(
            (m) => m.InstallmentsListComponent,
          ),
      },

      {
        path: 'works/:workId/measurements',
        title: 'routes.works.measurements.title',
        canActivate: [permissionGuard],
        data: {
          requireAll: false,
          redirectTo: '/forbidden',
          permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.MEDICAO.VIEW],
        },
        loadComponent: () =>
          import('./features/works/measurements/measurements-list.component').then(
            (m) => m.MeasurementsListComponent,
          ),
      },

      {
        path: 'measurements',
        title: 'routes.measurements.title',
        canActivate: [permissionGuard],
        data: {
          requireAll: false,
          redirectTo: '/forbidden',
          permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.MEDICAO.VIEW],
        },
        loadComponent: () =>
          import('./features/works/measurements/all-measurements-list.component').then(
            (m) => m.AllMeasurementsListComponent,
          ),
      },

      {
        path: 'suggestions',
        title: 'routes.suggestions.title',
        canActivate: [permissionGuard],
        data: {
          requireAll: false,
          redirectTo: '/forbidden',
          permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.SUGESTAO.VIEW],
        },
        loadComponent: () =>
          import('./features/suggestions/suggestions-list/suggestions-list.component').then(
            (m) => m.SuggestionsListComponent,
          ),
      },

      // Cadeia 5W2H Chamado -> Plano de Ação -> Tarefa (com.nimbusflow.tickets/actionplans/tasks
      // no backend) - cada tela exige sua própria permissão de visualização (CHAMADO_CONSULT/
      // PLANO_ACAO_CONSULT/TAREFA_CONSULT), mesmo padrão de Segurança (ver security.routes.ts).
      // /tasks e a rota aninhada abaixo aceitam TAREFA_CONSULT OU TAREFA_EXECUTE - quem só executa
      // as próprias tarefas continua conseguindo abrir a tela pra ver/mover o que é atribuído a
      // ele (ver TaskService#findMine no backend).
      {
        path: 'tickets',
        title: 'routes.tickets.title',
        canActivate: [permissionGuard],
        data: {
          requireAll: false,
          redirectTo: '/forbidden',
          permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.CHAMADO.VIEW],
        },
        loadComponent: () =>
          import('./features/tickets/tickets-list/tickets-list.component').then(
            (m) => m.TicketsListComponent,
          ),
      },

      {
        path: 'action-plans',
        title: 'routes.actionPlans.title',
        canActivate: [permissionGuard],
        data: {
          requireAll: false,
          redirectTo: '/forbidden',
          permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.PLANO_ACAO.VIEW],
        },
        loadComponent: () =>
          import('./features/action-plans/action-plans-list/action-plans-list.component').then(
            (m) => m.ActionPlansListComponent,
          ),
      },

      {
        path: 'action-plans/:actionPlanId/tasks',
        title: 'routes.actionPlans.tasks.title',
        canActivate: [permissionGuard],
        data: {
          requireAll: false,
          redirectTo: '/forbidden',
          permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.TAREFA.VIEW, PERMISSIONS.TAREFA.EXECUTE],
        },
        loadComponent: () =>
          import('./features/tasks/tasks-list/tasks-list.component').then(
            (m) => m.TasksListComponent,
          ),
      },

      {
        path: 'tasks',
        title: 'routes.tasks.title',
        canActivate: [permissionGuard],
        data: {
          requireAll: false,
          redirectTo: '/forbidden',
          permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.TAREFA.VIEW, PERMISSIONS.TAREFA.EXECUTE],
        },
        loadComponent: () =>
          import('./features/tasks/all-tasks-list/all-tasks-list.component').then(
            (m) => m.AllTasksListComponent,
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

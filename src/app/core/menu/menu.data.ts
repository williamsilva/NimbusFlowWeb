import { PERMISSIONS } from '@core/auth/permissions.constants';

import { AppMenuItem } from './menu.model';

export const APP_MENU: AppMenuItem[] = [
  {
    icon: 'pi pi-home text-blue-600',
    labelKey: 'menu.dashboard',
    route: '/dashboard',
    exact: true,
  },
  /* Cadeia 5W2H Chamado -> Plano de Ação -> Tarefa (com.nimbusflow.tickets/actionplans/tasks) -
   * itens soltos (sem submenu), acima do grupo Fornecedor/Obra/Sugestão a pedido do usuário. Cada
   * um exige sua própria permissão de visualização, mesma lista de `permissions` da rota
   * correspondente (ver app.routes.ts). Tarefas aceita VIEW ou EXECUTE - quem só executa as
   * próprias tarefas continua vendo o item de menu. */
  {
    labelKey: 'menu.works.tickets',
    icon: 'pi pi-megaphone text-orange-600',
    route: '/tickets',
    exact: false,
    permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.CHAMADO.VIEW],
  },
  {
    labelKey: 'menu.works.actionPlans',
    icon: 'pi pi-map text-purple-600',
    route: '/action-plans',
    exact: false,
    permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.PLANO_ACAO.VIEW],
  },
  {
    labelKey: 'menu.works.tasks',
    icon: 'pi pi-check-square text-teal-600',
    route: '/tasks',
    exact: false,
    permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.TAREFA.VIEW, PERMISSIONS.TAREFA.EXECUTE],
  },
  /* Fornecedor / Sugestão - leitura aberta a qualquer usuário autenticado, por isso esses itens
   * não declaram `permissions` (undefined/[] = visível pra todo mundo, ver
   * PermissionService.hasMenuAccess). Obra é exceção dentro deste mesmo grupo - exige
   * OBRA_CONSULT, ver seu próprio item abaixo. */
  {
    icon: 'pi pi-building text-green-600',
    labelKey: 'menu.works.title',
    children: [
      {
        labelKey: 'menu.works.suppliers',
        icon: 'pi pi-truck text-green-400',
        route: '/suppliers',
        exact: false,
      },
      {
        labelKey: 'menu.works.projects',
        icon: 'pi pi-briefcase text-green-400',
        route: '/projects',
        exact: false,
      },
      {
        labelKey: 'menu.works.works',
        icon: 'pi pi-building text-green-400',
        route: '/works',
        exact: false,
        permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.OBRA.VIEW],
      },
      {
        labelKey: 'menu.works.addendums',
        icon: 'pi pi-file text-green-400',
        route: '/addendums',
        exact: false,
      },
      {
        labelKey: 'menu.works.installments',
        icon: 'pi pi-wallet text-green-400',
        route: '/installments',
        exact: false,
      },
      {
        labelKey: 'menu.works.measurements',
        icon: 'pi pi-camera text-green-400',
        route: '/measurements',
        exact: false,
      },
      {
        labelKey: 'menu.works.suggestions',
        icon: 'pi pi-lightbulb text-green-400',
        route: '/suggestions',
        exact: false,
      },
    ],
  },
  /* Security */
  {
    icon: 'pi pi-shield text-red-600',
    labelKey: 'menu.security.title',
    children: [
      {
        labelKey: 'menu.security.users',
        icon: 'pi pi-user text-red-400',
        route: '/security/users',
        exact: false,
        permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.USERS.VIEW],
      },
      {
        labelKey: 'menu.security.groups',
        icon: 'pi pi-id-card text-red-400',
        route: '/security/groups',
        exact: false,
        permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.GROUPS.VIEW],
      },
    ],
  },
  /* Settings — cor slate */
  {
    icon: 'pi pi-cog text-slate-600',
    labelKey: 'menu.settings.title',
    children: [
      {
        exact: false,
        route: '/settings/email',
        labelKey: 'menu.settings.email',
        icon: 'pi pi-envelope text-slate-400',
        permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.SETTINGS.EMAIL_VIEW],
      },
      {
        exact: false,
        route: '/settings/backup',
        labelKey: 'menu.settings.backup',
        icon: 'pi pi-database text-slate-400',
        permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.SETTINGS.BACKUP_PROCESS],
      },
      {
        exact: false,
        route: '/settings/approval-limits',
        labelKey: 'menu.settings.approvalLimits',
        icon: 'pi pi-percentage text-slate-400',
        permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.SETTINGS.ALCADA_VIEW],
      },
      {
        exact: false,
        route: '/settings/departments',
        labelKey: 'menu.settings.departments',
        icon: 'pi pi-sitemap text-slate-400',
        permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.SETTINGS.DEPARTAMENTO_VIEW],
      },
      {
        exact: false,
        route: '/settings/email-log',
        labelKey: 'menu.settings.emailLog',
        icon: 'pi pi-history text-slate-400',
        permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.SETTINGS.EMAIL_LOG_VIEW],
      },
    ],
  },
];

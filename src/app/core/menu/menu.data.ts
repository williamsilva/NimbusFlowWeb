import { PERMISSIONS } from '@core/auth/permissions.constants';

import { AppMenuItem } from './menu.model';

export const APP_MENU: AppMenuItem[] = [
  /* Dashboard virou dropdown com 1 sub-item por domínio (pedido do usuário 2026-09-21, separação
   * dos dashboards de Obras/Chamados/Tarefas/Planos de Ação) - cada filho exige sua própria
   * permissão de visualização, mesma lista de `permissions` da rota correspondente (ver
   * app.routes.ts). */
  {
    icon: 'pi pi-home text-blue-600',
    labelKey: 'menu.dashboard.title',
    children: [
      {
        labelKey: 'menu.dashboard.works',
        icon: 'pi pi-building text-blue-400',
        route: '/dashboard/works',
        exact: false,
        permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.OBRA.VIEW],
      },
      {
        labelKey: 'menu.dashboard.tickets',
        icon: 'pi pi-megaphone text-blue-400',
        route: '/dashboard/tickets',
        exact: false,
        permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.CHAMADO.VIEW],
      },
      {
        labelKey: 'menu.dashboard.tasks',
        icon: 'pi pi-check-square text-blue-400',
        route: '/dashboard/tasks',
        exact: false,
        permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.TAREFA.VIEW, PERMISSIONS.TAREFA.EXECUTE],
      },
      {
        labelKey: 'menu.dashboard.actionPlans',
        icon: 'pi pi-map text-blue-400',
        route: '/dashboard/action-plans',
        exact: false,
        permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.PLANO_ACAO.VIEW],
      },
    ],
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
  /* Tasks */
  {
    labelKey: 'menu.works.tasks',
    icon: 'pi pi-check-square text-teal-600',
    route: '/tasks',
    exact: false,
    permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.TAREFA.VIEW, PERMISSIONS.TAREFA.EXECUTE],
  },
  /* Works */
  /* Fornecedor / Projeto / Obra / Aditivo / Parcela / Medição / Sugestão - cada item exige sua
   * própria permissão de visualização (*_CONSULT), mesma lista de `permissions` da rota
   * correspondente (ver app.routes.ts). */
  {
    icon: 'pi pi-building text-green-600',
    labelKey: 'menu.works.title',
    children: [
      {
        labelKey: 'menu.works.suppliers',
        icon: 'pi pi-truck text-green-400',
        route: '/suppliers',
        exact: false,
        permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.FORNECEDOR.VIEW],
      },
      {
        labelKey: 'menu.works.projects',
        icon: 'pi pi-briefcase text-green-400',
        route: '/projects',
        exact: false,
        permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.PROJETO.VIEW],
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
        permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.ADITIVO.VIEW],
      },
      {
        labelKey: 'menu.works.measurements',
        icon: 'pi pi-camera text-green-400',
        route: '/measurements',
        exact: false,
        permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.MEDICAO.VIEW],
      },
      {
        labelKey: 'menu.works.installments',
        icon: 'pi pi-wallet text-green-400',
        route: '/installments',
        exact: false,
        permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.PARCELA.VIEW],
      },
      {
        labelKey: 'menu.works.payments',
        icon: 'pi pi-money-bill text-green-400',
        route: '/payments',
        exact: false,
        permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.PARCELA.VIEW],
      },
      {
        labelKey: 'menu.works.suggestions',
        icon: 'pi pi-lightbulb text-green-400',
        route: '/suggestions',
        exact: false,
        permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.SUGESTAO.VIEW],
      },
    ],
  },
  /* Patrimônio (com.nimbusflow.patrimonio) - Equipamento/Manutenção/Agenda de Manutenção
   * Preventiva/Localização/Histórico de Localização, migrado do sistema legado NimbusNovax. Cada
   * item exige sua própria permissão de visualização (*_CONSULT), mesmo padrão do restante do
   * menu. Dashboard usa a mesma permissão de Equipamentos (sem permissão própria). */
  {
    icon: 'pi pi-box text-orange-600',
    labelKey: 'menu.patrimonio.title',
    children: [
      {
        labelKey: 'menu.patrimonio.equipamentos',
        icon: 'pi pi-desktop text-orange-400',
        route: '/equipamentos',
        exact: false,
        permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.EQUIPAMENTO.VIEW],
      },
      {
        labelKey: 'menu.patrimonio.manutencoes',
        icon: 'pi pi-wrench text-orange-400',
        route: '/manutencoes',
        exact: false,
        permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.MANUTENCAO.VIEW],
      },
      {
        labelKey: 'menu.patrimonio.agendaManutencao',
        icon: 'pi pi-calendar-clock text-orange-400',
        route: '/agenda-manutencao',
        exact: false,
        permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.AGENDA_MANUTENCAO.VIEW],
      },
      {
        labelKey: 'menu.patrimonio.localizacoes',
        icon: 'pi pi-map-marker text-orange-400',
        route: '/localizacoes',
        exact: false,
        permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.LOCALIZACAO.VIEW],
      },
      {
        labelKey: 'menu.patrimonio.historicoLocalizacao',
        icon: 'pi pi-history text-orange-400',
        route: '/historico-localizacao',
        exact: false,
        permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.HISTORICO_LOCALIZACAO.VIEW],
      },
      {
        labelKey: 'menu.patrimonio.dashboard',
        icon: 'pi pi-chart-bar text-orange-400',
        route: '/patrimonio/dashboard',
        exact: false,
        permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.EQUIPAMENTO.VIEW],
      },
    ],
  },
  /* Settings — cor indigo */
  {
    icon: 'pi pi-cog text-indigo-600',
    labelKey: 'menu.settings.title',
    children: [
      {
        exact: false,
        route: '/settings/approval-limits',
        labelKey: 'menu.settings.approvalLimits',
        icon: 'pi pi-percentage text-indigo-400',
        permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.SETTINGS.ALCADA_VIEW],
      },
      {
        exact: false,
        route: '/settings/departments',
        labelKey: 'menu.settings.departments',
        icon: 'pi pi-sitemap text-indigo-400',
        permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.SETTINGS.DEPARTAMENTO_VIEW],
      },
      {
        exact: false,
        route: '/settings/cargos',
        labelKey: 'menu.settings.cargos',
        icon: 'pi pi-id-card text-indigo-400',
        permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.SETTINGS.CARGO_VIEW],
      },
      {
        exact: false,
        route: '/settings/task-locations',
        labelKey: 'menu.settings.taskLocations',
        icon: 'pi pi-map-marker text-orange-400',
        permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.SETTINGS.TASK_LOCATION_VIEW],
      },
      {
        exact: false,
        route: '/settings/task-templates',
        labelKey: 'menu.settings.taskTemplates',
        icon: 'pi pi-list-check text-indigo-400',
        permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.SETTINGS.TASK_TEMPLATE_VIEW],
      },
      {
        exact: false,
        route: '/settings/work-auto-complete',
        labelKey: 'menu.settings.workAutoComplete',
        icon: 'pi pi-clock text-indigo-400',
        permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.SETTINGS.WORK_AUTO_COMPLETE_VIEW],
      },
      {
        exact: false,
        route: '/settings/company',
        labelKey: 'menu.settings.company',
        icon: 'pi pi-building text-indigo-400',
        permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.SETTINGS.COMPANY_VIEW],
      },
    ],
  },
];

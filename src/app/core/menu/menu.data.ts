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
        labelKey: 'menu.works.paymentOrders',
        icon: 'pi pi-send text-green-400',
        route: '/payment-orders',
        exact: false,
        permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.PARCELA.ENVIAR_ORDEM],
      },
      {
        labelKey: 'menu.works.installments',
        icon: 'pi pi-wallet text-green-400',
        route: '/installments',
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
  /* Settings — cor indigo */
  {
    icon: 'pi pi-cog text-indigo-600',
    labelKey: 'menu.settings.title',
    children: [
      {
        exact: false,
        route: '/settings/email',
        labelKey: 'menu.settings.email',
        icon: 'pi pi-envelope text-indigo-400',
        permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.SETTINGS.EMAIL_VIEW],
      },
      {
        exact: false,
        route: '/settings/backup',
        labelKey: 'menu.settings.backup',
        icon: 'pi pi-database text-indigo-400',
        permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.SETTINGS.BACKUP_PROCESS],
      },
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
        route: '/settings/email-log',
        labelKey: 'menu.settings.emailLog',
        icon: 'pi pi-history text-indigo-400',
        permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.SETTINGS.EMAIL_LOG_VIEW],
      },
      {
        exact: false,
        route: '/settings/work-auto-complete',
        labelKey: 'menu.settings.workAutoComplete',
        icon: 'pi pi-clock text-indigo-400',
        permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.SETTINGS.WORK_AUTO_COMPLETE_VIEW],
      },
    ],
  },
];

export const STATE_KEY = {
  NIMBUSFLOW: {
    /* Segurança */
    SECURITY: {
      USERS: {
        TABLE: {
          ROWS: { V1: 'users.table.rows' },
          STATE: { V1: 'nimbusflow.users.table.state.v1' },
        },
        FILTERS: { V1: 'nimbusflow.users.filters.v1' },
      },
      GROUPS: {
        TABLE: {
          ROWS: { V1: 'groups.table.rows' },
          STATE: { V1: 'nimbusflow.groups.table.state.v1' },
        },
        FILTERS: { V1: 'nimbusflow.groups.filters.v1' },
      },
    },

    /* Fornecedor / Obra / Sugestão (com.nimbusflow.works no backend) */
    WORKS: {
      SUPPLIERS: {
        TABLE: {
          ROWS: { V1: 'suppliers.table.rows' },
          STATE: { V1: 'nimbusflow.suppliers.table.state.v1' },
        },
        FILTERS: { V1: 'nimbusflow.suppliers.filters.v1' },
      },
      WORKS: {
        TABLE: {
          ROWS: { V1: 'works.table.rows' },
          STATE: { V1: 'nimbusflow.works.table.state.v1' },
        },
        FILTERS: { V1: 'nimbusflow.works.filters.v1' },
      },
      PROJECTS: {
        TABLE: {
          ROWS: { V1: 'projects.table.rows' },
          STATE: { V1: 'nimbusflow.projects.table.state.v1' },
        },
        FILTERS: { V1: 'nimbusflow.projects.filters.v1' },
      },
      SUGGESTIONS: {
        TABLE: {
          ROWS: { V1: 'suggestions.table.rows' },
          STATE: { V1: 'nimbusflow.suggestions.table.state.v1' },
        },
        FILTERS: { V1: 'nimbusflow.suggestions.filters.v1' },
      },
      ADDENDUMS: {
        TABLE: {
          STATE: { V1: 'nimbusflow.addendums.table.state.v1' },
        },
      },
      INSTALLMENTS: {
        TABLE: {
          STATE: { V1: 'nimbusflow.installments.table.state.v1' },
        },
      },
      ALL_ADDENDUMS: {
        TABLE: {
          ROWS: { V1: 'all-addendums.table.rows' },
          STATE: { V1: 'nimbusflow.all-addendums.table.state.v1' },
        },
        FILTERS: { V1: 'nimbusflow.all-addendums.filters.v1' },
      },
      ALL_INSTALLMENTS: {
        TABLE: {
          ROWS: { V1: 'all-installments.table.rows' },
          STATE: { V1: 'nimbusflow.all-installments.table.state.v1' },
        },
        FILTERS: { V1: 'nimbusflow.all-installments.filters.v1' },
      },
      MEASUREMENTS: {
        TABLE: {
          STATE: { V1: 'nimbusflow.measurements.table.state.v1' },
        },
      },
      ALL_MEASUREMENTS: {
        TABLE: {
          ROWS: { V1: 'all-measurements.table.rows' },
          STATE: { V1: 'nimbusflow.all-measurements.table.state.v1' },
        },
        FILTERS: { V1: 'nimbusflow.all-measurements.filters.v1' },
      },

      /* Cadeia 5W2H: Chamado -> Plano de Ação -> Tarefa (com.nimbusflow.tickets/actionplans/tasks) */
      TICKETS: {
        TABLE: {
          ROWS: { V1: 'tickets.table.rows' },
          STATE: { V1: 'nimbusflow.tickets.table.state.v1' },
        },
        FILTERS: { V1: 'nimbusflow.tickets.filters.v1' },
      },
      ACTION_PLANS: {
        TABLE: {
          ROWS: { V1: 'action-plans.table.rows' },
          STATE: { V1: 'nimbusflow.action-plans.table.state.v1' },
        },
        FILTERS: { V1: 'nimbusflow.action-plans.filters.v1' },
      },
      TASKS: {
        TABLE: {
          STATE: { V1: 'nimbusflow.tasks.table.state.v1' },
        },
      },
      ALL_TASKS: {
        TABLE: {
          ROWS: { V1: 'all-tasks.table.rows' },
          STATE: { V1: 'nimbusflow.all-tasks.table.state.v1' },
        },
        FILTERS: { V1: 'nimbusflow.all-tasks.filters.v1' },
      },
    },
  },
};

export const STATE_KEY = {
  NIMBUSFLOW_SECURITY: {
    /* Segurança */
    SECURITY: {
      USERS: {
        TABLE: {
          ROWS: { V1: 'users.table.rows' },
          STATE: { V1: 'nimbusflow-security.users.table.state.v1' },
        },
        FILTERS: { V1: 'nimbusflow-security.users.filters.v1' },
      },
      GROUPS: {
        TABLE: {
          ROWS: { V1: 'groups.table.rows' },
          STATE: { V1: 'nimbusflow-security.groups.table.state.v1' },
        },
        FILTERS: { V1: 'nimbusflow-security.groups.filters.v1' },
      },
    },

    /* Fornecedor / Obra / Sugestão (com.nimbusflow.works no backend) */
    WORKS: {
      SUPPLIERS: {
        TABLE: {
          ROWS: { V1: 'suppliers.table.rows' },
          STATE: { V1: 'nimbusflow-security.suppliers.table.state.v1' },
        },
        FILTERS: { V1: 'nimbusflow-security.suppliers.filters.v1' },
      },
      WORKS: {
        TABLE: {
          ROWS: { V1: 'works.table.rows' },
          STATE: { V1: 'nimbusflow-security.works.table.state.v1' },
        },
        FILTERS: { V1: 'nimbusflow-security.works.filters.v1' },
      },
      SUGGESTIONS: {
        TABLE: {
          ROWS: { V1: 'suggestions.table.rows' },
          STATE: { V1: 'nimbusflow-security.suggestions.table.state.v1' },
        },
        FILTERS: { V1: 'nimbusflow-security.suggestions.filters.v1' },
      },
    },
  },
};

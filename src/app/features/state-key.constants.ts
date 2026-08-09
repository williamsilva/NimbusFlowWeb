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
      SUGGESTIONS: {
        TABLE: {
          ROWS: { V1: 'suggestions.table.rows' },
          STATE: { V1: 'nimbusflow.suggestions.table.state.v1' },
        },
        FILTERS: { V1: 'nimbusflow.suggestions.filters.v1' },
      },
    },
  },
};

/**
 * Nomes de permissão do catálogo do NimbusAuth escopados a app_key=nimbusflow (ver migration de
 * seed no NimbusAuth). Mesmo padrão do CardSyncWeb (core/auth/permissions.constants.ts), reduzido
 * ao que o NimbusFlow realmente tem hoje - sem GROUPS_MANAGEMENT_USER (o NimbusFlow decidiu não
 * gerenciar usuários pelo lado do grupo, só pelo formulário de usuário) nem um authority SUPPORT
 * (bypass de super-admin, conceito que não existe no catálogo do NimbusFlow).
 */
export const PERMISSIONS = {
  USERS: {
    VIEW: 'USERS_CONSULT',
    CREATE: 'USERS_CREATE',
    CHANGE: 'USERS_CHANGE',
    ACTIVE_OR_INACTIVE: 'USERS_ACTIVE_OR_INACTIVE',
    RESEND_INVITE: 'USERS_RESEND_INVITE',
  },

  GROUPS: {
    VIEW: 'GROUPS_CONSULT',
    CREATE: 'GROUPS_CREATE',
    CHANGE: 'GROUPS_CHANGE',
    DELETE: 'GROUPS_DELETE',
    MANAGE_PERMISSIONS: 'GROUPS_MANAGEMENT_PERMISSION',
  },
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS][keyof (typeof PERMISSIONS)[keyof typeof PERMISSIONS]];

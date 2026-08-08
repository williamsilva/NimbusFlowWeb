export interface BffMeResponse {
  iss?: string;
  name?: string;
  email?: string;
  userId?: string;
  username?: string;
  authenticated?: boolean;
  expiresAt: string | null;

  groups?: string[];
  // NimbusFlowServer (BffMeController.MeResponse) chama esse campo de "permissions", não
  // "authorities" como no CardsyncServer - nome diferente, mesmo conteúdo (lista de PERM_* sem
  // o prefixo).
  permissions?: string[];
}

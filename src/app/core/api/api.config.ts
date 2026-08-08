import { environment } from '../../../environments/environment';

export const API = {
  bffBaseUrl: environment.bffBaseUrl,
  apiBaseUrl: environment.apiBaseUrl,

  // ✅ prefixos fixos
  bff: `${environment.bffBaseUrl}/bff`,
  api: `${environment.apiBaseUrl}/api`,
} as const;

// Identifica este app perante o catálogo de grupos/permissões do NimbusAuth, compartilhado
// entre todos os apps Nimbus (ver PermissionEntity/GroupEntity.appKey) - usado pra filtrar os
// seletores de grupo/permissão pra só mostrar o que pertence a este app.
export const APP_KEY = 'nimbusflow';

// Deploy de produção real (Railway) — mesmo padrão de CardSyncWeb/CardsyncServer.
// bffBaseUrl/apiBaseUrl apontam pro NimbusFlowServer publicado em flow-api.nimbussystems.com.br.
export const environment = {
  production: true,
  bffBaseUrl: 'https://flow-api.nimbussystems.com.br',
  apiBaseUrl: 'https://flow-api.nimbussystems.com.br',
  // PLACEHOLDER - trocar pela chave pública do par VAPID de produção antes de habilitar push de
  // verdade (gerar um par novo, nunca reaproveitar o de dev - ver .env.example/application-
  // prod.yml no NimbusFlowServer). Não é segredo (só a privada é), mas precisa ser a MESMA chave
  // configurada no backend - com valores divergentes o subscribe() do browser funciona mas o
  // backend rejeita o envio (par de chaves incompatível).
  vapidPublicKey: '',
}

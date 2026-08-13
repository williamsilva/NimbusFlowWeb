// Deploy de produção real (Railway) — mesmo padrão de CardSyncWeb/CardsyncServer.
// bffBaseUrl/apiBaseUrl apontam pro NimbusFlowServer publicado em flow-api.nimbussystems.com.br.
export const environment = {
  production: true,
  bffBaseUrl: 'https://flow-api.nimbussystems.com.br',
  apiBaseUrl: 'https://flow-api.nimbussystems.com.br',
  // Chave pública do par VAPID de produção (gerado à parte, nunca reaproveita o de dev - ver
  // .env.example/application-prod.yml no NimbusFlowServer). Não é segredo (só a privada é), mas
  // precisa ser a MESMA chave configurada no backend via VAPID_PUBLIC_KEY (Railway) - com
  // valores divergentes o subscribe() do browser funciona mas o backend rejeita o envio (par de
  // chaves incompatível).
  vapidPublicKey:
    'BB_Q1Wx9g-kTPdKhxEFclCDY-shInF1YPVZvhAs7KNeHd8xUACRMzMcthMx8g6428KX85pvHsyxHndlIpGas7GM',
}

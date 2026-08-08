// NimbusFlowServer ainda não tem deploy de produção real (só dev/docker-compose local na porta
// 9092, ver docker-compose.yml na raiz de NimbusFlow) - por isso a build "production" (usada pelo
// Dockerfile deste projeto pro stack local) aponta pra localhost igual ao environment.ts, e não
// pra um domínio de produção real. TODO: trocar bffBaseUrl/apiBaseUrl pra URL real quando o deploy
// do NimbusFlowServer existir (mesmo padrão de CardSyncWeb/CardsyncServer, que já tem essa URL).
export const environment = {
  production: true,
  bffBaseUrl: 'http://localhost:9092',
  apiBaseUrl: 'http://localhost:9092',
}

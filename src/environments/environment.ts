export const environment = {
  production: false,
  bffBaseUrl: 'http://localhost:9092',
  apiBaseUrl: 'http://localhost:9092',
  // Chave pública do par VAPID de DEV (ver application-dev.yml no NimbusFlowServer) - não é
  // segredo (só a privada é), pode ficar em texto claro aqui como qualquer chave pública.
  vapidPublicKey:
    'BFiLh6vWMZFxoyeplAguywWEibNuf_VaFiKUDJAwPtvXC9iJC3mWYIdUMCkq0KIQOutArqq6FnY0znVwKX6LkBI',
};

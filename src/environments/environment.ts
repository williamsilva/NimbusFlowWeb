export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080',
  oidc: {
    // Hostname público fixo do mock Keycloak local (ver KC_HOSTNAME no docker-compose.yml) — o
    // browser sempre acessa via localhost, tanto em `ng serve` quanto via nginx no docker compose.
    authority: 'http://localhost:8081/realms/nimbusflow',
    clientId: 'nimbusflow-frontend',
  },
};

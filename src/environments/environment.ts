export const environment = {
  production: false,
  // Backend do NimbusFlow (BFF). O login/logout OIDC contra o NimbusAuth acontece inteiramente
  // no backend — o Angular só redireciona pra cá e faz polling de /bff/me.
  apiUrl: 'http://localhost:9092',
};

import { inject } from '@angular/core';
import { CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';

import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async (_route, state: RouterStateSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  let ok: boolean;
  try {
    ok = await auth.ensureSessionChecked();
  } catch {
    // Falha de transporte (não uma rejeição de autenticação real, tipo 502/timeout) - não
    // redireciona pro /bff/login: a sessão pode continuar válida no backend, e forçar esse
    // redirect aqui é o que causava o loop (ver comentário em AuthService.fetchMe).
    return false;
  }

  if (!ok) {
    await auth.startLogin(state.url);
    return false;
  }

  const returnUrl = auth.consumeReturnUrl();
  if (returnUrl && returnUrl !== state.url) {
    return router.parseUrl(returnUrl);
  }

  return true;
};

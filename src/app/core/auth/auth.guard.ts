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
    // navigateByUrl (não retornar o UrlTree direto do guard) garante que a navegação passa de
    // novo por applyRedirects - importante pra um returnUrl antigo, salvo no sessionStorage antes
    // de um deploy que mudou as rotas (ex.: "/dashboard" virou redirect pra "/dashboard/works"),
    // continuar resolvendo pro destino atual em vez de ficar preso na rota antiga.
    void router.navigateByUrl(returnUrl);
    return false;
  }

  return true;
};

import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';

import { AuthService } from './auth.service';
import { PermissionService } from './permission.service';
import { PERMISSIONS } from './permissions.constants';

/**
 * Escolhe pra qual dos 4 dashboards mandar quem acessa "/dashboard" puro, na mesma ordem do menu
 * (Obras -> Chamados -> Tarefas -> Planos de Ação); só cai em /forbidden se o usuário não tiver
 * acesso a nenhum dos 4.
 *
 * Precisa ser canActivate, não uma `redirectTo` function: essa roda durante o recognize/
 * applyRedirects, ANTES do authGuard (que é quem dispara o /bff/me e popula o PermissionService) -
 * na primeira navegação de uma sessão nova, as permissões ainda estão vazias nesse ponto, e a
 * função sempre caía no fallback de /forbidden mesmo pra quem tinha acesso (achado 2026-09-21).
 *
 * `await auth.ensureSessionChecked()` de propósito, mesmo o authGuard do pai já chamando isso -
 * confiar só na ordem de execução dos guards (pai antes do filho) não foi suficiente na prática:
 * um teste real (logout + login como usuário do Grupo Operacional) ainda pegou esse guard rodando
 * antes do PermissionService estar com os dados definitivos, mandando pro dashboard errado (que aí
 * o permissionGuard da rota final barrava). `ensureSessionChecked()` é idempotente (early-return
 * se `meStore.isAuthenticated()` já for true), então chamar de novo aqui não duplica a chamada de
 * `/bff/me` - só garante que ESTE guard nunca decide com dado incompleto, seja qual for a ordem
 * real de execução dos guards.
 */
export const dashboardHomeGuard: CanActivateFn = async (): Promise<UrlTree> => {
  const auth = inject(AuthService);
  const perms = inject(PermissionService);
  const router = inject(Router);

  await auth.ensureSessionChecked();

  if (perms.canAccess([PERMISSIONS.SUPPORT, PERMISSIONS.OBRA.VIEW])) {
    return router.parseUrl('/dashboard/works');
  }
  if (perms.canAccess([PERMISSIONS.SUPPORT, PERMISSIONS.CHAMADO.VIEW])) {
    return router.parseUrl('/dashboard/tickets');
  }
  if (perms.canAccess([PERMISSIONS.SUPPORT, PERMISSIONS.TAREFA.VIEW, PERMISSIONS.TAREFA.EXECUTE])) {
    return router.parseUrl('/dashboard/tasks');
  }
  if (perms.canAccess([PERMISSIONS.SUPPORT, PERMISSIONS.PLANO_ACAO.VIEW])) {
    return router.parseUrl('/dashboard/action-plans');
  }

  return router.parseUrl('/forbidden');
};

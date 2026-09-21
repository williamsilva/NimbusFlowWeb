import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';

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
 * função sempre caía no fallback de /forbidden mesmo pra quem tinha acesso (achado 2026-09-21,
 * testado com usuário do Grupo Operacional logo após o login). canActivate roda depois do
 * authGuard (guards do pai executam antes dos do filho), então as permissões já estão carregadas.
 */
export const dashboardHomeGuard: CanActivateFn = (): UrlTree => {
  const perms = inject(PermissionService);
  const router = inject(Router);

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

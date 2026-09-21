import { Injectable, inject } from '@angular/core';

import { PERMISSIONS } from '@core/auth/permissions.constants';
import { PermissionService } from '@core/auth/permission.service';

/** Ranking NOMINAL de funcionários por tarefas concluídas - permissão dedicada, só ADMINISTRADOR
 *  (pedido do usuário 2026-09-20, preocupação legal/trabalhista com expor desempenho individual
 *  comparativo pro resto da equipe). Colaboradores comuns continuam vendo as métricas agregadas
 *  (sem nome) - ver TasksDashboardComponent. Movida/renomeada de DashboardPermissionPolicy
 *  (features/dashboard) pra dentro de features/tasks (pedido do usuário 2026-09-21, separação dos
 *  dashboards) - único consumidor é o widget de ranking, que migrou pro dashboard de Tarefas. */
@Injectable({ providedIn: 'root' })
export class TasksDashboardPermissionPolicy {
  private readonly perms = inject(PermissionService);

  canViewEmployeeRanking(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.DASHBOARD.RANKING_VIEW);
  }
}

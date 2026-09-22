import { Injectable, inject } from '@angular/core';

import { PERMISSIONS } from '@core/auth/permissions.constants';
import { PermissionService } from '@core/auth/permission.service';
import { TaskModel } from '@models/tasks.models';
import { TaskAssigneeTypeEnum } from '@models/enums/task-assignee-type.enum';

/** TAREFA_MANAGE edita/reatribui/muda status de qualquer tarefa (não mais criar - ver
 *  TAREFA_CREATE, dedicada, pedido do usuário 2026-09-21, mesmo padrão de CHAMADO_CREATE).
 *  TAREFA_EXECUTE, mais enxuta, só deixa o próprio assignee mover a PRÓPRIA tarefa pra frente
 *  (TODO->IN_PROGRESS->DONE) - ver TaskService.updateStatus no backend, mesma regra espelhada
 *  aqui. Ver a própria tela (menu/rota) aceita TAREFA_CONSULT OU TAREFA_EXECUTE - ver `canView`,
 *  mesma regra de TaskService#findMine. */
@Injectable({ providedIn: 'root' })
export class TasksPermissionPolicy {
  private readonly perms = inject(PermissionService);

  canView(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.TAREFA.VIEW) || this.perms.hasSupportOr(PERMISSIONS.TAREFA.EXECUTE);
  }

  canCreate(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.TAREFA.CREATE);
  }

  canManage(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.TAREFA.MANAGE);
  }

  /** Otimista pra tarefa de Departamento (pedido do usuário 2026-09-22, decisão assumida no
   *  plano): sem um "meus departamentos" exposto no frontend hoje, libera o botão pra qualquer
   *  usuário com TAREFA_EXECUTE sem checar localmente se ele é membro - o backend continua sendo a
   *  autoridade final (TaskService#isOwnTask), na pior hipótese alguém fora do departamento vê o
   *  botão habilitado e recebe 403 ao tentar. */
  canExecuteOwn(task: TaskModel): boolean {
    if (this.canManage()) return true;
    if (!this.perms.hasSupportOr(PERMISSIONS.TAREFA.EXECUTE)) return false;
    if (task.assigneeType === TaskAssigneeTypeEnum.DEPARTMENT) return true;
    return task.assigneeId === this.perms.currentUserId();
  }
}

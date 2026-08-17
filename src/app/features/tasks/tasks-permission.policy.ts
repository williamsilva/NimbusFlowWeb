import { Injectable, inject } from '@angular/core';

import { PERMISSIONS } from '@core/auth/permissions.constants';
import { PermissionService } from '@core/auth/permission.service';
import { TaskModel } from '@models/tasks.models';

/** TAREFA_MANAGE cria/atribui/edita/muda status de qualquer tarefa. TAREFA_EXECUTE, mais enxuta,
 *  só deixa o próprio assignee mover a PRÓPRIA tarefa pra frente (TODO->IN_PROGRESS->DONE) - ver
 *  TaskService.updateStatus no backend, mesma regra espelhada aqui. Ver a própria tela (menu/rota)
 *  aceita TAREFA_CONSULT OU TAREFA_EXECUTE - ver `canView`, mesma regra de TaskService#findMine. */
@Injectable({ providedIn: 'root' })
export class TasksPermissionPolicy {
  private readonly perms = inject(PermissionService);

  canView(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.TAREFA.VIEW) || this.perms.hasSupportOr(PERMISSIONS.TAREFA.EXECUTE);
  }

  canManage(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.TAREFA.MANAGE);
  }

  canExecuteOwn(task: TaskModel): boolean {
    if (this.canManage()) return true;
    if (!this.perms.hasSupportOr(PERMISSIONS.TAREFA.EXECUTE)) return false;
    return task.assigneeId === this.perms.currentUserId();
  }
}

import { Injectable, inject } from '@angular/core';

import { PERMISSIONS } from '@core/auth/permissions.constants';
import { PermissionService } from '@core/auth/permission.service';
import { MeasurementStatusEnum } from '@models/enums/measurement-status.enum';

/**
 * Diferente de AddendumsPermissionPolicy, aprovar/reprovar medição é uma única permissão
 * (PERM_MEDICAO_APPROVE), sem alçada por valor - ver MeasurementService.decideOrThrow.
 */
@Injectable({ providedIn: 'root' })
export class MeasurementsPermissionPolicy {
  private readonly perms = inject(PermissionService);

  /** Ver a própria tela (menu/rota) exige `MEDICAO_CONSULT`. */
  canView(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.MEDICAO.VIEW);
  }

  canCreate(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.MEDICAO.CREATE);
  }

  canDecide(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.MEDICAO.APPROVE);
  }

  canDelete(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.MEDICAO.DELETE);
  }

  /** PENDING (sem parcela gerada ainda) exige a mesma permissão de criar. Já decidida
   *  (APPROVED/REJECTED) exige a de decidir - editar pode cancelar uma parcela já liberada ou
   *  ressuscitar uma medição já decidida, mesmo nível de MeasurementService.requireEditAuthority. */
  canEdit(status: MeasurementStatusEnum): boolean {
    return status === MeasurementStatusEnum.PENDING ? this.canCreate() : this.canDecide();
  }

  createDisabledReason(): string | null {
    return this.canCreate() ? null : 'measurements.action.noPermission';
  }

  decideDisabledReason(): string | null {
    return this.canDecide() ? null : 'measurements.action.noPermission';
  }

  deleteDisabledReason(): string | null {
    return this.canDelete() ? null : 'measurements.action.noPermission';
  }

  editDisabledReason(status: MeasurementStatusEnum): string | null {
    return this.canEdit(status) ? null : 'measurements.action.noPermission';
  }
}

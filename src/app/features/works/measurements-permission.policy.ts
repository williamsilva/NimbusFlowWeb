import { Injectable, inject } from '@angular/core';

import { PERMISSIONS } from '@core/auth/permissions.constants';
import { PermissionService } from '@core/auth/permission.service';

/**
 * Diferente de AddendumsPermissionPolicy, aprovar/reprovar medição é uma única permissão
 * (PERM_MEDICAO_APPROVE), sem alçada por valor - ver MeasurementService.decideOrThrow.
 */
@Injectable({ providedIn: 'root' })
export class MeasurementsPermissionPolicy {
  private readonly perms = inject(PermissionService);

  canCreate(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.MEDICAO.CREATE);
  }

  canDecide(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.MEDICAO.APPROVE);
  }

  createDisabledReason(): string | null {
    return this.canCreate() ? null : 'measurements.action.noPermission';
  }

  decideDisabledReason(): string | null {
    return this.canDecide() ? null : 'measurements.action.noPermission';
  }
}

import { Injectable, inject } from '@angular/core';

import { PERMISSIONS } from '@core/auth/permissions.constants';
import { PermissionService } from '@core/auth/permission.service';
import { ApprovalTierEnum } from '@models/enums/addendum-status.enum';

/**
 * Alçada de aprovação depende do valor do aditivo (ApprovalTier, calculado pelo backend) - por
 * isso `canDecide`/`decideDisabledReason` recebem o tier em vez de serem um único booleano fixo,
 * diferente de WorksPermissionPolicy.
 */
@Injectable({ providedIn: 'root' })
export class AddendumsPermissionPolicy {
  private readonly perms = inject(PermissionService);

  canCreate(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.ADITIVO.CREATE);
  }

  canDecide(tier: ApprovalTierEnum | string): boolean {
    return this.perms.hasSupportOr(
      tier === ApprovalTierEnum.TIER2
        ? PERMISSIONS.ADITIVO.APPROVE_TIER2
        : PERMISSIONS.ADITIVO.APPROVE_TIER1,
    );
  }

  createDisabledReason(): string | null {
    return this.canCreate() ? null : 'addendums.action.noPermission';
  }

  decideDisabledReason(tier: ApprovalTierEnum | string): string | null {
    return this.canDecide(tier) ? null : 'addendums.action.noPermission';
  }
}

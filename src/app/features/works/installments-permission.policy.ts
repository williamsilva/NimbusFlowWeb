import { Injectable, inject } from '@angular/core';

import { PERMISSIONS } from '@core/auth/permissions.constants';
import { PermissionService } from '@core/auth/permission.service';

@Injectable({ providedIn: 'root' })
export class InstallmentsPermissionPolicy {
  private readonly perms = inject(PermissionService);

  canRelease(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.PARCELA.LIBERAR);
  }

  canMarkPaid(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.PARCELA.PAGAR);
  }

  canResendNotification(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.PARCELA.LIBERAR);
  }

  releaseDisabledReason(): string | null {
    return this.canRelease() ? null : 'installments.action.noPermission';
  }

  markPaidDisabledReason(): string | null {
    return this.canMarkPaid() ? null : 'installments.action.noPermission';
  }

  resendNotificationDisabledReason(): string | null {
    return this.canResendNotification() ? null : 'installments.action.noPermission';
  }
}

import { Injectable, inject } from '@angular/core';

import { PERMISSIONS } from '@core/auth/permissions.constants';
import { PermissionService } from '@core/auth/permission.service';

/**
 * Criação de sugestão é livre (qualquer usuário autenticado - spec seção 3.6), sem gate de
 * permissão. Só a mudança de status exige `SUGESTAO_MANAGE` (ver SuggestionService no backend).
 */
@Injectable({ providedIn: 'root' })
export class SuggestionsPermissionPolicy {
  private readonly perms = inject(PermissionService);

  canCreate(): boolean {
    return true;
  }

  canManageStatus(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.SUGESTAO.MANAGE);
  }
}
